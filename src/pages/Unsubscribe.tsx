import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, Mail } from 'lucide-react';
import { AnalyticsService } from '@/services/analyticsService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const Unsubscribe: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [unsubscribed, setUnsubscribed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contactEmail, setContactEmail] = useState<string | null>(null);

  useEffect(() => {
    const handleUnsubscribe = async () => {
      const campaignId = searchParams.get('c');
      const recipientId = searchParams.get('r');
      
      if (!campaignId || !recipientId) {
        setError('Invalid unsubscribe link. Missing required parameters.');
        setLoading(false);
        return;
      }

      try {
        // Get contact information
        const { data: contact, error: contactError } = await supabase
          .from('contacts')
          .select('email, first_name, last_name')
          .eq('id', recipientId)
          .single();

        if (contactError) {
          console.error('Error fetching contact:', contactError);
          setError('Unable to find contact information.');
          setLoading(false);
          return;
        }

        setContactEmail(contact.email);

        // Track unsubscribe event
        await AnalyticsService.trackUnsubscribe(campaignId, recipientId);

        // Update contact status to unsubscribed
        const { error: updateError } = await supabase
          .from('contacts')
          .update({ status: 'unsubscribed' })
          .eq('id', recipientId);

        if (updateError) {
          console.error('Error updating contact status:', updateError);
          // Don't show error to user, still mark as unsubscribed
        }

        setUnsubscribed(true);
      } catch (error) {
        console.error('Error processing unsubscribe:', error);
        setError('An error occurred while processing your unsubscribe request.');
      } finally {
        setLoading(false);
      }
    };

    handleUnsubscribe();
  }, [searchParams]);

  const handleResubscribe = async () => {
    const recipientId = searchParams.get('r');
    
    if (!recipientId) {
      toast({
        title: "Error",
        description: "Unable to resubscribe. Please contact support.",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('contacts')
        .update({ status: 'active' })
        .eq('id', recipientId);

      if (error) {
        throw error;
      }

      toast({
        title: "Successfully resubscribed!",
        description: "You will now receive emails again.",
      });

      setUnsubscribed(false);
    } catch (error) {
      console.error('Error resubscribing:', error);
      toast({
        title: "Error",
        description: "Unable to resubscribe. Please try again or contact support.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Processing unsubscribe request...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-xl">Error</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-6">{error}</p>
            <Button onClick={() => navigate('/')} className="w-full">
              Go to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {unsubscribed ? (
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          ) : (
            <Mail className="h-12 w-12 text-blue-500 mx-auto mb-4" />
          )}
          <CardTitle className="text-xl">
            {unsubscribed ? 'Successfully Unsubscribed' : 'Email Preferences'}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          {unsubscribed ? (
            <>
              <p className="text-muted-foreground mb-4">
                {contactEmail && (
                  <span className="font-medium">{contactEmail}</span>
                )} has been successfully unsubscribed from our mailing list.
              </p>
              <p className="text-sm text-muted-foreground mb-6">
                You will no longer receive emails from this campaign. If you change your mind, you can resubscribe below.
              </p>
              <div className="space-y-3">
                <Button onClick={handleResubscribe} className="w-full">
                  Resubscribe
                </Button>
                <Button variant="outline" onClick={() => navigate('/')} className="w-full">
                  Go to Homepage
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-muted-foreground mb-6">
                You are currently subscribed to our mailing list.
              </p>
              <Button onClick={() => navigate('/')} className="w-full">
                Go to Homepage
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Unsubscribe;
