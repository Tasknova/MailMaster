import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  LayoutDashboard, 
  Mail, 
  Users, 
  FileText, 
  Settings, 
  Plus,
  ChevronDown,
  LogOut
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

interface SidebarProps {
  activeItem: string;
  onNavigate: (view: 'dashboard' | 'campaigns' | 'campaign-builder' | 'campaign-details' | 'contacts' | 'contact-details' | 'settings' | 'templates') => void;
}

const Sidebar = ({ activeItem, onNavigate }: SidebarProps) => {
  const { user, signOut } = useAuth();
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "campaigns", label: "Campaigns", icon: Mail },
    { id: "templates", label: "Templates", icon: FileText },
    { id: "contacts", label: "Contact Lists", icon: Users },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="w-64 bg-gradient-card border-r border-border h-screen flex flex-col">
      {/* Logo & Brand */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
            <Mail className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-xl font-bold bg-gradient-hero bg-clip-text text-transparent">
            Email Master
          </h1>
        </div>
      </div>

      {/* Gmail Account Selector */}
      <div className="p-4 border-b border-border">
        <Card className="p-3 cursor-pointer hover:shadow-card transition-smooth" 
              onClick={() => setIsAccountDropdownOpen(!isAccountDropdownOpen)}>
          <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-xs font-semibold text-primary-foreground">
                    {user?.email?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="text-sm">
                  <div className="font-medium">{user?.email}</div>
                  <div className="text-muted-foreground text-xs">Connected</div>
                </div>
              </div>
            <ChevronDown className={`w-4 h-4 transition-transform ${isAccountDropdownOpen ? 'rotate-180' : ''}`} />
          </div>
        </Card>
      </div>

      {/* Create Campaign Button */}
      <div className="p-4">
        <Button 
          variant="hero" 
          size="lg" 
          className="w-full"
          onClick={() => onNavigate('campaign-builder')}
        >
          <Plus className="w-4 h-4" />
          Create Campaign
        </Button>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-4">
        <div className="space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id as 'dashboard' | 'campaigns' | 'campaign-builder' | 'campaign-details' | 'contacts' | 'contact-details' | 'settings' | 'templates')}
              className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-smooth ${
                activeItem === item.id
                  ? "bg-primary text-primary-foreground shadow-card"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          ))}
          
          <button
            onClick={signOut}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-smooth text-muted-foreground hover:text-foreground hover:bg-accent mt-4"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <div className="text-xs text-muted-foreground text-center">
          Email Master v1.0
        </div>
      </div>
    </div>
  );
};

export default Sidebar;