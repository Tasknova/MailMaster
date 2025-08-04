import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import GmailService from '@/services/gmailService';

const GmailCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    handleCallback();
  }, []);

  const handleCallback = async () => {
    try {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');

      if (error) {
        setStatus('error');
        setErrorMessage(`OAuth error: ${error}`);
        return;
      }

      if (!code || !state) {
        setStatus('error');
        setErrorMessage('Missing authorization code or state parameter');
        return;
      }

      // Create a temporary Gmail service to handle the callback
      // The actual credentials will be loaded from the database
      const tempService = new GmailService({
        clientId: 'temp',
        clientSecret: 'temp'
      });

      // Load the actual credentials from database
      const hasCredentials = await tempService.loadCredentials();
      if (!hasCredentials) {
        setStatus('error');
        setErrorMessage('Gmail credentials not found. Please configure Gmail API settings first.');
        return;
      }

      // Handle the OAuth callback
      await tempService.handleCallback(code, state);

      setStatus('success');
      toast({
        title: "Gmail Authentication Successful",
        description: "You can now send emails through Gmail API.",
      });

      // Redirect back to settings after a short delay
      setTimeout(() => {
        navigate('/dashboard?view=settings');
      }, 2000);

    } catch (error) {
      console.error('Gmail callback error:', error);
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Authentication failed');
    }
  };

  const goToSettings = () => {
    navigate('/dashboard?view=settings');
  };

  const goToDashboard = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            {status === 'loading' && <Loader2 className="w-6 h-6 animate-spin" />}
            {status === 'success' && <CheckCircle className="w-6 h-6 text-green-600" />}
            {status === 'error' && <XCircle className="w-6 h-6 text-red-600" />}
            Gmail Authentication
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === 'loading' && (
            <div className="text-center">
              <p className="text-muted-foreground">Processing Gmail authentication...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center space-y-4">
              <div className="text-green-600">
                <CheckCircle className="w-12 h-12 mx-auto mb-2" />
                <p className="font-semibold">Authentication Successful!</p>
              </div>
              <p className="text-sm text-muted-foreground">
                You can now send emails through Gmail API. Redirecting to settings...
              </p>
              <Button onClick={goToSettings} className="w-full">
                Go to Settings
              </Button>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center space-y-4">
              <div className="text-red-600">
                <XCircle className="w-12 h-12 mx-auto mb-2" />
                <p className="font-semibold">Authentication Failed</p>
              </div>
              <p className="text-sm text-muted-foreground">{errorMessage}</p>
              <div className="flex gap-2">
                <Button onClick={goToSettings} variant="outline" className="flex-1">
                  Go to Settings
                </Button>
                <Button onClick={goToDashboard} className="flex-1">
                  Go to Dashboard
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default GmailCallback; 