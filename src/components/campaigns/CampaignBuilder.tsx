import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

interface ContactList {
  id: string;
  name: string;
  total_contacts: number;
}

interface CampaignBuilderProps {
  onBack: () => void;
}

const CampaignBuilder = ({ onBack }: CampaignBuilderProps) => {
  const { user } = useAuth();
  const [contactLists, setContactLists] = useState<ContactList[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    from_name: '',
    from_email: '',
    reply_to_email: '',
    list_id: '',
    html_content: '',
  });
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchContactLists();
    
    // Set default from fields if user profile exists
    if (user) {
      setFormData(prev => ({
        ...prev,
        from_email: user.email || '',
        reply_to_email: user.email || '',
      }));
    }
  }, [user]);

  const fetchContactLists = async () => {
    try {
      const { data, error } = await supabase
        .from('contact_lists')
        .select('id, name, total_contacts')
        .order('name');

      if (error) throw error;
      setContactLists(data || []);
    } catch (error) {
      toast({
        title: "Error fetching contact lists",
        description: error instanceof Error ? error.message : "Failed to load contact lists",
        variant: "destructive",
      });
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast({ title: "Campaign name is required", variant: "destructive" });
      return false;
    }
    if (!formData.subject.trim()) {
      toast({ title: "Subject line is required", variant: "destructive" });
      return false;
    }
    if (!formData.from_name.trim()) {
      toast({ title: "From name is required", variant: "destructive" });
      return false;
    }
    if (!formData.from_email.trim()) {
      toast({ title: "From email is required", variant: "destructive" });
      return false;
    }
    if (!formData.html_content.trim()) {
      toast({ title: "Email content is required", variant: "destructive" });
      return false;
    }
    if (!formData.list_id) {
      toast({ title: "Please select a contact list", variant: "destructive" });
      return false;
    }
    return true;
  };

  const saveCampaign = async (status: 'draft' | 'sending' = 'draft') => {
    if (!validateForm()) return false;

    try {
      const { error } = await supabase
        .from('campaigns')
        .insert({
          user_id: user?.id,
          name: formData.name,
          subject: formData.subject,
          from_name: formData.from_name,
          from_email: formData.from_email,
          reply_to_email: formData.reply_to_email || formData.from_email,
          list_id: formData.list_id,
          html_content: formData.html_content,
          status,
        });

      if (error) throw error;
      return true;
    } catch (error) {
      toast({
        title: "Error saving campaign",
        description: error instanceof Error ? error.message : "Failed to save campaign",
        variant: "destructive",
      });
      return false;
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const success = await saveCampaign('draft');
    if (success) {
      toast({ title: "Campaign saved as draft" });
      onBack();
    }
    setSaving(false);
  };

  const handleSend = async () => {
    setSending(true);
    const success = await saveCampaign('sending');
    if (success) {
      toast({ title: "Campaign is being sent!" });
      onBack();
    }
    setSending(false);
  };

  const defaultTemplate = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #333;">Hello {{first_name}}!</h2>
  
  <p>Thank you for being part of our community. We have something exciting to share with you.</p>
  
  <p>This is your email content. You can customize this template to match your brand and message.</p>
  
  <div style="text-align: center; margin: 30px 0;">
    <a href="https://example.com" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Call to Action</a>
  </div>
  
  <p>Best regards,<br>
  The Team</p>
  
  <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
  <p style="font-size: 12px; color: #666;">
    If you no longer wish to receive these emails, you can <a href="{{unsubscribe_url}}">unsubscribe here</a>.
  </p>
</div>`;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Create Campaign</h2>
          <p className="text-muted-foreground">Build and send your email campaign</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Campaign Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Campaign Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="campaign-name">Campaign Name</Label>
              <Input
                id="campaign-name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="My Email Campaign"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Subject Line</Label>
              <Input
                id="subject"
                value={formData.subject}
                onChange={(e) => handleInputChange('subject', e.target.value)}
                placeholder="Your email subject line"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="from-name">From Name</Label>
                <Input
                  id="from-name"
                  value={formData.from_name}
                  onChange={(e) => handleInputChange('from_name', e.target.value)}
                  placeholder="Your Name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="from-email">From Email</Label>
                <Input
                  id="from-email"
                  type="email"
                  value={formData.from_email}
                  onChange={(e) => handleInputChange('from_email', e.target.value)}
                  placeholder="you@company.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reply-to">Reply To Email (Optional)</Label>
              <Input
                id="reply-to"
                type="email"
                value={formData.reply_to_email}
                onChange={(e) => handleInputChange('reply_to_email', e.target.value)}
                placeholder="support@company.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact-list">Contact List</Label>
              <Select value={formData.list_id} onValueChange={(value) => handleInputChange('list_id', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a contact list" />
                </SelectTrigger>
                <SelectContent>
                  {contactLists.map((list) => (
                    <SelectItem key={list.id} value={list.id}>
                      {list.name} ({list.total_contacts} contacts)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Email Content */}
        <Card>
          <CardHeader>
            <CardTitle>Email Content</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="html-content">HTML Content</Label>
              <Textarea
                id="html-content"
                value={formData.html_content || defaultTemplate}
                onChange={(e) => handleInputChange('html_content', e.target.value)}
                placeholder="Enter your HTML email content..."
                className="min-h-96 font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                You can use variables like {'{{first_name}}'}, {'{{last_name}}'}, {'{{email}}'} in your content.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 justify-end">
        <Button variant="outline" onClick={onBack}>
          Cancel
        </Button>
        <Button variant="secondary" onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Draft
            </>
          )}
        </Button>
        <Button variant="hero" onClick={handleSend} disabled={sending}>
          {sending ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Sending...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Send Campaign
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default CampaignBuilder;