import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Mail, 
  Bell, 
  Shield, 
  CreditCard, 
  Download,
  Trash2,
  Save,
  AlertTriangle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  company: string;
  created_at: string;
}

const Settings = () => {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    emailNotifications: true,
    campaignReminders: true,
    weeklyReports: false,
    darkMode: false,
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      console.log('Fetching profile for user:', user?.id);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      console.log('Profile fetch result:', { data, error });
      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: "Error fetching profile",
        description: error instanceof Error ? error.message : "Failed to load profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async () => {
    if (!profile) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: profile.first_name,
          last_name: profile.last_name,
          company: profile.company,
        })
        .eq('id', user?.id);

      if (error) throw error;
      toast({ title: "Profile updated successfully!" });
    } catch (error) {
      toast({
        title: "Error updating profile",
        description: error instanceof Error ? error.message : "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const exportData = async () => {
    try {
      // Export campaigns
      const { data: campaigns } = await supabase
        .from('campaigns')
        .select('*')
        .eq('user_id', user?.id);

      // Export contact lists
      const { data: contactLists } = await supabase
        .from('contact_lists')
        .select('*')
        .eq('user_id', user?.id);

      // Export contacts
      const { data: contacts } = await supabase
        .from('contacts')
        .select('*')
        .eq('user_id', user?.id);

      const exportData = {
        campaigns: campaigns || [],
        contactLists: contactLists || [],
        contacts: contacts || [],
        exportedAt: new Date().toISOString(),
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `email-master-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({ title: "Data exported successfully!" });
    } catch (error) {
      toast({
        title: "Error exporting data",
        description: error instanceof Error ? error.message : "Failed to export data",
        variant: "destructive",
      });
    }
  };

  const deleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }

    try {
      // Delete all user data
      await supabase.from('campaigns').delete().eq('user_id', user?.id);
      await supabase.from('contacts').delete().eq('user_id', user?.id);
      await supabase.from('contact_lists').delete().eq('user_id', user?.id);
      await supabase.from('profiles').delete().eq('id', user?.id);

      toast({ title: "Account deleted successfully" });
      signOut();
    } catch (error) {
      toast({
        title: "Error deleting account",
        description: error instanceof Error ? error.message : "Failed to delete account",
        variant: "destructive",
      });
    }
  };

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
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">Manage your account and preferences</p>
      </div>

      <div className="grid gap-6">
        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Profile Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first-name">First Name</Label>
                <Input
                  id="first-name"
                  value={profile?.first_name || ''}
                  onChange={(e) => setProfile(prev => prev ? { ...prev, first_name: e.target.value } : null)}
                  placeholder="John"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last-name">Last Name</Label>
                <Input
                  id="last-name"
                  value={profile?.last_name || ''}
                  onChange={(e) => setProfile(prev => prev ? { ...prev, last_name: e.target.value } : null)}
                  placeholder="Doe"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={profile?.email || ''}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">Email cannot be changed</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                value={profile?.company || ''}
                onChange={(e) => setProfile(prev => prev ? { ...prev, company: e.target.value } : null)}
                placeholder="Your Company"
              />
            </div>
            <Button onClick={updateProfile} disabled={saving}>
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notification Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="email-notifications">Email Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive notifications about campaign status</p>
              </div>
              <Switch
                id="email-notifications"
                checked={settings.emailNotifications}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, emailNotifications: checked }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="campaign-reminders">Campaign Reminders</Label>
                <p className="text-sm text-muted-foreground">Get reminded about draft campaigns</p>
              </div>
              <Switch
                id="campaign-reminders"
                checked={settings.campaignReminders}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, campaignReminders: checked }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="weekly-reports">Weekly Reports</Label>
                <p className="text-sm text-muted-foreground">Receive weekly performance summaries</p>
              </div>
              <Switch
                id="weekly-reports"
                checked={settings.weeklyReports}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, weeklyReports: checked }))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Account Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Account Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Account Status</Label>
                <p className="text-sm text-muted-foreground">Your account is active</p>
              </div>
              <Badge variant="secondary">Active</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Member Since</Label>
                <p className="text-sm text-muted-foreground">
                  {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
            <Separator />
            <div className="flex gap-2">
              <Button variant="outline" onClick={exportData}>
                <Download className="w-4 h-4 mr-2" />
                Export Data
              </Button>
              <Button variant="destructive" onClick={deleteAccount}>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Account
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Billing Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Billing Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Free Plan</h3>
              <p className="text-muted-foreground mb-4">
                You're currently on the free plan. Upgrade to unlock more features.
              </p>
              <Button variant="hero">
                Upgrade Plan
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings; 