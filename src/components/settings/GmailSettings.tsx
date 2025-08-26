import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  Copy,
  ArrowRight,
  User,
  Shield
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import GmailService from '@/services/gmailService';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface GmailSettingsProps {
  onBack?: () => void;
}

const GmailSettings = ({ onBack }: GmailSettingsProps) => {
  const { user, configureGmail } = useAuth();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [gmailService, setGmailService] = useState<GmailService | null>(null);
  const [isNewUser, setIsNewUser] = useState(false);

  useEffect(() => {
    loadSettings();
    checkIfNewUser();
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

  const checkIfNewUser = async () => {
    try {
      // Check if user has any campaigns or contact lists
      const { data: campaigns } = await supabase
        .from('campaigns')
        .select('id')
        .eq('user_id', user?.id)
        .limit(1);

      const { data: lists } = await supabase
        .from('contact_lists')
        .select('id')
        .eq('user_id', user?.id)
        .limit(1);

      // Check if user has Gmail credentials
      const { data: credentials } = await supabase
        .from('gmail_credentials')
        .select('id')
        .eq('user_id', user?.id)
        .eq('is_active', true)
        .maybeSingle(); // Use maybeSingle instead of single to avoid 406 error

      // Consider user new if they have no campaigns, no lists, and no Gmail configured
      setIsNewUser((!campaigns || campaigns.length === 0) && 
                   (!lists || lists.length === 0) && 
                   !credentials);
    } catch (error) {
      console.error('Error checking if new user:', error);
      setIsNewUser(true);
    }
  };

  const connectGmail = async () => {
    setIsLoading(true);
    try {
      // Use the configureGmail function which includes Gmail permissions
      const { error } = await configureGmail();
      
      if (error) {
        console.error('Gmail connection error:', error);
        toast({
          title: "Connection Failed",
          description: error.message || "Failed to connect Gmail account",
          variant: "destructive",
        });
      } else {
        toast({
          title: "🎉 Gmail Connected Successfully!",
          description: "Your Gmail account is now connected. You can create and send email campaigns!",
        });
      }
    } catch (error) {
      console.error('Error connecting Gmail:', error);
      toast({
        title: "Connection Failed",
        description: "Failed to connect Gmail account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
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
        subject: 'Test Email from Tasknova MailMaster',
        htmlContent: '<p>This is a test email to verify Gmail API connection.</p>',
        fromName: 'Tasknova MailMaster Test'
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gmail Configuration</h1>
          <p className="text-muted-foreground">
            Connect your Gmail account to send email campaigns
          </p>
        </div>
        {onBack && (
          <Button variant="outline" onClick={onBack}>
            Back to Settings
          </Button>
        )}
      </div>

      {/* New User Welcome */}
      {isNewUser && !isAuthenticated && (
        <Alert className="border-blue-200 bg-blue-50">
          <User className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <div className="space-y-2">
              <p><strong>Welcome to MailMaster!</strong> To get started with email campaigns, you need to connect your Gmail account.</p>
              <p className="text-sm">Your profile information has already been imported from Google. Now we need Gmail permissions to send emails.</p>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Gmail Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Gmail Connection Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoadingSettings ? (
            <div className="flex items-center justify-center py-4">
              <RefreshCw className="w-5 h-5 animate-spin mr-2" />
              <span>Loading connection status...</span>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span>Gmail API Status:</span>
                  {isAuthenticated ? (
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Connected
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      <XCircle className="w-3 h-3 mr-1" />
                      Not Connected
                    </Badge>
                  )}
                </div>
              </div>

              {!isAuthenticated ? (
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-blue-900 mb-2">Gmail Permissions Required</h4>
                        <p className="text-sm text-blue-800 mb-3">
                          To send email campaigns, we need additional Gmail permissions:
                        </p>
                        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                          <li><strong>Send emails on your behalf</strong> - Required for email campaigns</li>
                          <li><strong>No access to your emails</strong> - We only send, never read</li>
                          <li><strong>Secure token storage</strong> - Managed by Supabase</li>
                          <li><strong>Revocable anytime</strong> - You can disconnect at any time</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <Button 
                    onClick={connectGmail} 
                    disabled={isLoading}
                    size="lg"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {isLoading ? (
                      <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                    ) : (
                      <Mail className="w-5 h-5 mr-2" />
                    )}
                    Connect Your Gmail Account
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>

                  <p className="text-xs text-muted-foreground text-center">
                    You'll be redirected to Google to grant Gmail sending permissions
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-green-900 mb-2">✅ Gmail Successfully Connected!</h4>
                        <p className="text-sm text-green-800">
                          Your Gmail account is connected and ready to send email campaigns. 
                          You can now create and send email campaigns to your contacts.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Mail className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-blue-900 mb-2">What's Next?</h4>
                        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                          <li>Create your first email campaign</li>
                          <li>Import your contact lists</li>
                          <li>Design beautiful email templates</li>
                          <li>Track campaign performance</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
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
                      Disconnect
                    </Button>
                  </div>
                </div>
              )}
              
               {/* Help & Troubleshooting */}
               <Card>
                 <CardHeader>
                   <CardTitle>Help & Troubleshooting</CardTitle>
                 </CardHeader>
                 <CardContent className="space-y-3">
                   <div className="text-sm space-y-2">
                     <p><strong>How it works:</strong></p>
                     <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                       <li><strong>Signup:</strong> Only requests basic profile information (name, email, photo)</li>
                       <li><strong>Gmail Configuration:</strong> Requests additional Gmail sending permissions</li>
                       <li><strong>Security:</strong> We never access your personal emails or contacts</li>
                       <li><strong>Control:</strong> You can disconnect Gmail anytime from settings</li>
                     </ul>
                   </div>
                   
                   <div className="text-sm space-y-2">
                     <p><strong>Common Issues:</strong></p>
                     <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                       <li>If connection fails, try refreshing the page and trying again</li>
                       <li>Make sure you're using the same Google account you signed up with</li>
                       <li>During Gmail configuration, you'll be asked for sending permissions</li>
                       <li>If you need to change your Google account, contact support</li>
                     </ul>
                   </div>
                   
                   <div className="flex gap-2">
                     <Button variant="outline" size="sm" asChild>
                       <a href="https://developers.google.com/gmail/api/guides" target="_blank" rel="noopener noreferrer">
                         <ExternalLink className="w-4 h-4 mr-2" />
                         Gmail API Docs
                       </a>
                     </Button>
                   </div>
                 </CardContent>
               </Card>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default GmailSettings; 