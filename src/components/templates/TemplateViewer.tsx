import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save, Edit, Eye, FileText, Settings } from 'lucide-react';
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

interface ContactField {
  name: string;
  label: string;
}

interface VariableMapping {
  variable: string;
  type: 'manual' | 'contact';
  manualValue: string;
  contactField: string;
}

interface TemplateViewerProps {
  templateId: string;
  onBack: () => void;
}

const TemplateViewer = ({ templateId, onBack }: TemplateViewerProps) => {
  const { user } = useAuth();
  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showVariableMapping, setShowVariableMapping] = useState(false);
  
  // Edit form state
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editHtmlContent, setEditHtmlContent] = useState('');

  // Variable mapping state
  const [variableMappings, setVariableMappings] = useState<VariableMapping[]>([]);
  const [availableContactFields] = useState<ContactField[]>([
    { name: 'first_name', label: 'First Name' },
    { name: 'last_name', label: 'Last Name' },
    { name: 'email', label: 'Email' },
    { name: 'company_name', label: 'Company Name' },
    { name: 'phone', label: 'Phone' },
    { name: 'address', label: 'Address' },
    { name: 'city', label: 'City' },
    { name: 'state', label: 'State' },
    { name: 'zip_code', label: 'Zip Code' },
    { name: 'country', label: 'Country' },
  ]);

  const fetchTemplate = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .eq('id', templateId)
        .single();

      if (error) throw error;
      
      setTemplate(data);
      setEditName(data.name);
      setEditDescription(data.description);
      setEditHtmlContent(data.html_content);
      
      // Extract variables and create mappings
      const variables = extractVariables(data.html_content);
      const mappings = variables.map(variable => ({
        variable,
        type: 'manual' as const,
        manualValue: getDefaultValue(variable),
        contactField: ''
      }));
      setVariableMappings(mappings);
    } catch (error) {
      console.error('Error fetching template:', error);
      toast({
        title: "Error",
        description: "Failed to load template",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [templateId]);

  useEffect(() => {
    if (templateId) {
      fetchTemplate();
    }
  }, [templateId, fetchTemplate]);

  const extractVariables = (content: string): string[] => {
    const variableRegex = /\{\{([^}]+)\}\}/g;
    const variables: string[] = [];
    let match;
    while ((match = variableRegex.exec(content)) !== null) {
      const variable = match[1].trim();
      // Exclude 'subject' variable since it's handled separately
      if (variable !== 'subject') {
        variables.push(variable);
      }
    }
    return [...new Set(variables)]; // Remove duplicates
  };

  const getDefaultValue = (variable: string): string => {
    const defaults: { [key: string]: string } = {
      'first_name': 'John',
      'last_name': 'Doe',
      'email': 'john.doe@example.com',
      'company_name': 'Example Corp',
      'company_email': 'contact@example.com',
      'company_address': '123 Main St, City, State',
      'company_phone': '+1 (555) 123-4567',
      'subject': 'Sample Email Subject',
      'unsubscribe_url': '#',
      'preferences_url': '#'
    };
    return defaults[variable] || 'Sample Value';
  };

  const handleSave = useCallback(async () => {
    if (!template) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('templates')
        .update({
          name: editName,
          description: editDescription,
          html_content: editHtmlContent,
        })
        .eq('id', templateId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Template updated successfully",
      });
      
      setIsEditing(false);
      fetchTemplate(); // Refresh the template data
    } catch (error) {
      console.error('Error updating template:', error);
      toast({
        title: "Error",
        description: "Failed to update template",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }, [template, templateId, editName, editDescription, editHtmlContent, fetchTemplate]);

  const getPreviewContent = useCallback(() => {
    if (!editHtmlContent) return '';
    
    let content = editHtmlContent;
    
    // Apply variable mappings
    variableMappings.forEach(mapping => {
      const value = mapping.type === 'manual' ? mapping.manualValue : `[${mapping.contactField}]`;
      content = content.replace(new RegExp(`\\{\\{${mapping.variable}\\}\\}`, 'g'), value);
    });
    
    return content;
  }, [editHtmlContent, variableMappings]);

  const updateVariableMapping = (variable: string, field: keyof VariableMapping, value: string) => {
    setVariableMappings(prev => 
      prev.map(mapping => 
        mapping.variable === variable 
          ? { ...mapping, [field]: value }
          : mapping
      )
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="w-full max-w-6xl mx-auto p-6">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="outline" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Template Not Found</h1>
            <p className="text-muted-foreground">The requested template could not be loaded</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {isEditing ? 'Edit Template' : 'View Template'}
            </h1>
            <p className="text-muted-foreground">
              {isEditing ? 'Modify your email template' : 'Preview and manage your email template'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {!isEditing ? (
            <>
              <Button
                variant="outline"
                onClick={() => setShowVariableMapping(!showVariableMapping)}
              >
                <Settings className="w-4 h-4 mr-2" />
                Variable Settings
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsEditing(true)}
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Template
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditing(false);
                  setEditName(template.name);
                  setEditDescription(template.description);
                  setEditHtmlContent(template.html_content);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Template Details */}
        <div className="space-y-6">
          {/* Template Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Template Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="template-name">Template Name</Label>
                  {isEditing ? (
                    <Input
                      id="template-name"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Enter template name"
                    />
                  ) : (
                    <div className="p-3 bg-gray-50 rounded-md border">
                      {template.name}
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="template-description">Description</Label>
                  {isEditing ? (
                    <Textarea
                      id="template-description"
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      placeholder="Enter template description"
                      rows={3}
                    />
                  ) : (
                    <div className="p-3 bg-gray-50 rounded-md border">
                      {template.description || 'No description'}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Template Type</Label>
                  <div className="p-3 bg-gray-50 rounded-md border">
                    {template.is_default ? 'Default Template' : 'Custom Template'}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Created</Label>
                  <div className="p-3 bg-gray-50 rounded-md border">
                    {new Date(template.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Variable Mapping */}
          {showVariableMapping && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Variable Mapping
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {variableMappings.map((mapping) => (
                    <div key={mapping.variable} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <Label className="font-medium">
                          {`{{${mapping.variable}}}`}
                        </Label>
                        <select
                          value={mapping.type}
                          onChange={(e) => updateVariableMapping(mapping.variable, 'type', e.target.value as 'manual' | 'contact')}
                          className="px-2 py-1 border rounded text-sm"
                        >
                          <option value="manual">Manual Value</option>
                          <option value="contact">Map from Contact</option>
                        </select>
                      </div>
                      
                      {mapping.type === 'manual' ? (
                        <Input
                          value={mapping.manualValue}
                          onChange={(e) => updateVariableMapping(mapping.variable, 'manualValue', e.target.value)}
                          placeholder="Enter value"
                          className="text-sm"
                        />
                      ) : (
                        <select
                          value={mapping.contactField}
                          onChange={(e) => updateVariableMapping(mapping.variable, 'contactField', e.target.value)}
                          className="w-full px-3 py-2 border rounded-md text-sm"
                        >
                          <option value="">Select contact field</option>
                          {availableContactFields.map((field) => (
                            <option key={field.name} value={field.name}>
                              {field.label}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* HTML Content Editor */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Edit className="w-5 h-5" />
                HTML Content
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="html-content">Email HTML</Label>
                {isEditing ? (
                  <Textarea
                    id="html-content"
                    value={editHtmlContent}
                    onChange={(e) => setEditHtmlContent(e.target.value)}
                    placeholder="Enter HTML content for your email template"
                    rows={15}
                    className="font-mono text-sm"
                  />
                ) : (
                  <div className="p-3 bg-gray-50 rounded-md border max-h-96 overflow-auto">
                    <pre className="text-sm font-mono whitespace-pre-wrap">
                      {template.html_content}
                    </pre>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Preview */}
        <div className="space-y-6">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Email Preview
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Preview of your email template with mapped variables
              </p>
            </CardHeader>
            <CardContent>
              <div className="border border-gray-200 rounded-lg overflow-hidden h-full flex flex-col">
                <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex-shrink-0">
                  <div className="text-sm text-gray-600">
                    <strong>From:</strong> Tasknova MailMaster &lt;noreply@tasknova.com&gt;
                  </div>
                  <div className="text-sm text-gray-600">
                    <strong>Subject:</strong> Sample Email Subject
                  </div>
                </div>
                <div 
                  className="flex-1 bg-white p-6 overflow-auto"
                  dangerouslySetInnerHTML={{ 
                    __html: getPreviewContent()
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TemplateViewer;
