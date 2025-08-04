import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface GoogleUserProfile {
  id: string;
  email: string;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
}

const AuthCallback = () => {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const handleAuthCallback = async () => {
      const code = searchParams.get('code');
      const error = searchParams.get('error');
      const access_token = searchParams.get('access_token');
      const refresh_token = searchParams.get('refresh_token');

      // Handle Gmail OAuth callback
      if (code && !access_token) {
        if (window.opener) {
          window.opener.postMessage({
            type: 'GMAIL_AUTH_SUCCESS',
            code: code
          }, window.location.origin);
          window.close();
          return;
        }
      }

      // Handle Supabase OAuth callback with Google profile
      if (access_token && refresh_token) {
        try {
          const { error } = await supabase.auth.setSession({
            access_token,
            refresh_token
          });

          if (error) {
            window.location.href = '/?error=' + encodeURIComponent(error.message);
          } else {
            // Get user profile from Google
            try {
              const profileResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
                headers: {
                  'Authorization': `Bearer ${access_token}`
                }
              });

              if (profileResponse.ok) {
                const profile: GoogleUserProfile = await profileResponse.json();
                
                // Update user metadata with Google profile information
                await supabase.auth.updateUser({
                  data: {
                    full_name: profile.name,
                    first_name: profile.given_name,
                    last_name: profile.family_name,
                    avatar_url: profile.picture,
                    email: profile.email
                  }
                });
              }
            } catch (profileError) {
              console.warn('Failed to fetch Google profile:', profileError);
            }

            // Redirect to dashboard after successful authentication
            window.location.href = '/';
          }
        } catch (error) {
          window.location.href = '/?error=' + encodeURIComponent('Authentication failed');
        }
        return;
      }

      // Handle errors
      if (error) {
        if (window.opener) {
          window.opener.postMessage({
            type: 'GMAIL_AUTH_ERROR',
            error: error
          }, window.location.origin);
          window.close();
        } else {
          window.location.href = '/?error=' + encodeURIComponent(error);
        }
        return;
      }

      // If no tokens and no error, redirect to home
      if (window.opener) {
        window.close();
      } else {
        window.location.href = '/';
      }
    };

    handleAuthCallback();
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Completing Authentication...
        </h2>
        <p className="text-gray-600">
          Please wait while we complete your authentication.
        </p>
      </div>
    </div>
  );
};

export default AuthCallback; 