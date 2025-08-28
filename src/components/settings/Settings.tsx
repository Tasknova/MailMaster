import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  User, 
  Building, 
  Mail, 
  Shield, 
  Bell, 
  Palette,
  ArrowLeft,
  Key,
  Save
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import GmailSettings from './GmailSettings';

interface UserProfile {
  id: string;
  email: string;
  name: string;
  profile_photo: string;
  company?: string;
}

interface SettingsProps {
  activeTab?: string;
}

const Settings = ({ activeTab = 'profile' }: SettingsProps) => {
  const { user } = useAuth();
  const [currentTab, setCurrentTab] = useState(activeTab);
  const [showGmailSettings, setShowGmailSettings] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    position: ''
  });



  const [notifications, setNotifications] = useState({
    email_notifications: true,
    campaign_updates: true,
    contact_imports: true,
    system_alerts: true
  });

  useEffect(() => {
    if (user) {
      fetchUserProfile();
    }
  }, [user]);

  const fetchUserProfile = async () => {
    try {
      // Fetch user profile
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        // Use fallback data from user metadata
        const fallbackProfile = {
          id: user?.id || '',
          email: user?.email || '',
          name: user?.user_metadata?.name || user?.user_metadata?.full_name || 'User',
          profile_photo: user?.user_metadata?.avatar_url || user?.user_metadata?.picture || '',
          company: ''
        };
        setProfile(fallbackProfile);
        setProfileForm({
          name: fallbackProfile.name,
          email: fallbackProfile.email,
          phone: '',
          company: fallbackProfile.company || '',
          position: ''
        });
      } else {
        setProfile(data);
        setProfileForm({
          name: data.name,
          email: data.email,
          phone: data.phone || '',
          company: data.company || '',
          position: data.position || ''
        });
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user?.id,
          email: profileForm.email,
          name: profileForm.name,
          company: profileForm.company,
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });

      if (error) {
        throw error;
      }

      // Update local profile state
      setProfile(prev => prev ? { ...prev, ...profileForm } : null);

      toast({
        title: "Profile Updated",
        description: "Your profile settings have been saved successfully.",
      });
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: "Error",
        description: "Failed to save profile settings. Please try again.",
        variant: "destructive",
      });
    }
  };



  const saveNotifications = () => {
    // Save notification settings
    toast({
      title: "Notifications Updated",
      description: "Your notification settings have been saved successfully.",
    });
  };

  const getUserInitials = () => {
    if (profile?.name) {
      const parts = profile.name.split(' ');
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      }
      return profile.name[0]?.toUpperCase() || 'U';
    }
    return 'U';
  };

  if (showGmailSettings) {
    return (
      <GmailSettings onBack={() => setShowGmailSettings(false)} />
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Profile Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Profile Photo Section */}
              <div className="flex items-center space-x-4">
                <Avatar className="w-20 h-20">
                  <AvatarImage src={profile?.profile_photo} alt="Profile" />
                  <AvatarFallback className="bg-sky-100 text-sky-600 text-lg">
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-medium">{profileForm.name}</h3>
                  <p className="text-sm text-muted-foreground">{profileForm.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileForm.email}
                    disabled
                  />
                  <p className="text-sm text-muted-foreground">
                    Email address cannot be changed
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  value={profileForm.company}
                  onChange={(e) => setProfileForm({ ...profileForm, company: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="position">Position</Label>
                <Input
                  id="position"
                  value={profileForm.position}
                  onChange={(e) => setProfileForm({ ...profileForm, position: e.target.value })}
                />
              </div>
              <Button onClick={saveProfile} className="flex items-center gap-2">
                <Save className="w-4 h-4" />
                Save Profile
              </Button>
            </CardContent>
          </Card>
        </TabsContent>



        <TabsContent value="integrations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="w-5 h-5" />
                Email Integrations
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Configure email sending services
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Mail className="w-6 h-6 text-blue-600" />
                    <div>
                      <h3 className="font-semibold">Gmail API</h3>
                      <p className="text-sm text-muted-foreground">
                        Send emails through your Gmail account using Gmail API
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">Recommended</Badge>
                    <Button 
                      variant="outline" 
                      onClick={() => setShowGmailSettings(true)}
                    >
                      Configure
                    </Button>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-4 opacity-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Mail className="w-6 h-6 text-gray-400" />
                    <div>
                      <h3 className="font-semibold text-gray-500">SMTP Server</h3>
                      <p className="text-sm text-muted-foreground">
                        Configure custom SMTP server settings
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Coming Soon</Badge>
                    <Button variant="outline" disabled>
                      Configure
                    </Button>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-4 opacity-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Mail className="w-6 h-6 text-gray-400" />
                    <div>
                      <h3 className="font-semibold text-gray-500">SendGrid</h3>
                      <p className="text-sm text-muted-foreground">
                        Send emails using SendGrid API
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Coming Soon</Badge>
                    <Button variant="outline" disabled>
                      Configure
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notification Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Email Notifications</h3>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications via email
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications.email_notifications}
                    onChange={(e) => setNotifications({ 
                      ...notifications, 
                      email_notifications: e.target.checked 
                    })}
                    className="rounded"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Campaign Updates</h3>
                    <p className="text-sm text-muted-foreground">
                      Get notified about campaign status changes
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications.campaign_updates}
                    onChange={(e) => setNotifications({ 
                      ...notifications, 
                      campaign_updates: e.target.checked 
                    })}
                    className="rounded"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Contact Imports</h3>
                    <p className="text-sm text-muted-foreground">
                      Notifications when contact lists are imported
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications.contact_imports}
                    onChange={(e) => setNotifications({ 
                      ...notifications, 
                      contact_imports: e.target.checked 
                    })}
                    className="rounded"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">System Alerts</h3>
                    <p className="text-sm text-muted-foreground">
                      Important system notifications and updates
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications.system_alerts}
                    onChange={(e) => setNotifications({ 
                      ...notifications, 
                      system_alerts: e.target.checked 
                    })}
                    className="rounded"
                  />
                </div>
              </div>
              <Button onClick={saveNotifications}>
                Save Notification Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings; 