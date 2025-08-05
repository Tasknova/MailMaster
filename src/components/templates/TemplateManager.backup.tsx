import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  Plus, 
  Edit, 
  Copy, 
  Eye, 
  Save,
  Building,
  Mail,
  Phone,
  MapPin,
  ArrowLeft,
  Palette,
  X,
  Check
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

interface Template {
  id: string;
  name: string;
  description: string;
  html_content: string;
  is_default: boolean;
  created_at: string;
}

interface CompanyBranding {
  company_name: string;
  company_email: string;
  company_phone: string;
  company_address: string;
  company_logo: string;
}

interface TemplateManagerProps {
  onTemplateSelect?: (template: Template) => void;
  selectedTemplateId?: string;
}

const TemplateManager = ({ onTemplateSelect, selectedTemplateId }: TemplateManagerProps) => {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateTemplate, setShowCreateTemplate] = useState(false);
  const [showBrandingSettings, setShowBrandingSettings] = useState(false);
  const [customHtml, setCustomHtml] = useState('');
  const [previewHtml, setPreviewHtml] = useState('');
  const [activeTab, setActiveTab] = useState('templates');
  
  // Simplified template editing
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [editingTemplateData, setEditingTemplateData] = useState({
    name: '',
    description: '',
    html_content: ''
  });
  
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    html_content: ''
  });

  const [branding, setBranding] = useState<CompanyBranding>({
    company_name: 'Your Company Name',
    company_email: 'contact@yourcompany.com',
    company_phone: '+1 (555) 123-4567',
    company_address: '123 Business St, City, State 12345',
    company_logo: ''
  });

  // Force refresh templates on mount
  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      console.log('Fetching templates...');
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .order('created_at', { ascending: false });

      console.log('Templates fetch result:', { data, error, count: data?.length });
      
      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast({
        title: "Error",
        description: "Failed to fetch templates. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchBrandingSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('company')
        .eq('id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data?.company) {
        setBranding(prev => ({ ...prev, ...data.company }));
      }
    } catch (error) {
      console.error('Error fetching branding settings:', error);
    }
  };

  const saveBrandingSettings = async () => {
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user?.id,
          company: branding
        });

      if (error) throw error;

      toast({ title: "Branding settings saved successfully!" });
      setShowBrandingSettings(false);
    } catch (error) {
      toast({
        title: "Error saving branding settings",
        description: error instanceof Error ? error.message : "Failed to save settings",
        variant: "destructive",
      });
    }
  };

  const createTemplate = async () => {
    if (!newTemplate.name.trim()) {
      toast({ title: "Template name is required", variant: "destructive" });
      return;
    }

    if (!newTemplate.html_content.trim()) {
      toast({ title: "HTML content is required", variant: "destructive" });
      return;
    }

    try {
      const { error } = await supabase
        .from('templates')
        .insert({
          user_id: user?.id,
          name: newTemplate.name,
          description: newTemplate.description,
          html_content: newTemplate.html_content,
        });

      if (error) throw error;

      toast({ title: "Template created successfully!" });
      setNewTemplate({ name: '', description: '', html_content: '' });
      setShowCreateTemplate(false);
      fetchTemplates();
    } catch (error) {
      toast({
        title: "Error creating template",
        description: error instanceof Error ? error.message : "Failed to create template",
        variant: "destructive",
      });
    }
  };

  const duplicateTemplate = async (template: Template) => {
    try {
      const { error } = await supabase
        .from('templates')
        .insert({
          user_id: user?.id,
          name: `${template.name} (Copy)`,
          description: template.description,
          html_content: template.html_content,
        });

      if (error) throw error;

      toast({ title: "Template duplicated successfully!" });
      fetchTemplates();
    } catch (error) {
      toast({
        title: "Error duplicating template",
        description: error instanceof Error ? error.message : "Failed to duplicate template",
        variant: "destructive",
      });
    }
  };

  const generatePreview = (htmlContent: string) => {
    let preview = htmlContent
      .replace(/\{\{company_name\}\}/g, branding.company_name)
      .replace(/\{\{company_email\}\}/g, branding.company_email)
      .replace(/\{\{company_phone\}\}/g, branding.company_phone)
      .replace(/\{\{company_address\}\}/g, branding.company_address)
      .replace(/\{\{first_name\}\}/g, 'John')
      .replace(/\{\{subject\}\}/g, 'Sample Email Subject')
      .replace(/\{\{unsubscribe_url\}\}/g, '#')
      .replace(/\{\{preferences_url\}\}/g, '#');

    setPreviewHtml(preview);
  };

  const handleCustomHtmlChange = (html: string) => {
    setCustomHtml(html);
    generatePreview(html);
  };

  const handleTemplateEdit = (template: Template) => {
    setEditingTemplate(template);
    setEditingTemplateData({
      name: template.name,
      description: template.description || '',
      html_content: template.html_content
    });
    setCustomHtml(template.html_content);
    generatePreview(template.html_content);
  };

  const handleCancelEdit = () => {
    setEditingTemplate(null);
    setEditingTemplateData({ name: '', description: '', html_content: '' });
    setCustomHtml('');
    setPreviewHtml('');
  };

  const saveTemplateChanges = async () => {
    if (!editingTemplate) return;

    try {
      const { error } = await supabase
        .from('templates')
        .update({
          name: editingTemplateData.name,
          description: editingTemplateData.description,
          html_content: customHtml,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingTemplate.id);

      if (error) throw error;

      toast({
        title: "Template Updated",
        description: "Your template has been updated successfully.",
      });

      await fetchTemplates();
      handleCancelEdit();
    } catch (error) {
      console.error('Error updating template:', error);
      toast({
        title: "Error",
        description: "Failed to update template. Please try again.",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleRefreshTemplates = () => {
    setTemplates([]);
    setLoading(true);
    
    setTimeout(() => {
      fetchTemplates();
    }, 100);
    
    toast({
      title: "Refreshing...",
      description: "Templates list is being refreshed.",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show template editing view
  if (editingTemplate) {
    return (
      <div className="space-y-6 full-width-container">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={handleCancelEdit}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Templates
            </Button>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">
                Edit Template: {editingTemplate.name}
              </h2>
              <p className="text-muted-foreground">
                Make your template completely editable
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowBrandingSettings(true)}>
              <Building className="w-4 h-4 mr-2" />
              Branding
            </Button>
            <Button onClick={saveTemplateChanges}>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full max-w-full">
          {/* Template Properties */}
          <Card className="w-full max-w-full">
            <CardHeader>
              <CardTitle>Template Properties</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 w-full">
              <div className="space-y-2">
                <Label htmlFor="template-name">Template Name</Label>
                <Input
                  id="template-name"
                  value={editingTemplateData.name}
                  onChange={(e) => setEditingTemplateData({
                    ...editingTemplateData,
                    name: e.target.value
                  })}
                  placeholder="My Custom Template"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="template-description">Description</Label>
                <Textarea
                  id="template-description"
                  value={editingTemplateData.description}
                  onChange={(e) => setEditingTemplateData({
                    ...editingTemplateData,
                    description: e.target.value
                  })}
                  placeholder="Description of this template"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Available Variables */}
          <Card className="w-full max-w-full">
            <CardHeader>
              <CardTitle>Available Variables</CardTitle>
            </CardHeader>
            <CardContent className="w-full">
              <div className="grid grid-cols-1 gap-3 text-sm">
                <div className="flex items-center justify-between p-2 bg-muted rounded">
                  <code className="font-mono">{'{{company_name}}'}</code>
                  <span className="text-muted-foreground">Company name</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-muted rounded">
                  <code className="font-mono">{'{{first_name}}'}</code>
                  <span className="text-muted-foreground">Contact first name</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-muted rounded">
                  <code className="font-mono">{'{{company_email}}'}</code>
                  <span className="text-muted-foreground">Company email</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-muted rounded">
                  <code className="font-mono">{'{{company_phone}}'}</code>
                  <span className="text-muted-foreground">Company phone</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-muted rounded">
                  <code className="font-mono">{'{{company_address}}'}</code>
                  <span className="text-muted-foreground">Company address</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-muted rounded">
                  <code className="font-mono">{'{{subject}}'}</code>
                  <span className="text-muted-foreground">Email subject</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* HTML Editor and Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full max-w-full">
          {/* HTML Editor */}
          <Card className="w-full max-w-full">
            <CardHeader>
              <CardTitle>HTML Content</CardTitle>
              <p className="text-sm text-muted-foreground">
                Edit the HTML content directly. Changes appear in preview instantly.
              </p>
            </CardHeader>
            <CardContent className="w-full">
              <Textarea
                value={customHtml}
                onChange={(e) => handleCustomHtmlChange(e.target.value)}
                placeholder="Edit your HTML template here..."
                className="min-h-96 font-mono text-sm"
              />
            </CardContent>
          </Card>

          {/* Live Preview */}
          <Card className="w-full max-w-full">
            <CardHeader>
              <CardTitle>Live Preview</CardTitle>
              <p className="text-sm text-muted-foreground">
                See your changes in real-time
              </p>
            </CardHeader>
            <CardContent className="w-full">
              <div className="border rounded-lg overflow-hidden bg-white w-full">
                <div 
                  className="w-full min-h-96 overflow-auto"
                  dangerouslySetInnerHTML={{ __html: previewHtml }}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Main templates view
  return (
    <div className="space-y-6 full-width-container">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Email Templates</h1>
          <p className="text-muted-foreground">
            Create and manage your email templates
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleRefreshTemplates}>
            Refresh
          </Button>
          <Button onClick={() => setActiveTab('custom')}>
            Create Template
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full max-w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="templates">Available Templates</TabsTrigger>
          <TabsTrigger value="custom">Create Custom Template</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-4 w-full max-w-full">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              Available Templates ({templates.length})
            </h3>
            <Button variant="outline" size="sm" onClick={handleRefreshTemplates}>
              Refresh List
            </Button>
          </div>
          
          {templates.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No templates yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first email template or use our pre-built templates
                </p>
                <Button onClick={() => setShowCreateTemplate(true)} variant="hero">
                  Create Template
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {templates.map((template) => (
                <Card key={template.id} className="hover:shadow-card transition-smooth">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                        {template.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {template.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {template.is_default && (
                          <Badge variant="secondary">Default</Badge>
                        )}
                        <Badge variant="outline">
                          {template.is_default ? 'System' : 'Custom'}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <FileText className="w-4 h-4" />
                        <span>Created {formatDate(template.created_at)}</span>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            generatePreview(template.html_content);
                            setActiveTab('preview');
                          }}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Preview
                        </Button>
                        {!template.is_default && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => duplicateTemplate(template)}
                          >
                            <Copy className="w-4 h-4 mr-1" />
                            Duplicate
                          </Button>
                        )}
                        <Button 
                          variant="secondary" 
                          size="sm"
                          onClick={() => handleTemplateEdit(template)}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                        {onTemplateSelect && (
                          <Button
                            size="sm"
                            onClick={() => onTemplateSelect(template)}
                          >
                            Select
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="custom" className="space-y-4 w-full max-w-full">
          <Card className="w-full max-w-full">
            <CardHeader>
              <CardTitle>Create Custom HTML Template</CardTitle>
              <p className="text-sm text-muted-foreground">
                Create a new email template from scratch. Paste your custom HTML template here. Use variables like {'{{company_name}}'}, {'{{first_name}}'}, etc.
              </p>
            </CardHeader>
            <CardContent className="space-y-4 w-full">
              <div className="space-y-2">
                <Label>Available Variables</Label>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><code className="bg-muted px-2 py-1 rounded">{'{{company_name}}'}</code> - Company name</div>
                  <div><code className="bg-muted px-2 py-1 rounded">{'{{first_name}}'}</code> - Contact first name</div>
                  <div><code className="bg-muted px-2 py-1 rounded">{'{{company_email}}'}</code> - Company email</div>
                  <div><code className="bg-muted px-2 py-1 rounded">{'{{company_phone}}'}</code> - Company phone</div>
                  <div><code className="bg-muted px-2 py-1 rounded">{'{{company_address}}'}</code> - Company address</div>
                  <div><code className="bg-muted px-2 py-1 rounded">{'{{subject}}'}</code> - Email subject</div>
                </div>
              </div>
              <Textarea
                value={customHtml}
                onChange={(e) => handleCustomHtmlChange(e.target.value)}
                placeholder="Paste your HTML template here..."
                className="min-h-96 font-mono text-sm"
              />
              <div className="flex gap-2">
                <Button onClick={() => setActiveTab('preview')}>
                  <Eye className="w-4 h-4 mr-2" />
                  Preview Template
                </Button>
                <Button variant="outline" onClick={() => setShowCreateTemplate(true)}>
                  <Save className="w-4 h-4 mr-2" />
                  Save as Template
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="space-y-4 w-full max-w-full">
          <Card className="w-full max-w-full">
            <CardHeader>
              <CardTitle>Email Preview</CardTitle>
              <p className="text-sm text-muted-foreground">
                Preview how your email will look with current branding settings
              </p>
            </CardHeader>
            <CardContent className="w-full">
              <div className="border rounded-lg overflow-hidden bg-white w-full">
                <div 
                  className="w-full h-96 overflow-auto"
                  dangerouslySetInnerHTML={{ __html: previewHtml }}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Template Form */}
      {showCreateTemplate && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Template</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="template-name">Template Name</Label>
              <Input
                id="template-name"
                value={newTemplate.name}
                onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                placeholder="My Custom Template"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="template-description">Description (Optional)</Label>
              <Input
                id="template-description"
                value={newTemplate.description}
                onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                placeholder="Description of this template"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="template-html">HTML Content</Label>
              <Textarea
                id="template-html"
                value={newTemplate.html_content}
                onChange={(e) => setNewTemplate({ ...newTemplate, html_content: e.target.value })}
                placeholder="<html>...</html>"
                className="min-h-64 font-mono text-sm"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={createTemplate}>Create Template</Button>
              <Button variant="outline" onClick={() => setShowCreateTemplate(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Branding Settings Form */}
      {showBrandingSettings && (
        <Card>
          <CardHeader>
            <CardTitle>Company Branding Settings</CardTitle>
            <p className="text-sm text-muted-foreground">
              Configure your company information that will be used in email templates
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="company-name">
                <Building className="w-4 h-4 inline mr-2" />
                Company Name
              </Label>
              <Input
                id="company-name"
                value={branding.company_name}
                onChange={(e) => setBranding({ ...branding, company_name: e.target.value })}
                placeholder="Your Company Name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-email">
                <Mail className="w-4 h-4 inline mr-2" />
                Company Email
              </Label>
              <Input
                id="company-email"
                type="email"
                value={branding.company_email}
                onChange={(e) => setBranding({ ...branding, company_email: e.target.value })}
                placeholder="contact@yourcompany.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-phone">
                <Phone className="w-4 h-4 inline mr-2" />
                Company Phone
              </Label>
              <Input
                id="company-phone"
                value={branding.company_phone}
                onChange={(e) => setBranding({ ...branding, company_phone: e.target.value })}
                placeholder="+1 (555) 123-4567"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-address">
                <MapPin className="w-4 h-4 inline mr-2" />
                Company Address
              </Label>
              <Textarea
                id="company-address"
                value={branding.company_address}
                onChange={(e) => setBranding({ ...branding, company_address: e.target.value })}
                placeholder="123 Business St, City, State 12345"
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={saveBrandingSettings}>Save Settings</Button>
              <Button variant="outline" onClick={() => setShowBrandingSettings(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TemplateManager; 