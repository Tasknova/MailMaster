import { useState } from "react";
import { Navigate } from "react-router-dom";
import HeroSection from "@/components/HeroSection";
import Dashboard from "@/components/Dashboard";
import Sidebar from "@/components/Sidebar";
import CampaignList from "@/components/campaigns/CampaignList";
import CampaignBuilder from "@/components/campaigns/CampaignBuilder";
import ContactManager from "@/components/contacts/ContactManager";
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState<'dashboard' | 'campaigns' | 'campaign-builder' | 'contacts'>('dashboard');
  const [showApp, setShowApp] = useState(false);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-subtle">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Redirect to auth if not authenticated
  if (!user) {
    if (!showApp) {
      return (
        <div className="min-h-screen">
          <HeroSection />
          <div className="fixed bottom-8 right-8 flex gap-4">
            <a
              href="/auth"
              className="bg-gradient-primary text-white px-6 py-3 rounded-full shadow-elegant hover:shadow-glow transition-smooth font-medium"
            >
              Get Started →
            </a>
            <button
              onClick={() => setShowApp(true)}
              className="bg-white/10 backdrop-blur-sm text-white px-6 py-3 rounded-full shadow-elegant hover:shadow-glow transition-smooth font-medium border border-white/20"
            >
              View Demo →
            </button>
          </div>
        </div>
      );
    }
    return <Navigate to="/auth" replace />;
  }

  // Render main app content based on current view
  const renderContent = () => {
    switch (currentView) {
      case 'campaigns':
        return <CampaignList onCreateCampaign={() => setCurrentView('campaign-builder')} />;
      case 'campaign-builder':
        return <CampaignBuilder onBack={() => setCurrentView('campaigns')} />;
      case 'contacts':
        return <ContactManager />;
      default:
        return <Dashboard onNavigate={setCurrentView} />;
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar activeItem={currentView} onNavigate={setCurrentView} />
      <main className="flex-1 overflow-auto p-8">
        {renderContent()}
      </main>
    </div>
  );
};

export default Index;
