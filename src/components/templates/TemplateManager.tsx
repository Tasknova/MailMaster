import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  Eye, 
  Edit, 
  Copy, 
  Save,
  ArrowLeft,
  Building
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

interface Template {
  id: string;
  name: string;
  description: string | null;
  html_content: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

interface TemplateManagerProps {
  onTemplateSelect?: (template: Template) => void;
  selectedTemplateId?: string;
}

const TemplateManager = ({ onTemplateSelect, selectedTemplateId }: TemplateManagerProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('templates');
  const [customHtml, setCustomHtml] = useState('');
  const [previewHtml, setPreviewHtml] = useState('');
  const [showCreateTemplate, setShowCreateTemplate] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    html_content: ''
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

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
      toast({
        title: "Error fetching templates",
        description: error instanceof Error ? error.message : "Failed to load templates",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createTemplate = async () => {
    if (!newTemplate.name.trim() || !newTemplate.html_content.trim()) {
      toast({
        title: "Missing required fields",
        description: "Template name and HTML content are required",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('templates')
        .insert({
          user_id: user?.id,
          name: newTemplate.name,
          description: newTemplate.description || null,
          html_content: newTemplate.html_content,
          is_default: false
        });

      if (error) throw error;

      toast({
        title: "Template Created",
        description: "Your template has been created successfully.",
      });

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

  const generatePreview = (htmlContent: string) => {
    let preview = htmlContent
      .replace(/\{\{company_name\}\}/g, 'Sample Company')
      .replace(/\{\{first_name\}\}/g, 'John')
      .replace(/\{\{last_name\}\}/g, 'Doe')
      .replace(/\{\{subject\}\}/g, 'Sample Email Subject')
      .replace(/\{\{unsubscribe_url\}\}/g, '#')
      .replace(/\{\{preferences_url\}\}/g, '#');

    setPreviewHtml(preview);
  };

  const handleCustomHtmlChange = (html: string) => {
    setCustomHtml(html);
    generatePreview(html);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Email Templates</h1>
          <p className="text-muted-foreground">
            Create and manage your email templates
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchTemplates}>
            Refresh
          </Button>
          <Button onClick={() => setActiveTab('custom')}>
            Create Template
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="templates">Available Templates</TabsTrigger>
            <TabsTrigger value="custom">Create Custom Template</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>

          {/* Templates List Tab */}
          <TabsContent value="templates" className="w-full mt-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                Available Templates ({templates.length})
              </h3>
              <Button variant="outline" size="sm" onClick={fetchTemplates}>
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
              <div className="grid gap-4 w-full">
                {templates.map((template) => (
                  <Card key={template.id} className="hover:shadow-card transition-smooth w-full">
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
                            onClick={() => navigate(`/template-preview/${template.id}`)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Preview
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

          {/* Create Custom Template Tab */}
          <TabsContent value="custom" className="w-full mt-4">
            <Card className="w-full">
              <CardHeader>
                <CardTitle>Create Custom HTML Template</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Create a new email template from scratch. Use variables like {'{{company_name}}'}, {'{{first_name}}'}, etc.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Available Variables</Label>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><code className="bg-muted px-2 py-1 rounded">{'{{company_name}}'}</code> - Company name</div>
                    <div><code className="bg-muted px-2 py-1 rounded">{'{{first_name}}'}</code> - Contact first name</div>
                    <div><code className="bg-muted px-2 py-1 rounded">{'{{last_name}}'}</code> - Contact last name</div>
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

          {/* Preview Tab */}
          <TabsContent value="preview" className="w-full mt-4">
            <Card className="w-full">
              <CardHeader>
                <CardTitle>Email Preview</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Preview how your email will look with current settings
                </p>
              </CardHeader>
              <CardContent>
                <div className="border border-border rounded-lg overflow-hidden bg-white w-full">
                  <div 
                    className="w-full h-[400px] overflow-auto p-4"
                    dangerouslySetInnerHTML={{ __html: previewHtml || '<p>No content to preview. Create a template or add custom HTML content.</p>' }}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Create Template Form */}
      {showCreateTemplate && (
        <Card className="w-full mt-6">
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

    </div>
  );
};

export default TemplateManager;