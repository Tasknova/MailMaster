import { supabase } from '@/integrations/supabase/client';

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
  access_token?: string;
  refresh_token?: string;
  token_expires_at?: string;
  is_active: boolean;
}

class GmailService {
  // Single Google Cloud Console credentials for the entire SaaS application
  private static readonly CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
  private static readonly CLIENT_SECRET = import.meta.env.VITE_GOOGLE_CLIENT_SECRET || '';
  private static readonly REDIRECT_URI = `${window.location.origin}/gmail-callback`;

  // Initialize OAuth2 flow with Gmail scope
  public async authenticate(): Promise<void> {
    // Check if user already has Gmail permissions in their session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.provider_token) {
      // User already has a Google session, check if it has Gmail scopes
      try {
        const tokenParts = session.provider_token.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          const scope = payload.scope || '';
          
          if (scope.includes('https://www.googleapis.com/auth/gmail.send') || 
              scope.includes('https://www.googleapis.com/auth/gmail.compose')) {
            // User already has Gmail permissions, just save the token
            await this.saveTokens(session.provider_token, undefined, undefined);
            return;
          }
        }
      } catch (e) {
        console.log('Error checking existing token scopes:', e);
      }
    }

    // If no Gmail permissions, request them with consent prompt
    await this.requestGmailPermissions();
  }

  // Request Gmail permissions specifically (with consent prompt)
  public async requestGmailPermissions(): Promise<void> {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: GmailService.REDIRECT_URI,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
          scope: 'openid email profile https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.compose'
        }
      }
    });

    if (error) {
      throw new Error(`OAuth error: ${error.message}`);
    }
  }

  // Handle OAuth callback - this will be called after Supabase processes the OAuth
  public async handleCallback(): Promise<void> {
    // Get the current session which should now have the provider token
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.provider_token) {
      throw new Error('No provider token found in session');
    }

    // Extract access token from the provider token
    const accessToken = session.provider_token;
    
    // For Gmail API, we need to exchange the provider token for a Gmail-specific token
    // or use the provider token directly if it has the right scopes
    await this.saveTokens(accessToken, undefined, undefined);
  }



  // Save tokens to database
  private async saveTokens(accessToken: string, refreshToken?: string, expiresIn?: number): Promise<void> {
    // Import and use the GmailConfigService
    const GmailConfigService = await import('./gmailConfigService').then(m => m.default);
    await GmailConfigService.saveTokens(accessToken, refreshToken, expiresIn);
  }

  // Refresh access token using refresh token
  private async refreshAccessToken(): Promise<string> {
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
        client_id: GmailService.CLIENT_ID,
        client_secret: GmailService.CLIENT_SECRET,
        refresh_token: credentials.refresh_token,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to refresh access token');
    }

    const data = await response.json();
    await this.saveTokens(data.access_token, undefined, data.expires_in);
    return data.access_token;
  }

  // Get current access token - try database first, then Supabase session
  private async getAccessToken(): Promise<string> {
    // Import and use the GmailConfigService
    const GmailConfigService = await import('./gmailConfigService').then(m => m.default);
    
    // Try to get token from config service
    const token = await GmailConfigService.getAccessToken();
    if (token) {
      return token;
    }

    // Try to refresh token
    const refreshedToken = await GmailConfigService.refreshTokenIfNeeded();
    if (refreshedToken) {
      return refreshedToken;
    }

    // If no token available, try Supabase session as fallback
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.provider_token) {
      throw new Error('No Gmail access token available. Please authenticate with Google OAuth and grant Gmail permissions.');
    }
    return session.provider_token;
  }

  // Send email using Gmail API
  public async sendEmail(emailData: EmailData): Promise<void> {
    try {
      // Proactively refresh token if needed
      const GmailConfigService = await import('./gmailConfigService').then(m => m.default);
      await GmailConfigService.refreshTokenIfExpiringSoon();
      
      const accessToken = await this.getAccessToken();
      if (!accessToken) {
        throw new Error('No Gmail access token available. Please authenticate with Google OAuth and grant Gmail permissions.');
      }

      await this.sendEmailWithToken(emailData, accessToken);
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
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
      // Import and use the GmailConfigService
      const GmailConfigService = await import('./gmailConfigService').then(m => m.default);
      const status = await GmailConfigService.getStatus();
      return status.isAuthenticated;
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
    return GmailService.REDIRECT_URI;
  }
}

export default GmailService; 