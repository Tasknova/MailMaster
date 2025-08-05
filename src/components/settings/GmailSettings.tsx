import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Mail, 
  Key, 
  TestTube, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  ExternalLink,
  Save,
  RefreshCw,
  Copy
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import GmailService from '@/services/gmailService';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface GmailSettingsProps {
  onBack?: () => void;
}

const GmailSettings = ({ onBack }: GmailSettingsProps) => {
  const { user } = useAuth();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [gmailService, setGmailService] = useState<GmailService | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setIsLoadingSettings(true);
    try {
      const service = new GmailService();

      setGmailService(service);
      setIsAuthenticated(await service.isAuthenticated());
    } catch (error) {
      console.error('Error loading Gmail settings:', error);
    } finally {
      setIsLoadingSettings(false);
    }
  };

  const authenticate = async () => {
    setIsLoading(true);
    try {
      if (!gmailService) {
        const service = new GmailService();
        setGmailService(service);
      }

      await gmailService!.authenticate();
      // The user will be redirected to Google OAuth, then back to our callback
      // The authentication status will be updated when they return
    } catch (error) {
      console.error('Authentication error:', error);
      toast({
        title: "Authentication Failed",
        description: error instanceof Error ? error.message : "Failed to start authentication.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const logout = async () => {
    if (!gmailService) return;

    setIsLoading(true);
    try {
      await gmailService.logout();
      setIsAuthenticated(false);
      toast({
        title: "Logged Out",
        description: "Gmail authentication has been cleared.",
      });
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: "Error",
        description: "Failed to logout from Gmail.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testConnection = async () => {
    if (!gmailService || !isAuthenticated) {
      toast({
        title: "Not Authenticated",
        description: "Please authenticate with Gmail first.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await gmailService.sendEmail({
        to: ['test@example.com'],
        subject: 'Test Email from MailMaster',
        htmlContent: '<p>This is a test email to verify Gmail API connection.</p>',
        fromName: 'MailMaster Test'
      });
      
      toast({
        title: "Connection Test Successful",
        description: "Gmail API is working correctly!",
      });
    } catch (error) {
      console.error('Test connection error:', error);
      toast({
        title: "Connection Test Failed",
        description: error instanceof Error ? error.message : "Failed to send test email",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Debug function to check environment variables and authentication status
  const debugAuthStatus = async () => {
    console.log('=== Gmail Authentication Debug ===');
    console.log('Environment Variables:');
    console.log('VITE_GOOGLE_CLIENT_ID:', import.meta.env.VITE_GOOGLE_CLIENT_ID ? 'SET' : 'NOT SET');
    console.log('VITE_GOOGLE_CLIENT_SECRET:', import.meta.env.VITE_GOOGLE_CLIENT_SECRET ? 'SET' : 'NOT SET');
    console.log('Redirect URI:', gmailService?.getRedirectUri());
    
    console.log('\nCurrent Authentication Status:');
    console.log('isAuthenticated:', isAuthenticated);
    
    if (gmailService) {
      const authStatus = await gmailService.getAuthStatus();
      console.log('GmailService auth status:', authStatus);
    }
    
    // Check Supabase session
    const { data: { session } } = await supabase.auth.getSession();
    console.log('\nSupabase Session:');
    console.log('Has session:', !!session);
    console.log('Has provider token:', !!session?.provider_token);
    console.log('Provider:', session?.user?.app_metadata?.provider);
    
    // Check database credentials
    const { data: credentials, error } = await supabase
      .from('gmail_credentials')
      .select('*')
      .eq('user_id', user?.id)
      .eq('is_active', true)
      .single();
    
    console.log('\nDatabase Credentials:');
    console.log('Has credentials:', !!credentials);
    console.log('Credentials error:', error);
    if (credentials) {
      console.log('Has access token:', !!credentials.access_token);
      console.log('Has refresh token:', !!credentials.refresh_token);
      console.log('Token expires at:', credentials.token_expires_at);
    }
    
    console.log('=== End Debug ===');
    
    toast({
      title: "Debug Info Logged",
      description: "Check the browser console for detailed authentication information.",
    });
  };


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gmail API Settings</h1>
          <p className="text-muted-foreground">
            Configure Gmail API to send emails through your Gmail account
          </p>
        </div>
        {onBack && (
          <Button variant="outline" onClick={onBack}>
            Back to Settings
          </Button>
        )}
      </div>

      {/* Setup Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Setup Instructions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                         <h3 className="font-semibold text-blue-800 mb-2">How Gmail Authentication Works:</h3>
             <p className="text-sm text-blue-700 mb-3">
               This app uses Supabase's built-in Google OAuth for authentication. The permissions you grant depend on whether you're signing up or logging in.
             </p>
             <div className="text-sm text-blue-700 space-y-1">
               <p><strong>Signup vs Login:</strong></p>
               <ul className="list-disc list-inside space-y-1">
                 <li><strong>Signup:</strong> You'll be asked to grant Gmail permissions (one-time)</li>
                 <li><strong>Login:</strong> No permission prompts - uses existing permissions</li>
                 <li><strong>Gmail Settings:</strong> Only prompts if additional permissions are needed</li>
               </ul>
             </div>
          </div>
        </CardContent>
      </Card>

      {/* Google OAuth Setup */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            Gmail Integration Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                                 <h4 className="font-medium text-green-900 mb-2">Using Supabase OAuth</h4>
                 <p className="text-sm text-green-800 mb-3">
                   This app uses Supabase's Google OAuth integration, which means:
                 </p>
                 <ul className="text-sm text-green-800 space-y-1 list-disc list-inside">
                   <li>No separate Google Cloud Console setup required</li>
                   <li>Uses the same Google account you signed up with</li>
                   <li>Automatically handles token management and refresh</li>
                   <li>Secure and managed by Supabase</li>
                 </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Authentication Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Authentication Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoadingSettings ? (
            <div className="flex items-center justify-center py-4">
              <RefreshCw className="w-5 h-5 animate-spin mr-2" />
              <span>Loading authentication status...</span>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span>Gmail API Status:</span>
                  {isAuthenticated ? (
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Authenticated
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      <XCircle className="w-3 h-3 mr-1" />
                      Not Authenticated
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                {!isAuthenticated ? (
                  <Button 
                    onClick={authenticate} 
                    disabled={isLoading}
                    className="flex-1"
                  >
                    {isLoading ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Mail className="w-4 h-4 mr-2" />
                    )}
                    Authenticate with Google
                  </Button>
                ) : (
                  <>
                    <Button 
                      onClick={testConnection} 
                      disabled={isLoading}
                      variant="outline"
                      className="flex-1"
                    >
                      <TestTube className="w-4 h-4 mr-2" />
                      Test Connection
                    </Button>
                    <Button 
                      onClick={logout} 
                      variant="outline"
                      className="flex-1"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Logout
                    </Button>
                  </>
                )}
              </div>
              
              {/* Debug Button */}
              <div className="mt-2">
                <Button 
                  onClick={debugAuthStatus} 
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Debug Authentication Status
                </Button>
              </div>

              {isAuthenticated && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-sm text-green-800">
                    ✅ Gmail API is connected and ready to send emails!
                  </p>
                </div>
              )}

              {!isAuthenticated && !isLoadingSettings && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    ℹ️ Click "Authenticate with Google" to grant Gmail sending permissions and get your profile information.
                  </p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Help & Troubleshooting */}
      <Card>
        <CardHeader>
          <CardTitle>Help & Troubleshooting</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm space-y-2">
            <p><strong>Common Issues:</strong></p>
                         <ul className="list-disc list-inside space-y-1 text-muted-foreground">
               <li>If authentication fails, try signing out and signing back in</li>
               <li>Make sure you're using the same Google account you signed up with</li>
               <li>During signup, you'll be asked for Gmail permissions (one-time only)</li>
               <li>During login, no permission prompts will appear</li>
               <li>If you need additional permissions later, use the "Authenticate with Google" button</li>
               <li>Contact support if you need to change your Google account</li>
             </ul>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <a href="https://developers.google.com/gmail/api/guides" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-2" />
                Gmail API Docs
              </a>
            </Button>
                         <Button variant="outline" size="sm" onClick={async () => {
               console.log('Debug: User data');
               console.log('User:', user);
               console.log('User metadata:', user?.user_metadata);
               const session = await supabase.auth.getSession();
               console.log('Session:', session);
             }}>
              <AlertCircle className="w-4 h-4 mr-2" />
              Debug User Data
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GmailSettings; 