import { supabase } from '@/integrations/supabase/client';

export interface GmailConfig {
  id: string;
  user_id: string;
  is_enabled: boolean;
  is_configured: boolean;
  last_configured_at?: string;
  access_token?: string;
  refresh_token?: string;
  token_expires_at?: string;
  created_at: string;
  updated_at: string;
}

export interface GmailStatus {
  isConfigured: boolean;
  isEnabled: boolean;
  isAuthenticated: boolean;
  lastConfigured?: Date;
  needsReauth: boolean;
}

class GmailConfigService {
  /**
   * Get Gmail configuration for current user
   */
  static async getConfig(): Promise<GmailConfig | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('gmail_credentials')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No record found, create default config
          return await this.createDefaultConfig(user.id);
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error getting Gmail config:', error);
      return null;
    }
  }

  /**
   * Create default Gmail configuration
   */
  static async createDefaultConfig(userId: string): Promise<GmailConfig> {
    const { data, error } = await supabase
      .from('gmail_credentials')
      .insert({
        user_id: userId,
        is_active: true,
        access_token: null,
        refresh_token: null,
        token_expires_at: null
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get comprehensive Gmail status
   */
  static async getStatus(): Promise<GmailStatus> {
    try {
      const config = await this.getConfig();
      if (!config) {
        return {
          isConfigured: false,
          isEnabled: false,
          isAuthenticated: false,
          needsReauth: false
        };
      }

      // Check if tokens are valid (this will also refresh if needed)
      const isAuthenticated = await this.checkTokenValidity(config);
      
      // Check if tokens are expired and need reauth
      const needsReauth = config.access_token && !isAuthenticated;

      return {
        isConfigured: !!config.access_token,
        isEnabled: config.is_active,
        isAuthenticated,
        lastConfigured: config.last_configured_at ? new Date(config.last_configured_at) : undefined,
        needsReauth
      };
    } catch (error) {
      console.error('Error getting Gmail status:', error);
      return {
        isConfigured: false,
        isEnabled: false,
        isAuthenticated: false,
        needsReauth: false
      };
    }
  }

  /**
   * Proactively refresh token if it's close to expiration
   */
  static async refreshTokenIfExpiringSoon(): Promise<boolean> {
    try {
      const config = await this.getConfig();
      if (!config?.access_token || !config?.token_expires_at) return false;

      const expiresAt = new Date(config.token_expires_at);
      const tenMinutesFromNow = new Date(Date.now() + 10 * 60 * 1000);
      
      // If token expires within 10 minutes, refresh it
      if (expiresAt <= tenMinutesFromNow) {
        console.log('Token expires soon, proactively refreshing...');
        const refreshedToken = await this.refreshTokenIfNeeded();
        return !!refreshedToken;
      }
      
      return true;
    } catch (error) {
      console.error('Error in proactive token refresh:', error);
      return false;
    }
  }

  /**
   * Check if Gmail tokens are valid
   */
  static async checkTokenValidity(config: GmailConfig): Promise<boolean> {
    if (!config.access_token) return false;

    // Check if token is expired or will expire soon (within 5 minutes)
    if (config.token_expires_at) {
      const expiresAt = new Date(config.token_expires_at);
      const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);
      if (expiresAt <= fiveMinutesFromNow) {
        // Token is expired or will expire soon, try to refresh
        const refreshedToken = await this.refreshTokenIfNeeded();
        return !!refreshedToken;
      }
    }

    // Test the token by making a simple Gmail API call
    try {
      const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
        headers: {
          'Authorization': `Bearer ${config.access_token}`,
        },
      });
      return response.ok;
    } catch {
      // If API call fails, try to refresh the token
      const refreshedToken = await this.refreshTokenIfNeeded();
      return !!refreshedToken;
    }
  }

  /**
   * Update Gmail configuration
   */
  static async updateConfig(updates: Partial<GmailConfig>): Promise<GmailConfig> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('gmail_credentials')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)
      .eq('is_active', true)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Save Gmail tokens after successful authentication
   */
  static async saveTokens(accessToken: string, refreshToken?: string, expiresIn?: number): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const tokenExpiresAt = expiresIn 
      ? new Date(Date.now() + expiresIn * 1000).toISOString()
      : null;

    await this.updateConfig({
      access_token: accessToken,
      refresh_token: refreshToken,
      token_expires_at: tokenExpiresAt,
      last_configured_at: new Date().toISOString()
    });
  }

  /**
   * Toggle Gmail enabled/disabled status
   */
  static async toggleEnabled(enabled: boolean): Promise<void> {
    await this.updateConfig({ is_active: enabled });
  }

  /**
   * Disconnect Gmail (clear tokens but keep config)
   */
  static async disconnect(): Promise<void> {
    await this.updateConfig({
      access_token: null,
      refresh_token: null,
      token_expires_at: null,
      last_configured_at: null
    });
  }

  /**
   * Check if Gmail is ready to send emails
   */
  static async isReadyToSend(): Promise<boolean> {
    const status = await this.getStatus();
    return status.isConfigured && status.isEnabled && status.isAuthenticated;
  }

  /**
   * Get access token for Gmail API calls
   */
  static async getAccessToken(): Promise<string | null> {
    const config = await this.getConfig();
    if (!config?.access_token) return null;

    // Check if token is valid and refresh if needed
    const isValid = await this.checkTokenValidity(config);
    if (!isValid) {
      // Try to refresh the token
      const refreshedToken = await this.refreshTokenIfNeeded();
      if (refreshedToken) {
        return refreshedToken;
      }
      return null;
    }

    return config.access_token;
  }

  /**
   * Refresh access token if needed
   */
  static async refreshTokenIfNeeded(): Promise<string | null> {
    const config = await this.getConfig();
    if (!config?.refresh_token) return null;

    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
          client_secret: import.meta.env.VITE_GOOGLE_CLIENT_SECRET || '',
          refresh_token: config.refresh_token,
          grant_type: 'refresh_token',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Token refresh failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        
        // If refresh token is invalid, clear the configuration
        if (response.status === 400 && errorData.error === 'invalid_grant') {
          console.log('Refresh token is invalid, clearing Gmail configuration');
          await this.disconnect();
        }
        
        throw new Error(`Failed to refresh token: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Log successful refresh
      console.log('Token refreshed successfully, expires in:', data.expires_in, 'seconds');
      
      await this.saveTokens(data.access_token, config.refresh_token, data.expires_in);
      return data.access_token;
    } catch (error) {
      console.error('Error refreshing token:', error);
      return null;
    }
  }
}

export default GmailConfigService;
