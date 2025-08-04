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
      console.log('CampaignBuilder: Fetching templates...');
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .order('created_at', { ascending: false });

      console.log('CampaignBuilder: Templates fetch result:', { data, error, count: data?.length });
      
      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  // Force refresh templates on mount
  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleInputChange = (field: string, value: string) => {
    console.log(`Updating form field ${field}:`, value);
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
    if (!formData.list_id) {
      toast({ title: "Please select a contact list", variant: "destructive" });
      return false;
    }
    if (!formData.html_content.trim()) {
      toast({ title: "Email content is required", variant: "destructive" });
      return false;
    }
    if (!formData.template_id) {
      toast({ title: "Please select a template", variant: "destructive" });
      return false;
    }
    return true;
  };

  const handleTemplateSelect = (template: Template) => {
    console.log('Template selected:', template);
    setSelectedTemplate(template);
    setFormData(prev => ({
      ...prev,
      template_id: template.id,
      html_content: template.html_content
    }));
    setPreviewHtml(template.html_content);
    setShowTemplateManager(false);
  };

  const generatePreview = (htmlContent: string) => {
    // Replace template variables with sample data
    let preview = htmlContent
      .replace(/\{\{company_name\}\}/g, 'Your Company Name')
      .replace(/\{\{company_email\}\}/g, 'contact@yourcompany.com')
      .replace(/\{\{company_phone\}\}/g, '+1 (555) 123-4567')
      .replace(/\{\{company_address\}\}/g, '123 Business St, City, State 12345')
      .replace(/\{\{first_name\}\}/g, 'John')
      .replace(/\{\{subject\}\}/g, formData.subject || 'Sample Email Subject')
      .replace(/\{\{unsubscribe_url\}\}/g, '#')
      .replace(/\{\{preferences_url\}\}/g, '#');

    setPreviewHtml(preview);
  };

  const saveCampaign = async (status: 'draft' | 'sending' = 'draft') => {
    if (!validateForm()) return false;

    try {
      console.log('Saving campaign with data:', {
        user_id: user?.id,
        name: formData.name,
        subject: formData.subject,
        from_name: user?.user_metadata?.first_name || 'Campaign',
        from_email: user?.email || '',
        reply_to_email: user?.email || '',
        list_id: formData.list_id,
        template_id: formData.template_id,
        html_content: formData.html_content?.substring(0, 100) + '...',
        status,
      });

      const { data, error } = await supabase
        .from('campaigns')
        .insert({
          user_id: user?.id,
          name: formData.name,
          subject: formData.subject,
          from_name: user?.user_metadata?.first_name || 'Campaign',
          from_email: user?.email || '',
          reply_to_email: user?.email || '',
          list_id: formData.list_id,
          template_id: formData.template_id || null,
          html_content: formData.html_content,
          status,
        })
        .select();

      if (error) {
        console.error('Database error:', error);
        throw error;
      }
      
      console.log('Campaign saved successfully:', data);
      return true;
    } catch (error) {
      console.error('Error saving campaign:', error);
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
      try {
        // Get the campaign ID from the saved campaign
        const { data: campaigns } = await supabase
          .from('campaigns')
          .select('id')
          .eq('user_id', user?.id)
          .eq('name', formData.name)
          .eq('subject', formData.subject)
          .order('created_at', { ascending: false })
          .limit(1);

        if (campaigns && campaigns.length > 0) {
          const result = await sendCampaignEmails();
          if (result.success) {
            toast({ 
              title: "Campaign sent successfully!", 
              description: result.message 
            });
          } else {
            toast({ 
              title: "Campaign sent with issues", 
              description: result.message,
              variant: "destructive"
            });
          }
        }
        onBack();
      } catch (error) {
        toast({
          title: "Error sending campaign",
          description: error instanceof Error ? error.message : "Failed to send campaign",
          variant: "destructive",
        });
      }
    }
    setSending(false);
  };

  const sendCampaignEmails = async () => {
    if (!selectedTemplate || !formData.list_id) {
      toast({
        title: "Missing Information",
        description: "Please select a template and contact list.",
        variant: "destructive",
      });
      return { success: false, message: "Missing template or contact list" };
    }

    try {
      // Create a Gmail service instance to check authentication
      const gmailService = new GmailService({
        clientId: '',
        clientSecret: ''
      });

      // Check if authenticated with Gmail scope
      console.log('Checking Gmail authentication...');
      const isAuthenticated = await gmailService.isAuthenticated();
      console.log('Gmail authentication result:', isAuthenticated);
      
      if (!isAuthenticated) {
        // Get more details about the session for debugging
        const { data: { session } } = await supabase.auth.getSession();
        console.log('Session details:', {
          hasSession: !!session,
          hasProviderToken: !!session?.provider_token,
          hasAccessToken: !!session?.access_token,
          provider: session?.user?.app_metadata?.provider
        });
        
        toast({
          title: "Gmail Authentication Required",
          description: "Please authenticate with Google to grant Gmail sending permissions. You may need to sign out and sign in again.",
          variant: "destructive",
        });
        return { success: false, message: "Gmail API not authenticated" };
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
        return { success: false, message: "No contacts found in list" };
      }

      // Get the campaign that was just saved
      const { data: campaigns } = await supabase
        .from('campaigns')
        .select('id')
        .eq('user_id', user?.id)
        .eq('name', formData.name)
        .eq('subject', formData.subject)
        .order('created_at', { ascending: false })
        .limit(1);

      if (!campaigns || campaigns.length === 0) {
        throw new Error('Campaign not found');
      }

      const campaignId = campaigns[0].id;
      let sentCount = 0;
      let errorCount = 0;

      // Send emails to each contact
      for (const contact of contacts) {
        try {
          // Replace template variables
          let emailContent = selectedTemplate.html_content;
          
          // Replace common variables
          emailContent = emailContent.replace(/\{\{first_name\}\}/g, contact.first_name || '');
          emailContent = emailContent.replace(/\{\{last_name\}\}/g, contact.last_name || '');
          emailContent = emailContent.replace(/\{\{email\}\}/g, contact.email || '');
          emailContent = emailContent.replace(/\{\{company_name\}\}/g, contact.company_name || '');
          
          // Replace any custom fields
          if (contact.custom_fields) {
            const customFields = contact.custom_fields;
            Object.keys(customFields).forEach(key => {
              const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
              emailContent = emailContent.replace(regex, customFields[key] || '');
            });
          }

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

      // Update campaign stats
      await supabase
        .from('campaigns')
        .update({
          total_sent: sentCount,
          total_opened: 0,
          total_clicked: 0,
          total_bounced: errorCount,
          status: 'sent'
        })
        .eq('id', campaignId);

      const message = `Sent ${sentCount} emails successfully${errorCount > 0 ? `, ${errorCount} failed` : ''}`;
      
      if (errorCount === 0) {
        toast({
          title: "Campaign Sent Successfully!",
          description: message,
        });
        return { success: true, message };
      } else {
        toast({
          title: "Campaign Sent with Issues",
          description: message,
          variant: "destructive",
        });
        return { success: false, message };
      }

    } catch (error) {
      console.error('Error sending campaign emails:', error);
      toast({
        title: "Error Sending Campaign",
        description: error instanceof Error ? error.message : "Failed to send campaign emails",
        variant: "destructive",
      });
      return { success: false, message: error instanceof Error ? error.message : "Unknown error" };
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
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
          <Button 
            variant="outline" 
            size="sm"
            onClick={async () => {
              console.log('Current form data:', formData);
              console.log('Selected template:', selectedTemplate);
              console.log('User:', user);
              
              // Test database connection
              try {
                const { data: testData, error: testError } = await supabase
                  .from('campaigns')
                  .select('count')
                  .limit(1);
                
                console.log('Database test:', { testData, testError });
                
                // Test template access
                const { data: templateData, error: templateError } = await supabase
                  .from('templates')
                  .select('id, name')
                  .limit(5);
                
                console.log('Template test:', { templateData, templateError });
                
                alert(`Form Data: ${JSON.stringify(formData, null, 2)}\n\nSelected Template: ${selectedTemplate?.name || 'None'}\n\nDatabase Test: ${testError ? 'FAILED' : 'SUCCESS'}\nTemplate Test: ${templateError ? 'FAILED' : 'SUCCESS'}`);
              } catch (error) {
                console.error('Debug test error:', error);
                alert(`Debug test failed: ${error}`);
              }
            }}
          >
            Debug
          </Button>
          <Button 
            variant="outline" 
            onClick={async () => {
              try {
                const gmailService = new GmailService({
                  clientId: '',
                  clientSecret: ''
                });
                
                const isAuth = await gmailService.isAuthenticated();
                const { data: { session } } = await supabase.auth.getSession();
                
                const authInfo = {
                  isAuthenticated: isAuth,
                  hasSession: !!session,
                  hasProviderToken: !!session?.provider_token,
                  hasAccessToken: !!session?.access_token,
                  provider: session?.user?.app_metadata?.provider,
                  userEmail: session?.user?.email
                };
                
                console.log('Gmail Auth Info:', authInfo);
                alert(`Gmail Auth Status:\n${JSON.stringify(authInfo, null, 2)}`);
              } catch (error) {
                alert(`Gmail Auth Test failed: ${error}`);
              }
            }}
          >
            Test Gmail Auth
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save as Draft'}
          </Button>
          <Button onClick={handleSend} disabled={sending} variant="hero">
            {sending ? 'Sending...' : 'Send Campaign'}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="details">Campaign Details</TabsTrigger>
          <TabsTrigger value="template">Template</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4">
          <Card>
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

        <TabsContent value="template" className="space-y-4">
          <Card>
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

        <TabsContent value="preview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Email Preview</CardTitle>
              <p className="text-sm text-muted-foreground">
                Preview how your email will look to recipients
              </p>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                <div 
                  className="w-full h-96 overflow-auto bg-white"
                  dangerouslySetInnerHTML={{ __html: previewHtml }}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Template Manager Modal */}
      {showTemplateManager && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg p-6 w-full max-w-4xl h-[80vh] overflow-auto">
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