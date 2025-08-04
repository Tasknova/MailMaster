import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
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
import AuthCallback from './AuthCallback';
import Login from './Login';
import { supabase } from '@/integrations/supabase/client';

const Index = () => {
  const { user, loading } = useAuth();
  const [searchParams] = useSearchParams();
  const [currentView, setCurrentView] = useState<'dashboard' | 'campaigns' | 'campaign-builder' | 'campaign-details' | 'contacts' | 'contact-details' | 'settings' | 'templates' | 'auth-callback'>('dashboard');
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('');
  const [selectedContactListId, setSelectedContactListId] = useState<string>('');
  const [selectedContactId, setSelectedContactId] = useState<string>('');

  // Handle OAuth callback when redirected to dashboard
  useEffect(() => {
    const handleOAuthCallback = async () => {
      const code = searchParams.get('code');
      const error = searchParams.get('error');
      const access_token = searchParams.get('access_token');
      const refresh_token = searchParams.get('refresh_token');

      // Immediately clear URL parameters for security
      if (code || error || access_token || refresh_token) {
        window.history.replaceState({}, document.title, '/dashboard');
      }

      // Handle Supabase OAuth callback
      if (access_token && refresh_token) {
        try {
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

  const handleViewCampaign = (campaignId: string) => {
    setSelectedCampaignId(campaignId);
    setCurrentView('campaign-details');
  };

  const handleViewContact = (contactId: string) => {
    setSelectedContactId(contactId);
    setCurrentView('contact-details');
  };

  const handleNavigate = (view: 'dashboard' | 'campaigns' | 'contacts' | 'campaign-builder' | 'templates' | 'settings') => {
    setCurrentView(view);
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
          onViewCampaign={(campaign) => {
            setSelectedCampaignId(campaign.id);
            setCurrentView('campaign-details');
          }}
          onCreateCampaign={() => setCurrentView('campaign-builder')}
        />;
      case 'campaign-details':
        return selectedCampaignId ? (
          <CampaignDetails campaignId={selectedCampaignId} onBack={() => setCurrentView('campaigns')} />
        ) : (
          <div>Campaign not found</div>
        );
      case 'campaign-builder':
        return <CampaignBuilder onBack={() => setCurrentView('campaigns')} />;
      case 'contacts':
        return <ContactManager onViewContacts={(listId) => {
          setSelectedContactListId(listId);
          setCurrentView('contact-details');
        }} />;
      case 'contact-details':
        return selectedContactListId ? (
          <ContactDetails listId={selectedContactListId} onBack={() => setCurrentView('contacts')} />
        ) : (
          <div>Contact list not found</div>
        );
      case 'templates':
        return <TemplateManager key={`templates-${Date.now()}`} />;
      case 'settings':
        return <Settings />;
      case 'auth-callback':
        return <AuthCallback />;
      default:
        return <Dashboard onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar 
        currentView={currentView} 
        onNavigate={setCurrentView}
        user={user}
      />
      <main className="flex-1 overflow-auto">
        <div className="p-6">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default Index;
