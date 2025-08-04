import { supabase } from '@/integrations/supabase/client';

interface GmailConfig {
  clientId: string;
  clientSecret: string;
}

interface EmailData {
  to: string[];
  subject: string;
  htmlContent: string;
  fromName?: string;
  fromEmail?: string;
}

interface GmailCredentials {
  id: string;
  user_id: string;
  client_id: string;
  client_secret: string;
  access_token?: string;
  refresh_token?: string;
  token_expires_at?: string;
  is_active: boolean;
}

class GmailService {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;
  private credentialsId: string | null = null;

  constructor(config: GmailConfig) {
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
    // Set the callback URL automatically - this should match what we configure in Google Cloud Console
    this.redirectUri = `${window.location.origin}/gmail-callback`;
  }

  // Save credentials to database
  public async saveCredentials(): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Check if credentials already exist
    const { data: existing } = await supabase
      .from('gmail_credentials')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (existing) {
      // Update existing credentials
      const { error } = await supabase
        .from('gmail_credentials')
        .update({
          client_id: this.clientId,
          client_secret: this.clientSecret,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id);

      if (error) throw error;
      this.credentialsId = existing.id;
    } else {
      // Insert new credentials
      const { data, error } = await supabase
        .from('gmail_credentials')
        .insert({
          user_id: user.id,
          client_id: this.clientId,
          client_secret: this.clientSecret
        })
        .select('id')
        .single();

      if (error) throw error;
      this.credentialsId = data.id;
    }
  }

  // Load credentials from database
  public async loadCredentials(): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase
      .from('gmail_credentials')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (error || !data) return false;

    this.clientId = data.client_id;
    this.clientSecret = data.client_secret;
    this.credentialsId = data.id;
    return true;
  }

  // Initialize OAuth2 flow
  public async authenticate(): Promise<void> {
    // Use Supabase OAuth with Gmail scope
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/gmail-callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
          scope: 'openid email profile https://www.googleapis.com/auth/gmail.send'
        }
      }
    });

    if (error) {
      throw new Error(`OAuth error: ${error.message}`);
    }
  }

  // Handle OAuth callback
  public async handleCallback(code: string, state: string): Promise<void> {
    // Verify state parameter
    const storedState = localStorage.getItem('gmail_oauth_state');
    if (state !== storedState) {
      throw new Error('Invalid state parameter');
    }
    localStorage.removeItem('gmail_oauth_state');

    await this.exchangeCodeForTokens(code);
  }

  // Exchange authorization code for tokens
  private async exchangeCodeForTokens(code: string): Promise<void> {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: this.redirectUri,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OAuth error: ${errorData.error_description || errorData.error}`);
    }

    const data = await response.json();
    await this.saveTokens(data.access_token, data.refresh_token, data.expires_in);
  }

  // Save tokens to database
  private async saveTokens(accessToken: string, refreshToken?: string, expiresIn?: number): Promise<void> {
    if (!this.credentialsId) {
      throw new Error('Credentials not saved. Please save settings first.');
    }

    const tokenExpiresAt = expiresIn 
      ? new Date(Date.now() + expiresIn * 1000).toISOString()
      : null;

    const { error } = await supabase
      .from('gmail_credentials')
      .update({
        access_token: accessToken,
        refresh_token: refreshToken,
        token_expires_at: tokenExpiresAt,
        updated_at: new Date().toISOString()
      })
      .eq('id', this.credentialsId);

    if (error) throw error;
  }

  // Refresh access token using refresh token
  private async refreshAccessToken(): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data: credentials, error } = await supabase
      .from('gmail_credentials')
      .select('refresh_token')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (error || !credentials?.refresh_token) {
      throw new Error('No refresh token available');
    }

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        refresh_token: credentials.refresh_token,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to refresh access token');
    }

    const data = await response.json();
    await this.saveTokens(data.access_token, undefined, data.expires_in);
  }

  // Get current access token from Supabase session
  private async getAccessToken(): Promise<string> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.provider_token) {
      throw new Error('No Google provider token available. Please authenticate with Google OAuth.');
    }

    // For Gmail API, we need to use the Google provider token, not the Supabase access token
    return session.provider_token;
  }

  // Get credentials for display purposes (without sensitive data)
  public async getCredentials(): Promise<{ clientId: string; clientSecret: string } | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('gmail_credentials')
      .select('client_id, client_secret')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (error || !data) return null;

    return {
      clientId: data.client_id,
      clientSecret: data.client_secret
    };
  }

  // Send email using Gmail API
  public async sendEmail(emailData: EmailData): Promise<void> {
    const accessToken = await this.getAccessToken();
    await this.sendEmailWithToken(emailData, accessToken);
  }

  private async sendEmailWithToken(emailData: EmailData, accessToken: string): Promise<void> {
    const email = this.createEmailMessage(emailData);
    const base64Email = btoa(unescape(encodeURIComponent(email))).replace(/\+/g, '-').replace(/\//g, '_');

    const response = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        raw: base64Email,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to send email: ${errorData.error?.message || response.statusText}`);
    }
  }

  // Create RFC 2822 formatted email message
  private createEmailMessage(emailData: EmailData): string {
    const boundary = 'boundary_' + Math.random().toString(36).substring(2);
    const fromEmail = emailData.fromEmail || 'noreply@yourdomain.com';
    const fromName = emailData.fromName || 'Your Company';
    
    const headers = [
      `From: ${fromName} <${fromEmail}>`,
      `To: ${emailData.to.join(', ')}`,
      `Subject: ${emailData.subject}`,
      `MIME-Version: 1.0`,
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
      `Date: ${new Date().toUTCString()}`,
      `Message-ID: <${Date.now()}.${Math.random().toString(36).substring(2)}@yourdomain.com>`,
    ].join('\r\n');

    const body = [
      `--${boundary}`,
      `Content-Type: text/plain; charset=UTF-8`,
      `Content-Transfer-Encoding: 7bit`,
      ``,
      this.htmlToText(emailData.htmlContent),
      `--${boundary}`,
      `Content-Type: text/html; charset=UTF-8`,
      `Content-Transfer-Encoding: 7bit`,
      ``,
      emailData.htmlContent,
      `--${boundary}--`,
    ].join('\r\n');

    return headers + '\r\n\r\n' + body;
  }

  // Convert HTML to plain text
  private htmlToText(html: string): string {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .trim();
  }

  // Check if user is authenticated with Gmail scope
  public async isAuthenticated(): Promise<boolean> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.provider_token) return false;

      // Check if the session has Gmail scope by examining the provider token
      // When using Supabase OAuth with Google, the provider token contains the Gmail scope
      try {
        const tokenParts = session.provider_token.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          const scope = payload.scope || '';
          // Check if Gmail sending scope is present
          return scope.includes('https://www.googleapis.com/auth/gmail.send');
        }
      } catch (e) {
        console.log('Error decoding provider token:', e);
        // If we can't decode the token, check if we have a provider token at all
        return !!session.provider_token;
      }

      return false;
    } catch {
      return false;
    }
  }

  // Logout (sign out from Supabase)
  public async logout(): Promise<void> {
    await supabase.auth.signOut();
  }

  // Get authentication status
  public async getAuthStatus(): Promise<{ isAuthenticated: boolean; email?: string }> {
    const isAuth = await this.isAuthenticated();
    return {
      isAuthenticated: isAuth,
    };
  }

  // Get redirect URI for Google Cloud Console configuration
  public getRedirectUri(): string {
    return this.redirectUri;
  }
}

export default GmailService; 