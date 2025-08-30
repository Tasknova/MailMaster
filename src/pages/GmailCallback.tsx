import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

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
      const error = searchParams.get('error');

      if (error) {
        setStatus('error');
        setErrorMessage(`OAuth error: ${error}`);
        return;
      }

      // Get the current session to check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setStatus('error');
        setErrorMessage('No active session found. Please sign in again.');
        return;
      }

      console.log('Gmail callback - Session found for user:', session.user.email);
      console.log('Provider token present:', !!session.provider_token);
      console.log('Provider refresh token present:', !!session.provider_refresh_token);

      // Check if this is a Gmail configuration flow (has Gmail scope)
      const hasGmailScope = session.provider_token && session.provider_refresh_token;

      if (hasGmailScope) {
        // Create Gmail credentials in the database
        await createGmailCredentials(session.user);
        
        setStatus('success');
        toast({
          title: "🎉 Gmail Connected Successfully!",
          description: "Your Gmail account is now connected. You can create and send email campaigns!",
        });
        
        // Redirect to dashboard after success
        setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 2000);
      } else {
        setStatus('error');
        setErrorMessage('Gmail permissions not granted. Please try again and make sure to grant Gmail access.');
      }

    } catch (error) {
      console.error('Gmail callback error:', error);
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Authentication failed');
    }
  };

  const createGmailCredentials = async (user: any) => {
    try {
      console.log('Creating Gmail credentials for user:', user.id);
      
      // Get the current session to extract Gmail tokens
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.error('No session found for Gmail credentials creation');
        throw new Error('No session found');
      }

      // Import and use the GmailConfigService
      const GmailConfigService = await import('@/services/gmailConfigService').then(m => m.default);
      
      // Save tokens using the config service
      await GmailConfigService.saveTokens(
        session.provider_token,
        session.provider_refresh_token,
        session.expires_at ? session.expires_at - Math.floor(Date.now() / 1000) : undefined
      );

      console.log('Gmail credentials saved successfully');
    } catch (error) {
      console.error('Error creating Gmail credentials:', error);
      throw error;
    }
  };

  const goToDashboard = () => {
    navigate('/dashboard', { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            {status === 'loading' && <Loader2 className="w-6 h-6 animate-spin" />}
            {status === 'success' && <CheckCircle className="w-6 h-6 text-green-600" />}
            {status === 'error' && <XCircle className="w-6 h-6 text-red-600" />}
            Gmail Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === 'loading' && (
            <div className="text-center">
              <p className="text-muted-foreground">Processing Gmail configuration...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center space-y-4">
              <div className="text-green-600">
                <CheckCircle className="w-12 h-12 mx-auto mb-2" />
                <p className="font-semibold">Gmail Connected Successfully!</p>
              </div>
              <p className="text-sm text-muted-foreground">
                Your Gmail account is now connected. You can create and send email campaigns!
              </p>
              <p className="text-xs text-muted-foreground">
                Redirecting to dashboard...
              </p>
              <Button onClick={goToDashboard} className="w-full">
                Go to Dashboard
              </Button>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center space-y-4">
              <div className="text-red-600">
                <XCircle className="w-12 h-12 mx-auto mb-2" />
                <p className="font-semibold">Configuration Failed</p>
              </div>
              <p className="text-sm text-muted-foreground">
                {errorMessage}
              </p>
              <Button onClick={goToDashboard} className="w-full">
                Go to Dashboard
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default GmailCallback; 