import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  LayoutDashboard, 
  Mail, 
  Users, 
  Settings, 
  FileText,
  LogOut,
  User,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  user: any;
}

interface UserProfile {
  id: string;
  email: string;
  name: string;
  profile_photo: string;
}

const Sidebar = ({ currentView, onNavigate, user }: SidebarProps) => {
  const { signOut } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (user) {
      fetchUserProfile();
    }
  }, [user]);

  const fetchUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        // Use fallback data from user metadata
        setProfile({
          id: user.id,
          email: user.email || '',
          name: user.user_metadata?.name || user.user_metadata?.full_name || 'User',
          profile_photo: user.user_metadata?.avatar_url || user.user_metadata?.picture || ''
        });
      } else {
        setProfile(data);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      toast({
        title: "Signed out",
        description: "You have been successfully signed out.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Get user display name
  const getUserDisplayName = () => {
    if (profile?.name) {
      return profile.name;
    }
    
    // Fallback to user metadata
    return user?.user_metadata?.name || user?.user_metadata?.full_name || user?.email || 'User';
  };

  const getUserInitials = () => {
    const name = getUserDisplayName();
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name[0]?.toUpperCase() || 'U';
  };

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      description: 'Overview and analytics'
    },
    {
      id: 'campaigns',
      label: 'Campaigns',
      icon: Mail,
      description: 'Manage email campaigns'
    },
    {
      id: 'contacts',
      label: 'Contacts',
      icon: Users,
      description: 'Manage contact lists'
    },
    {
      id: 'templates',
      label: 'Templates',
      icon: FileText,
      description: 'Email templates'
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      description: 'Account and preferences'
    }
  ];

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <img src="/logo.png" alt="Tasknova" className="w-20 h-20" />
          <div>
            <h1 className="text-lg font-semibold text-gray-900">MailMaster</h1>
            <p className="text-xs text-gray-500">Email Marketing Platform</p>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-gray-200">
        <Card className="bg-gray-50">
          <CardContent className="p-3">
            <div className="flex items-center space-x-3">
              <Avatar className="w-8 h-8">
                <AvatarImage src={profile?.profile_photo} alt={getUserDisplayName()} />
                <AvatarFallback className="bg-sky-100 text-sky-600 text-xs">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {getUserDisplayName()}
                </p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          
          return (
            <Button
              key={item.id}
              variant={isActive ? "default" : "ghost"}
              className={`w-full justify-start h-auto p-3 ${
                isActive ? "bg-sky-600 text-white" : "hover:bg-gray-100"
              }`}
              onClick={() => onNavigate(item.id)}
            >
              <div className="flex items-center space-x-3 w-full">
                <Icon className={`w-5 h-5 ${isActive ? "text-white" : "text-gray-600"}`} />
                <div className="flex-1 text-left">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{item.label}</span>
                    {isActive && <ChevronRight className="w-4 h-4" />}
                  </div>
                  <p className={`text-xs ${isActive ? "text-sky-100" : "text-gray-500"}`}>
                    {item.description}
                  </p>
                </div>
              </div>
            </Button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <Button 
          variant="outline" 
          className="w-full" 
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </div>
  );
};

export default Sidebar; 