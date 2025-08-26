import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Mail, 
  Users, 
  BarChart3, 
  TrendingUp,
  Eye,
  MousePointer,
  AlertCircle,
  Settings
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';

interface DashboardProps {
  onNavigate: (view: 'dashboard' | 'campaigns' | 'contacts' | 'settings', settingsTab?: string) => void;
}

const Dashboard = ({ onNavigate }: DashboardProps) => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    campaigns: 0,
    contacts: 0,
    lists: 0,
    sent: 0
  });
  const [loading, setLoading] = useState(true);
  const [gmailConfigured, setGmailConfigured] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    if (user) {
      fetchStats();
      checkGmailConfiguration();
      checkIfNewUser();
      fetchUserProfile();
    }
  }, [user]);

  const fetchStats = async () => {
    try {
      console.log('Fetching stats for user:', user?.id);
      
      // Test campaigns
      const { data: campaigns, error: campaignsError } = await supabase
        .from('campaigns')
        .select('id, status')
        .eq('user_id', user?.id);
      
      console.log('Campaigns result:', { campaigns, campaignsError });

      // Test contact lists
      const { data: lists, error: listsError } = await supabase
        .from('contact_lists')
        .select('id, total_contacts')
        .eq('user_id', user?.id);
      
      console.log('Contact lists result:', { lists, listsError });

      // Test contacts
      const { data: contacts, error: contactsError } = await supabase
        .from('contacts')
        .select('id')
        .eq('user_id', user?.id);
      
      console.log('Contacts result:', { contacts, contactsError });

      setStats({
        campaigns: campaigns?.length || 0,
        contacts: contacts?.length || 0,
        lists: lists?.length || 0,
        sent: campaigns?.filter(c => c.status === 'sent').length || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkGmailConfiguration = async () => {
    try {
      // Check if user has Gmail credentials
      const { data: credentials, error } = await supabase
        .from('gmail_credentials')
        .select('id')
        .eq('user_id', user?.id)
        .eq('is_active', true)
        .maybeSingle(); // Use maybeSingle instead of single to avoid 406 error

      setGmailConfigured(!!credentials && !error);
    } catch (error) {
      console.error('Error checking Gmail configuration:', error);
      setGmailConfigured(false);
    }
  };

  const checkIfNewUser = async () => {
    try {
      // Check if user has any campaigns or contact lists
      const { data: campaigns } = await supabase
        .from('campaigns')
        .select('id')
        .eq('user_id', user?.id)
        .limit(1);

      const { data: lists } = await supabase
        .from('contact_lists')
        .select('id')
        .eq('user_id', user?.id)
        .limit(1);

      // Consider user new if they have no campaigns, no lists, and no Gmail configured
      setIsNewUser((!campaigns || campaigns.length === 0) && 
                   (!lists || lists.length === 0) && 
                   !gmailConfigured);
    } catch (error) {
      console.error('Error checking if new user:', error);
      setIsNewUser(true);
    }
  };

  const fetchUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', user?.id)
        .single();

      if (data) {
        setUserProfile(data);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const getUserDisplayName = () => {
    if (userProfile?.name) {
      return userProfile.name;
    }
    
    // Fallback to user metadata
    return user?.user_metadata?.name || user?.user_metadata?.full_name || user?.email || 'User';
  };

  const quickActions = [
    {
      title: "Create Campaign",
      description: "Build and send email campaigns",
      icon: Mail,
      action: () => onNavigate('campaigns'),
      color: "bg-sky-500"
    },
    {
      title: "Manage Contacts",
      description: "Organize your email lists",
      icon: Users,
      action: () => onNavigate('contacts'),
      color: "bg-sky-600"
    },
    {
      title: "View Analytics",
      description: "Track campaign performance",
      icon: BarChart3,
      action: () => onNavigate('campaigns'),
      color: "bg-sky-700"
    }
  ];

  const recentActivity = [
    {
      type: "Campaign Sent",
      message: "Welcome Email campaign sent to 1,234 contacts",
      time: "2 hours ago",
      icon: Mail
    },
    {
      type: "Contact Added",
      message: "50 new contacts imported to Newsletter list",
      time: "1 day ago",
      icon: Users
    },
    {
      type: "Campaign Created",
      message: "Product Launch campaign created",
      time: "2 days ago",
      icon: TrendingUp
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome back, {getUserDisplayName()}!</h1>
        <p className="text-muted-foreground">
          Here's what's happening with your email campaigns today.
        </p>
      </div>

      {/* Gmail Configuration Warning for New Users */}
      {isNewUser && !gmailConfigured && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <div className="flex items-center justify-between">
              <div>
                <strong>Gmail not configured!</strong> To send email campaigns, you need to connect your Gmail account.
              </div>
              <Button 
                onClick={() => onNavigate('settings', 'integrations')}
                size="sm"
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                <Settings className="w-4 h-4 mr-2" />
                Configure Gmail
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.campaigns}</div>
            <p className="text-xs text-muted-foreground">
              {stats.sent} campaigns sent
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.contacts}</div>
            <p className="text-xs text-muted-foreground">
              Across {stats.lists} lists
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Rate</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24.5%</div>
            <p className="text-xs text-muted-foreground">
              +2.1% from last month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Click Rate</CardTitle>
            <MousePointer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3.2%</div>
            <p className="text-xs text-muted-foreground">
              +0.8% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {quickActions.map((action, index) => (
            <Card 
              key={index} 
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={action.action}
            >
              <CardHeader>
                <div className={`w-12 h-12 ${action.color} rounded-lg flex items-center justify-center mb-4`}>
                  <action.icon className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-lg">{action.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{action.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
        <div className="space-y-4">
          {recentActivity.map((activity, index) => (
            <Card key={index}>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                  <activity.icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="font-medium">{activity.type}</div>
                  <div className="text-sm text-muted-foreground">{activity.message}</div>
                </div>
                <div className="text-sm text-muted-foreground">{activity.time}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;