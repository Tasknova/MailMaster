import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Save, Send, FileText, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { sendCampaignEmails } from '@/lib/emailService';
import TemplateManager from '../templates/TemplateManager';
import GmailService from '@/services/gmailService';

interface ContactList {
  id: string;
  name: string;
  total_contacts: number;
}

interface Template {
  id: string;
  name: string;
  description: string;
  html_content: string;
  is_default: boolean;
  created_at: string;
}

interface CampaignBuilderProps {
  onBack: () => void;
}

const CampaignBuilder = ({ onBack }: CampaignBuilderProps) => {
  const { user } = useAuth();
  const [contactLists, setContactLists] = useState<ContactList[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [showTemplateManager, setShowTemplateManager] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [previewHtml, setPreviewHtml] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    list_id: '',
    template_id: '',
    html_content: '',
  });
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchContactLists();
    fetchTemplates();
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

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleTemplateSelect = (template: Template) => {
    setSelectedTemplate(template);
    setFormData(prev => ({
      ...prev,
      template_id: template.id,
      html_content: template.html_content
    }));
    generatePreview(template.html_content);
    setShowTemplateManager(false);
  };

  const generatePreview = (htmlContent: string) => {
    let preview = htmlContent
      .replace(/\{\{first_name\}\}/g, 'John')
      .replace(/\{\{last_name\}\}/g, 'Doe')
      .replace(/\{\{company_name\}\}/g, 'Sample Company')
      .replace(/\{\{subject\}\}/g, formData.subject || 'Sample Subject');
    
    setPreviewHtml(preview);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.subject || !formData.list_id) {
      toast({
        title: "Missing required fields",
        description: "Please fill in campaign name, subject, and select a contact list",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('campaigns')
        .insert({
          user_id: user?.id,
          name: formData.name,
          subject: formData.subject,
          list_id: formData.list_id,
          template_id: formData.template_id || null,
          html_content: formData.html_content || selectedTemplate?.html_content || '',
          status: 'draft',
          from_name: 'MailMaster Campaign',
          from_email: user?.email || '',
        });

      if (error) throw error;

      toast({
        title: "Campaign Saved",
        description: "Your campaign has been saved as a draft",
      });
    } catch (error) {
      toast({
        title: "Error saving campaign",
        description: error instanceof Error ? error.message : "Failed to save campaign",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSend = async () => {
    if (!formData.name || !formData.subject || !formData.list_id) {
      toast({
        title: "Missing required fields",
        description: "Please fill in all required fields before sending",
        variant: "destructive",
      });
      return;
    }

    if (!selectedTemplate && !formData.html_content) {
      toast({
        title: "No email content",
        description: "Please select a template or add custom HTML content",
        variant: "destructive",
      });
      return;
    }

    setSending(true);
    try {
      // First save the campaign
      await handleSave();

      // Check Gmail authentication
      const gmailService = new GmailService();
      const isAuthenticated = await gmailService.isAuthenticated();
      
      if (!isAuthenticated) {
        toast({
          title: "Gmail Authentication Required",
          description: "Please authenticate with Google to grant Gmail sending permissions. Go to Settings → Gmail Settings to authenticate.",
          variant: "destructive",
        });
        return;
      }

      // Fetch contacts from the selected list
      const { data: contacts, error: contactsError } = await supabase
        .from('contacts')
        .select('*')
        .eq('list_id', formData.list_id);

      if (contactsError) throw contactsError;
      if (!contacts || contacts.length === 0) {
        toast({
          title: "No Contacts Found",
          description: "The selected contact list is empty.",
          variant: "destructive",
        });
        return;
      }

      let sentCount = 0;
      let errorCount = 0;

      // Send emails to each contact
      for (const contact of contacts) {
        try {
          let emailContent = selectedTemplate?.html_content || formData.html_content;
          
          // Replace template variables
          emailContent = emailContent.replace(/\{\{first_name\}\}/g, contact.first_name || '');
          emailContent = emailContent.replace(/\{\{last_name\}\}/g, contact.last_name || '');
          emailContent = emailContent.replace(/\{\{email\}\}/g, contact.email || '');
          
          // Send email using Gmail API
          await gmailService.sendEmail({
            to: [contact.email],
            subject: formData.subject,
            htmlContent: emailContent,
            fromName: 'MailMaster Campaign'
          });

          sentCount++;
        } catch (error) {
          console.error(`Error sending email to ${contact.email}:`, error);
          errorCount++;
        }
      }

      const message = `Sent ${sentCount} emails successfully${errorCount > 0 ? `, ${errorCount} failed` : ''}`;
      
      if (errorCount === 0) {
        toast({
          title: "Campaign Sent Successfully!",
          description: message,
        });
      } else {
        toast({
          title: "Campaign Sent with Issues",
          description: message,
          variant: "destructive",
        });
      }

    } catch (error) {
      console.error('Error sending campaign emails:', error);
      toast({
        title: "Error Sending Campaign",
        description: error instanceof Error ? error.message : "Failed to send campaign emails",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
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
    <div style={{ width: '100%', maxWidth: 'none' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Create Campaign</h2>
            <p className="text-muted-foreground">Build and send your email campaign</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save as Draft'}
          </Button>
          <Button onClick={handleSend} disabled={sending} variant="hero">
            {sending ? 'Sending...' : 'Send Campaign'}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ width: '100%', maxWidth: 'none' }}>
        <Tabs value={activeTab} onValueChange={setActiveTab} style={{ width: '100%' }}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Campaign Details</TabsTrigger>
            <TabsTrigger value="template">Template</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>

          {/* Campaign Details Tab */}
          <TabsContent value="details" style={{ width: '100%', marginTop: '1rem' }}>
            <Card style={{ width: '100%', maxWidth: 'none' }}>
              <CardHeader>
                <CardTitle>Campaign Information</CardTitle>
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
                    placeholder="Enter your email subject"
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
          </TabsContent>

          {/* Template Tab */}
          <TabsContent value="template" style={{ width: '100%', marginTop: '1rem' }}>
            <Card style={{ width: '100%', maxWidth: 'none' }}>
              <CardHeader>
                <CardTitle>Email Template</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Choose a template or create a custom one
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Select Template</Label>
                  <Select 
                    value={formData.template_id} 
                    onValueChange={(value) => {
                      const template = templates.find(t => t.id === value);
                      if (template) {
                        handleTemplateSelect(template);
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a template" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            {template.name}
                            {template.is_default && (
                              <span className="text-xs bg-muted px-2 py-1 rounded">Default</span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedTemplate && (
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2">{selectedTemplate.name}</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      {selectedTemplate.description}
                    </p>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setActiveTab('preview');
                          generatePreview(selectedTemplate.html_content);
                        }}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Preview
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setShowTemplateManager(true)}
                      >
                        <FileText className="w-4 h-4 mr-1" />
                        Manage Templates
                      </Button>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="html-content">Custom HTML Content</Label>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setShowTemplateManager(true)}
                    >
                      <FileText className="w-4 h-4 mr-1" />
                      Template Manager
                    </Button>
                  </div>
                  <Textarea
                    id="html-content"
                    value={formData.html_content}
                    onChange={(e) => {
                      handleInputChange('html_content', e.target.value);
                      generatePreview(e.target.value);
                    }}
                    placeholder="<html>...</html> or paste your custom HTML here"
                    className="min-h-64 font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Use variables like {'{{first_name}}'}, {'{{company_name}}'}, etc. for personalization
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Preview Tab */}
          <TabsContent value="preview" style={{ width: '100%', marginTop: '1rem' }}>
            <Card style={{ width: '100%', maxWidth: 'none' }}>
              <CardHeader>
                <CardTitle>Email Preview</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Preview how your email will look to recipients
                </p>
              </CardHeader>
              <CardContent>
                <div 
                  style={{ 
                    border: '1px solid hsl(var(--border))', 
                    borderRadius: '0.5rem', 
                    overflow: 'hidden',
                    width: '100%'
                  }}
                >
                  <div 
                    style={{ 
                      width: '100%', 
                      minHeight: '400px', 
                      overflow: 'auto', 
                      backgroundColor: 'white',
                      padding: '1rem'
                    }}
                    dangerouslySetInnerHTML={{ __html: previewHtml || defaultTemplate }}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Template Manager Modal */}
      {showTemplateManager && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg p-6 w-full max-w-6xl h-[90vh] overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Template Manager</h2>
              <Button variant="outline" onClick={() => setShowTemplateManager(false)}>
                Close
              </Button>
            </div>
            <TemplateManager 
              onTemplateSelect={handleTemplateSelect}
              selectedTemplateId={formData.template_id}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default CampaignBuilder;