import React, { useState, useEffect } from 'react';
import { useSearchParams, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from '@/components/layout/Sidebar';
import Dashboard from '@/components/Dashboard';
import CampaignList from '@/components/campaigns/CampaignList';
import CampaignBuilder from '@/components/campaigns/CampaignBuilder';
import CampaignDetails from '@/components/campaigns/CampaignDetails';
import ContactManager from '@/components/contacts/ContactManager';
import ContactDetails from '@/components/contacts/ContactDetails';
import Settings from '@/components/settings/Settings';
import TemplateManager from "@/components/templates/TemplateManager";

import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

import Login from './Login';
import { supabase } from '@/integrations/supabase/client';

const Index = () => {
  const { user, loading } = useAuth();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Initialize state based on current URL path
  const getInitialView = () => {
    const path = location.pathname;
    if (path === '/dashboard') return 'dashboard';
    if (path === '/campaigns') return 'campaigns';
    if (path === '/campaigns/new') return 'campaign-builder';
    if (path === '/contacts') return 'contacts';
    if (path === '/templates') return 'templates';
    if (path === '/settings') return 'settings';
    return 'dashboard'; // Default to dashboard
  };

  const [currentView, setCurrentView] = useState<'dashboard' | 'campaigns' | 'campaign-builder' | 'campaign-details' | 'contacts' | 'contact-details' | 'templates' | 'settings'>('dashboard');
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [selectedContactListId, setSelectedContactListId] = useState<string | null>(null);
  const [activeSettingsTab, setActiveSettingsTab] = useState<string>('profile');
  const [showCreateListOnMount, setShowCreateListOnMount] = useState(false);
  const [refreshCampaigns, setRefreshCampaigns] = useState(0);
  const [selectedContactId, setSelectedContactId] = useState<string>('');

  // Sync URL with current view
  useEffect(() => {
    const path = location.pathname;
    const currentPath = getPathForView(currentView);
    
    // Only sync URL for main views, not sub-views like campaign-builder
    if (path !== currentPath && !currentView.includes('-')) {
      navigate(currentPath, { replace: true });
    }
  }, [currentView, navigate, location.pathname]);

  // Update view when URL changes
  useEffect(() => {
    const newView = getInitialView();
    if (newView !== currentView && !currentView.includes('-')) {
      setCurrentView(newView);
    }
  }, [location.pathname]);

  // Ensure profile exists for authenticated users
  useEffect(() => {
    const ensureProfileExists = async () => {
      if (user && !loading) {
        try {
          console.log('Checking if profile exists for user:', user.email);
          
          // Check if profile exists
          const { data: existingProfile, error: fetchError } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', user.id)
            .single();

          if (fetchError && fetchError.code === 'PGRST116') {
            // Profile doesn't exist, create it
            console.log('Profile not found, creating new profile...');
            await updateUserProfileFromGoogle(user);
          } else if (fetchError) {
            console.error('Error checking profile:', fetchError);
          } else {
            console.log('Profile already exists');
          }
        } catch (error) {
          console.error('Error ensuring profile exists:', error);
        }
      }
    };

    ensureProfileExists();
  }, [user, loading]);

  const getPathForView = (view: string) => {
    switch (view) {
      case 'dashboard': return '/dashboard';
      case 'campaigns': return '/campaigns';
      case 'campaign-builder': return '/campaigns/new';
      case 'campaign-details': return '/campaigns';
      case 'contacts': return '/contacts';
      case 'contact-details': return '/contacts';
      case 'templates': return '/templates';
      case 'settings': return '/settings';
      default: return '/dashboard';
    }
  };

  // Handle OAuth callback when redirected to dashboard
  useEffect(() => {
    const handleOAuthCallback = async () => {
      const code = searchParams.get('code');
      const error = searchParams.get('error');
      const access_token = searchParams.get('access_token');
      const refresh_token = searchParams.get('refresh_token');

      console.log('OAuth callback detected:', { code: !!code, error: !!error, access_token: !!access_token, refresh_token: !!refresh_token });

      // Immediately clear URL parameters for security
      if (code || error || access_token || refresh_token) {
        window.history.replaceState({}, document.title, '/dashboard');
      }

      // Handle Supabase OAuth callback
      if (access_token && refresh_token) {
        try {
          console.log('Processing OAuth tokens...');
          
          // Validate tokens before using them
          if (!access_token.startsWith('eyJ') || !refresh_token.startsWith('eyJ')) {
            throw new Error('Invalid token format');
          }

          const { error } = await supabase.auth.setSession({
            access_token,
            refresh_token
          });

          if (error) {
            console.error('Error setting session:', error);
            // Redirect to login with error
            window.location.href = '/?error=' + encodeURIComponent(error.message);
          } else {
            console.log('Session set successfully');
            
            // Get the current session to access user data
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
              console.log('User authenticated:', session.user.email);
              
              // Always update user profile with Google data (basic info)
              await updateUserProfileFromGoogle(session.user);
              
              // Check if this OAuth flow included Gmail permissions
              const hasGmailScope = session.provider_token && 
                session.provider_token.includes('gmail.send');
              
              if (hasGmailScope) {
                // This was a Gmail configuration flow
                console.log('Gmail configuration flow detected');
                await createGmailCredentials(session.user);
                toast({
                  title: "🎉 Gmail Connected Successfully!",
                  description: "Your Gmail account is now connected. You can create and send email campaigns!",
                });
              } else {
                // This was a basic signup flow
                console.log('Basic signup completed - Gmail can be configured later');
                toast({
                  title: "Welcome to MailMaster!",
                  description: "Your account has been created successfully. You can now configure Gmail to send email campaigns.",
                });
              }
            }
          }
          // Success - user is now authenticated, no need to redirect
        } catch (error) {
          console.error('Error handling auth callback:', error);
          window.location.href = '/?error=' + encodeURIComponent('Authentication failed');
        }
      }

      // Handle errors
      if (error) {
        console.error('Authentication error:', error);
        window.location.href = '/?error=' + encodeURIComponent(error);
      }
    };

    handleOAuthCallback();
  }, [searchParams]);

  // Function to update user profile with Google data
  const updateUserProfileFromGoogle = async (user: any) => {
    try {
      console.log('Updating profile for user:', user.email);
      console.log('User metadata:', user.user_metadata);
      
      const userMetadata = user.user_metadata;
      const profileData = {
        id: user.id,
        email: user.email,
        name: userMetadata?.name || userMetadata?.full_name || 'User',
        profile_photo: userMetadata?.avatar_url || userMetadata?.picture || '',
        updated_at: new Date().toISOString()
      };

      console.log('Profile data to upsert:', profileData);

      // Upsert profile data
      const { error } = await supabase
        .from('profiles')
        .upsert(profileData, { onConflict: 'id' });

      if (error) {
        console.error('Error updating profile:', error);
        throw error;
      } else {
        console.log('Profile updated successfully with Google data');
      }
    } catch (error) {
      console.error('Error updating user profile:', error);
      // Don't throw here, as we don't want to break the auth flow
    }
  };

  // Function to create Gmail credentials for new users
  const createGmailCredentials = async (user: any) => {
    try {
      console.log('Creating Gmail credentials for user:', user.id);
      
      // Get the current session to extract Gmail tokens
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.error('No session found for Gmail credentials creation');
        return;
      }

      console.log('Session provider token:', session.provider_token ? 'Present' : 'Missing');
      console.log('Session provider refresh token:', session.provider_refresh_token ? 'Present' : 'Missing');

      // Check if user already has Gmail credentials
      const { data: existingCredentials } = await supabase
        .from('gmail_credentials')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle(); // Use maybeSingle instead of single to avoid 406 error

      if (existingCredentials) {
        console.log('Gmail credentials already exist for user');
        return;
      }

      // Create new Gmail credentials entry with tokens
      const credentialsData = {
        user_id: user.id,
        access_token: session.provider_token || null,
        refresh_token: session.provider_refresh_token || null,
        token_expires_at: session.expires_at ? new Date(session.expires_at * 1000).toISOString() : null,
        is_active: true
      };

      console.log('Creating Gmail credentials with data:', {
        user_id: credentialsData.user_id,
        has_access_token: !!credentialsData.access_token,
        has_refresh_token: !!credentialsData.refresh_token,
        token_expires_at: credentialsData.token_expires_at
      });

      const { error } = await supabase
        .from('gmail_credentials')
        .insert(credentialsData);

      if (error) {
        console.error('Error creating Gmail credentials:', error);
        throw error;
      } else {
        console.log('Gmail credentials created successfully for user');
      }
    } catch (error) {
      console.error('Error creating Gmail credentials:', error);
      throw error;
    }
  };

  const handleViewCampaign = (campaignId: string) => {
    setSelectedCampaignId(campaignId);
    setCurrentView('campaign-details');
  };

  const handleViewContact = (contactId: string) => {
    setSelectedContactId(contactId);
    setCurrentView('contact-details');
  };

  const handleCampaignSent = () => {
    setRefreshCampaigns(prev => prev + 1); // Increment to trigger refresh
  };

  const handleNavigate = (view: 'dashboard' | 'campaigns' | 'contacts' | 'campaign-builder' | 'templates' | 'settings', settingsTab?: string) => {
    setCurrentView(view);
    if (view === 'settings' && settingsTab) {
      setActiveSettingsTab(settingsTab);
    }
  };

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!user) {
    return <Login />;
  }

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard onNavigate={handleNavigate} />;
      case 'campaigns':
        return <CampaignList 
          onCreateCampaign={() => {
            setSelectedCampaignId(null); // Clear any previously selected campaign
            setCurrentView('campaign-builder');
          }} 
          onViewCampaign={(campaign) => {
            setSelectedCampaignId(campaign.id);
            setCurrentView('campaign-details');
          }}
          onEditCampaign={(campaign) => {
            setSelectedCampaignId(campaign.id);
            setCurrentView('campaign-builder');
          }}
          refreshTrigger={refreshCampaigns}
        />;
      case 'campaign-details':
        return selectedCampaignId ? (
          <CampaignDetails campaignId={selectedCampaignId} onBack={() => setCurrentView('campaigns')} />
        ) : (
          <div>Campaign not found</div>
        );
      case 'campaign-builder':
        return <CampaignBuilder 
          onBack={() => setCurrentView('campaigns')} 
          onCreateContactList={() => {
            setShowCreateListOnMount(true);
            setCurrentView('contacts');
          }}
          onCampaignSent={handleCampaignSent}
          campaignId={selectedCampaignId || undefined}
        />;
      case 'contacts':
        return <ContactManager onViewContacts={(listId) => {
          setSelectedContactListId(listId);
          setCurrentView('contact-details');
        }} showCreateListOnMount={showCreateListOnMount} onShowCreateListComplete={() => setShowCreateListOnMount(false)} />;
      case 'contact-details':
        return selectedContactListId ? (
          <ContactDetails listId={selectedContactListId} onBack={() => setCurrentView('contacts')} />
        ) : (
          <div>Contact list not found</div>
        );
      case 'templates':
        return <TemplateManager key={`templates-${Date.now()}`} />;
      case 'settings':
        return <Settings activeTab={activeSettingsTab} />;
      default:
        return <Dashboard onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="flex h-screen w-full bg-gray-50 overflow-hidden">
      <Sidebar 
        currentView={currentView} 
        onNavigate={setCurrentView}
        user={user}
      />
      <main className="flex-1 overflow-auto min-w-0">
        <div className="p-6 w-full h-full">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default Index;
