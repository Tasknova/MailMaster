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
import TemplateViewer from '@/components/templates/TemplateViewer';


import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

import Login from './Login';
import { supabase } from '@/integrations/supabase/client';
import { updateUserProfileFromGoogle } from '@/lib/utils';

const Index = () => {
  const { user, loading } = useAuth();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  // Ensure authenticated users are on dashboard route
  useEffect(() => {
    if (!loading && user && location.pathname === '/') {
      navigate('/dashboard', { replace: true });
    }
  }, [user, loading, location.pathname, navigate]);

  // Validate user session
  useEffect(() => {
    const validateSession = async () => {
      if (user && !loading) {
        try {
          const { data: { session }, error } = await supabase.auth.getSession();
          if (error || !session || !session.user) {
            console.log('Invalid session, redirecting to login');
            await supabase.auth.signOut();
            navigate('/auth');
          }
        } catch (error) {
          console.error('Session validation error:', error);
          await supabase.auth.signOut();
          navigate('/auth');
        }
      }
    };

    validateSession();
  }, [user, loading, navigate]);

  // Debug: Log user state
  useEffect(() => {
    if (!loading) {
      console.log('Auth state:', { user: user?.id, loading, hasUser: !!user });
    }
  }, [user, loading]);
  
  // Initialize state based on current URL path
  const getInitialView = () => {
    const path = location.pathname;
    console.log('Current path:', path);
    if (path === '/dashboard') return 'dashboard';
    if (path === '/campaigns') return 'campaigns';
    if (path === '/campaigns/new') return 'campaign-builder';
    if (path === '/contacts') return 'contacts';
    if (path === '/templates') return 'templates';
    if (path === '/settings') return 'settings';
    return 'dashboard'; // Default to dashboard
  };

  const [currentView, setCurrentView] = useState<'dashboard' | 'campaigns' | 'campaign-builder' | 'campaign-details' | 'contacts' | 'contact-details' | 'templates' | 'settings' | 'template-viewer'>(getInitialView);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [selectedContactListId, setSelectedContactListId] = useState<string | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [activeSettingsTab, setActiveSettingsTab] = useState<string>('profile');
  const [showCreateListOnMount, setShowCreateListOnMount] = useState(false);
  const [refreshCampaigns, setRefreshCampaigns] = useState(0);
  const [selectedContactId, setSelectedContactId] = useState<string>('');
  const [profileChecked, setProfileChecked] = useState(false);


  // Sync URL with current view - simplified to prevent infinite loops
  useEffect(() => {
    const path = location.pathname;
    const newView = getInitialView();
    
    // Only update if the view actually changed and it's not a sub-view
    if (newView !== currentView && !currentView.includes('-') && !newView.includes('-')) {
      setCurrentView(newView);
    }
  }, [location.pathname]); // Removed currentView and navigate from dependencies

  // Ensure profile exists for authenticated users
  useEffect(() => {
    const ensureProfileExists = async () => {
      if (user && !loading && user.id) {
        try {
          // Check if profile exists
          const { data: existingProfile, error: fetchError } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', user.id)
            .single();

          if (fetchError && fetchError.code === 'PGRST116') {
            // Profile doesn't exist, create it
            await updateUserProfileFromGoogle(user);
          } else if (fetchError) {
            console.error('Error checking profile:', fetchError);
          }
        } catch (error) {
          console.error('Error ensuring profile exists:', error);
        }
      }
    };

    ensureProfileExists();
  }, [user?.id, loading]); // Only depend on user.id instead of entire user object



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

      // OAuth callback detected
      if (code || error || access_token || refresh_token) {
        console.log('OAuth callback detected:', { code, error, access_token: !!access_token, refresh_token: !!refresh_token });
      }

      // Handle OAuth error
      if (error) {
        console.error('OAuth error:', error);
        navigate('/auth?error=' + encodeURIComponent(error));
        return;
      }

      // Handle Supabase OAuth callback with code
      if (code) {
        try {
          console.log('Processing OAuth code:', code);
          console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
          console.log('Supabase Key:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Present' : 'Missing');
          
          // Exchange code for session
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          
          console.log('Exchange result:', { data: !!data, error: error?.message });
          
          if (error) {
            console.error('Error exchanging code for session:', error);
            console.error('Error details:', {
              message: error.message,
              status: error.status,
              name: error.name
            });
            navigate('/auth?error=' + encodeURIComponent(error.message));
            return;
          }

          console.log('Session data:', {
            hasSession: !!data.session,
            hasUser: !!data.session?.user,
            userId: data.session?.user?.id,
            userEmail: data.session?.user?.email
          });

          if (data.session?.user) {
            console.log('Session established successfully:', data.session.user.id);
            
            // Update user profile with Google data
            await updateUserProfileFromGoogle(data.session.user);
            
            // Check if this OAuth flow included Gmail permissions
            const hasGmailScope = data.session.provider_token && 
              data.session.provider_token.includes('gmail.send');
            
            if (hasGmailScope) {
              // Create Gmail credentials
              await createGmailCredentials(data.session.user);
            }
            
            // Clear URL parameters and redirect to dashboard
            window.history.replaceState({}, document.title, '/dashboard');
            navigate('/dashboard', { replace: true });
          } else {
            console.error('No session or user in exchange result');
            navigate('/auth?error=' + encodeURIComponent('No session established'));
          }
        } catch (error) {
          console.error('Error processing OAuth callback:', error);
          console.error('Error type:', typeof error);
          console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
          navigate('/auth?error=' + encodeURIComponent('Failed to process authentication'));
        }
      }

      // Handle direct token callback (fallback)
      if (access_token && refresh_token) {
        try {
          console.log('Processing direct tokens');
          
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
            navigate('/auth?error=' + encodeURIComponent(error.message));
            return;
          }

          // Get the current session to access user data
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            console.log('Session established with direct tokens:', session.user.id);
            
            // Update user profile with Google data
            await updateUserProfileFromGoogle(session.user);
            
            // Check if this OAuth flow included Gmail permissions
            const hasGmailScope = session.provider_token && 
              session.provider_token.includes('gmail.send');
            
            if (hasGmailScope) {
              // Create Gmail credentials
              await createGmailCredentials(session.user);
            }
            
            // Clear URL parameters and redirect to dashboard
            window.history.replaceState({}, document.title, '/dashboard');
            navigate('/dashboard', { replace: true });
          }
        } catch (error) {
          console.error('Error processing direct token callback:', error);
          navigate('/auth?error=' + encodeURIComponent('Failed to process authentication'));
        }
      }
    };

    handleOAuthCallback();
  }, [searchParams, navigate, location.pathname]);

  // Function to update user profile with Google data
  const updateUserProfileFromGoogle = async (user: any) => {
    try {
      const userMetadata = user.user_metadata;
      const profileData = {
        id: user.id,
        email: user.email,
        name: userMetadata?.name || userMetadata?.full_name || 'User',
        profile_photo: userMetadata?.avatar_url || userMetadata?.picture || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Upsert profile data
      const { error } = await supabase
        .from('profiles')
        .upsert(profileData, { onConflict: 'id' });

      if (error) {
        console.error('Error updating profile:', error);
      }
    } catch (error) {
      console.error('Error in updateUserProfileFromGoogle:', error);
    }
  };

  // Function to create Gmail credentials for new users
  const createGmailCredentials = async (user: any) => {
    try {
      // Get the current session to extract Gmail tokens
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.error('No session found for Gmail credentials creation');
        return;
      }

      // Check if user already has Gmail credentials
      const { data: existingCredentials } = await supabase
        .from('gmail_credentials')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle(); // Use maybeSingle instead of single to avoid 406 error

      if (existingCredentials) {
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

      const { error } = await supabase
        .from('gmail_credentials')
        .insert(credentialsData);

      if (error) {
        console.error('Error creating Gmail credentials:', error);
        throw error;
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
    setCurrentView('campaigns');
  };

  const handleViewTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId);
    setCurrentView('template-viewer');
  };



  const handleBackFromTemplateViewer = () => {
    setSelectedTemplateId(null);
    setCurrentView('campaign-builder');
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
    return null; // Let the router handle the redirect
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
          onViewTemplate={handleViewTemplate}
        />;
      case 'template-viewer':
        return selectedTemplateId ? (
          <TemplateViewer 
            templateId={selectedTemplateId} 
            onBack={handleBackFromTemplateViewer} 
          />
        ) : (
          <div>Template not found</div>
        );
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

  // Show business onboarding if user hasn't completed it


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
