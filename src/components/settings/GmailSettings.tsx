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
      const service = new GmailService({
        clientId: '',
        clientSecret: ''
      });

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
        const service = new GmailService({
          clientId: '',
          clientSecret: ''
        });
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
      // Send a test email to yourself
      await gmailService.sendEmail({
        to: [user?.email || 'test@example.com'],
        subject: 'Gmail API Test - MailMaster',
        htmlContent: `
          <html>
            <body>
              <h2>Gmail API Test Successful! 🎉</h2>
              <p>This email was sent using the Gmail API integration in MailMaster.</p>
              <p><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
              <hr>
              <p><em>If you received this email, your Gmail API integration is working correctly!</em></p>
            </body>
          </html>
        `,
        fromName: 'MailMaster Test',
      });

      toast({
        title: "Test Successful",
        description: "Gmail API connection is working correctly! Check your email.",
      });
    } catch (error) {
      console.error('Test error:', error);
      toast({
        title: "Test Failed",
        description: error instanceof Error ? error.message : "Failed to send test email.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
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
            <h3 className="font-semibold text-blue-800 mb-2">Google OAuth Setup Instructions:</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-blue-700">
              <li>Go to <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="underline">Google Cloud Console</a></li>
              <li>Create a new project or select an existing one</li>
              <li>Enable the Gmail API for your project</li>
              <li>Go to "Credentials" and create an OAuth 2.0 Client ID</li>
              <li>Set the redirect URI to: <code className="bg-blue-100 px-1 rounded">http://localhost:8080/auth/callback</code></li>
              <li>Add the Gmail scope: <code className="bg-blue-100 px-1 rounded">https://www.googleapis.com/auth/gmail.send</code></li>
              <li>Configure the credentials in your Supabase project</li>
            </ol>
          </div>


        </CardContent>
      </Card>

      {/* Google OAuth Setup */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            Google OAuth Setup
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900 mb-2">Setup Required</h4>
                <p className="text-sm text-blue-800 mb-3">
                  To use Gmail sending features, you need to configure Google OAuth in your Supabase project:
                </p>
                <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                  <li>Go to your Supabase Dashboard → Authentication → Providers</li>
                  <li>Enable Google provider</li>
                  <li>Add your Google OAuth Client ID and Secret</li>
                  <li>Set the redirect URL to: <code className="bg-blue-100 px-1 rounded">http://localhost:8080/auth/callback</code></li>
                  <li>Add Gmail scope: <code className="bg-blue-100 px-1 rounded">https://www.googleapis.com/auth/gmail.send</code></li>
                </ol>
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
              <li>Make sure Gmail API is enabled in Google Cloud Console</li>
              <li>Verify Google OAuth is properly configured in Supabase</li>
              <li>Check that the Gmail scope is added to your OAuth configuration</li>
              <li>Ensure your OAuth consent screen includes the Gmail scope</li>
              <li>Make sure the redirect URL matches your Supabase configuration</li>
            </ul>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <a href="https://developers.google.com/gmail/api/guides" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-2" />
                Gmail API Docs
              </a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-2" />
                Google Cloud Console
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GmailSettings; 