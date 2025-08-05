import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  user: any;
}

const Sidebar = ({ currentView, onNavigate, user }: SidebarProps) => {
  const { signOut } = useAuth();

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

  // Debug function to check user data
  const debugUserData = () => {
    console.log('User object:', user);
    console.log('User metadata:', user?.user_metadata);
    console.log('User app metadata:', user?.app_metadata);
    console.log('User raw app metadata:', user?.raw_app_meta_data);
  };

  // Get user display name
  const getUserDisplayName = () => {
    // Try different possible locations for user name
    const firstName = user?.user_metadata?.first_name || 
                     user?.user_metadata?.name?.split(' ')[0] ||
                     user?.raw_app_meta_data?.provider === 'google' ? user?.user_metadata?.full_name?.split(' ')[0] : null;
    
    const lastName = user?.user_metadata?.last_name || 
                    user?.user_metadata?.name?.split(' ')[1] ||
                    user?.raw_app_meta_data?.provider === 'google' ? user?.user_metadata?.full_name?.split(' ')[1] : null;

    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    } else if (firstName) {
      return firstName;
    } else if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name;
    } else if (user?.user_metadata?.name) {
      return user.user_metadata.name;
    }
    
    return user?.email || 'User';
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
    },
    {
      id: 'test-width',
      label: 'Width Test',
      icon: Settings,
      description: 'Debug width issues'
    },
    {
      id: 'debug-width',
      label: 'Debug Width',
      icon: Settings,
      description: 'Raw width debug'
    }
  ];

  return (
    <div style={{ 
      width: '256px', 
      backgroundColor: 'white', 
      borderRight: '1px solid #e5e7eb', 
      display: 'flex', 
      flexDirection: 'column',
      flexShrink: 0
    }}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Mail className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">MailMaster</h1>
            <p className="text-xs text-gray-500">Email Marketing</p>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-gray-200">
        <Card className="bg-gray-50">
          <CardContent className="p-3">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-blue-600" />
              </div>
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
                isActive ? "bg-blue-600 text-white" : "hover:bg-gray-100"
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
                  <p className={`text-xs ${isActive ? "text-blue-100" : "text-gray-500"}`}>
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