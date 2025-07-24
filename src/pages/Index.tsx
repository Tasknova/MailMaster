import HeroSection from "@/components/HeroSection";
import Dashboard from "@/components/Dashboard";
import Sidebar from "@/components/Sidebar";
import { useState } from "react";

const Index = () => {
  const [showApp, setShowApp] = useState(false);

  if (!showApp) {
    return (
      <div className="min-h-screen">
        <HeroSection />
        <div className="fixed bottom-8 right-8">
          <button
            onClick={() => setShowApp(true)}
            className="bg-gradient-primary text-white px-6 py-3 rounded-full shadow-elegant hover:shadow-glow transition-smooth font-medium"
          >
            View App Dashboard →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <Dashboard />
      </main>
    </div>
  );
};

export default Index;
