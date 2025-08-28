import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Eye, 
  Settings, 
  User, 
  Mail, 
  Building, 
  Globe,
  X,
  RefreshCw,
  Copy,
  Plus,
  GripVertical,
  Edit3,
  ArrowLeft
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface TemplateVariable {
  name: string;
  displayName: string;
  description: string;
  type: 'text' | 'email' | 'contact_field' | 'custom';
  defaultValue?: string;
  contactField?: string;
  value?: string;
  isCustom?: boolean;
}

interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  company_name?: string;
}

interface Template {
  id: string;
  name: string;
  description: string | null;
  html_content: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

const TemplatePreviewPage = () => {
  const { templateId } = useParams<{ templateId: string }>();
  const navigate = useNavigate();
  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('preview');
  const [previewHtml, setPreviewHtml] = useState('');
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<string>('');
  const [contactsLoading, setContactsLoading] = useState(false);
  const [showCreateVariable, setShowCreateVariable] = useState(false);
  const [newVariable, setNewVariable] = useState({ name: '', displayName: '', defaultValue: '' });
  const [editingVariable, setEditingVariable] = useState<string | null>(null);
  const [variableInputMode, setVariableInputMode] = useState<'manual' | 'contact'>('manual');

  // Common template variables
  const commonVariables: TemplateVariable[] = [
    {
      name: 'first_name',
      displayName: 'First Name',
      description: 'Recipient\'s first name',
      type: 'contact_field',
      contactField: 'first_name',
      defaultValue: 'John'
    },
    {
      name: 'last_name',
      displayName: 'Last Name',
      description: 'Recipient\'s last name',
      type: 'contact_field',
      contactField: 'last_name',
      defaultValue: 'Doe'
    },
    {
      name: 'email',
      displayName: 'Email',
      description: 'Recipient\'s email address',
      type: 'contact_field',
      contactField: 'email',
      defaultValue: 'john@example.com'
    },
    {
      name: 'company_name',
      displayName: 'Company Name',
      description: 'Recipient\'s company name',
      type: 'contact_field',
      contactField: 'company_name',
      defaultValue: 'Sample Company'
    },
    {
      name: 'subject',
      displayName: 'Subject',
      description: 'Email subject line',
      type: 'text',
      defaultValue: 'Welcome to our platform!'
    },
    {
      name: 'unsubscribe_url',
      displayName: 'Unsubscribe URL',
      description: 'Link for unsubscribing',
      type: 'text',
      defaultValue: '#'
    },
    {
      name: 'preferences_url',
      displayName: 'Preferences URL',
      description: 'Link for email preferences',
      type: 'text',
      defaultValue: '#'
    }
  ];

  const [customVariables, setCustomVariables] = useState<TemplateVariable[]>([]);
  const allVariables = [...commonVariables, ...customVariables];

  useEffect(() => {
    if (templateId) {
      fetchTemplate();
    }
  }, [templateId]);

  useEffect(() => {
    if (template) {
      extractVariables();
      generatePreview();
    }
  }, [template]);

  const fetchTemplate = async () => {
    if (!templateId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .eq('id', templateId)
        .single();

      if (error) throw error;
      setTemplate(data);
    } catch (error) {
      console.error('Error fetching template:', error);
      toast({
        title: "Error",
        description: "Failed to load template",
        variant: "destructive",
      });
      navigate('/templates');
    } finally {
      setLoading(false);
    }
  };

  const fetchContacts = async () => {
    setContactsLoading(true);
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .limit(10);

      if (error) throw error;
      setContacts(data || []);
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setContactsLoading(false);
    }
  };

  const extractVariables = () => {
    if (!template) return;
    
    const variableRegex = /\{\{(\w+)\}\}/g;
    const foundVariables = new Set<string>();
    let match;

    while ((match = variableRegex.exec(template.html_content)) !== null) {
      const variable = match[1].trim();
      // Exclude 'subject' variable since it's handled separately
      if (variable !== 'subject') {
        foundVariables.add(variable);
      }
    }

    // Add any new custom variables found in the template
    const newCustomVars = Array.from(foundVariables)
      .filter(varName => !commonVariables.find(v => v.name === varName))
      .map(varName => ({
        name: varName,
        displayName: varName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        description: `Custom variable: ${varName}`,
        type: 'custom' as const,
        defaultValue: `Sample ${varName}`,
        isCustom: true
      }));

    setCustomVariables(newCustomVars);
  };

  const generatePreview = () => {
    if (!template) return;
    
    let preview = template.html_content;
    
    // Replace variables with their values
    allVariables.forEach(variable => {
      const value = variables[variable.name] || variable.defaultValue || `{{${variable.name}}}`;
      preview = preview.replace(new RegExp(`\\{\\{${variable.name}\\}\\}`, 'g'), value);
    });

    setPreviewHtml(preview);
  };

  const handleVariableChange = (varName: string, value: string) => {
    setVariables(prev => ({
      ...prev,
      [varName]: value
    }));
  };

  const handleContactChange = (contactId: string) => {
    setSelectedContact(contactId);
    const contact = contacts.find(c => c.id === contactId);
    
    if (contact) {
      const newVariables = { ...variables };
      
      // Update contact-related variables
      allVariables.forEach(variable => {
        if (variable.type === 'contact_field' && variable.contactField) {
          newVariables[variable.name] = contact[variable.contactField as keyof Contact] || '';
        }
      });
      
      setVariables(newVariables);
    }
  };

  const resetVariables = () => {
    const resetVars: Record<string, string> = {};
    allVariables.forEach(variable => {
      resetVars[variable.name] = variable.defaultValue || '';
    });
    setVariables(resetVars);
  };

  const copyPreviewHtml = () => {
    navigator.clipboard.writeText(previewHtml);
    toast({
      title: "HTML Copied",
      description: "Preview HTML has been copied to clipboard",
    });
  };

  const getVariableValue = (variable: TemplateVariable): string => {
    if (variableInputMode === 'contact' && variable.type === 'contact_field') {
      return `[${variable.contactField}]`;
    }
    return variables[variable.name] || variable.defaultValue || '';
  };

  const handleCreateVariable = () => {
    if (!newVariable.name.trim() || !newVariable.displayName.trim()) {
      toast({
        title: "Missing required fields",
        description: "Variable name and display name are required",
        variant: "destructive",
      });
      return;
    }

    const newVar: TemplateVariable = {
      name: newVariable.name,
      displayName: newVariable.displayName,
      description: newVariable.defaultValue || 'Custom variable',
      type: 'custom',
      defaultValue: newVariable.defaultValue,
      isCustom: true
    };

    setCustomVariables(prev => [...prev, newVar]);
    setNewVariable({ name: '', displayName: '', defaultValue: '' });
    setShowCreateVariable(false);
  };

  const handleDeleteVariable = (varName: string) => {
    setCustomVariables(prev => prev.filter(v => v.name !== varName));
    setVariables(prev => {
      const newVars = { ...prev };
      delete newVars[varName];
      return newVars;
    });
  };

  // Update preview when variables change
  useEffect(() => {
    generatePreview();
  }, [variables, template]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Template Not Found</h2>
          <p className="text-muted-foreground mb-4">The template you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/templates')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Templates
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate('/templates')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Templates
              </Button>
              <div>
                <h1 className="text-2xl font-bold">{template.name} - Preview</h1>
                {template.description && (
                  <p className="text-sm text-muted-foreground">{template.description}</p>
                )}
              </div>
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
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="variables">Variables</TabsTrigger>
            <TabsTrigger value="html">HTML</TabsTrigger>
          </TabsList>

          {/* Preview Tab */}
          <TabsContent value="preview" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Email Preview</CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={resetVariables}>
                      <RefreshCw className="w-4 h-4 mr-1" />
                      Reset
                    </Button>
                    <Button variant="outline" size="sm" onClick={copyPreviewHtml}>
                      <Copy className="w-4 h-4 mr-1" />
                      Copy HTML
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="border border-border rounded-lg overflow-hidden bg-white">
                  <div 
                    className="w-full min-h-[600px] overflow-auto p-6"
                    dangerouslySetInnerHTML={{ __html: previewHtml }}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Variables Tab */}
          <TabsContent value="variables" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Template Variables</CardTitle>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setShowCreateVariable(true)}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Variable
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Configure variables to see how your template will look with different data
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Input Mode Toggle */}
                <div className="flex items-center gap-4">
                  <Label className="text-sm font-medium">Input Mode:</Label>
                  <div className="flex border rounded-md">
                    <Button
                      variant={variableInputMode === 'manual' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setVariableInputMode('manual')}
                      className="rounded-r-none"
                    >
                      Manual
                    </Button>
                    <Button
                      variant={variableInputMode === 'contact' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => {
                        setVariableInputMode('contact');
                        if (contacts.length === 0) {
                          fetchContacts();
                        }
                      }}
                      className="rounded-l-none"
                    >
                      Contact Data
                    </Button>
                  </div>
                </div>

                {/* Contact Selector */}
                {variableInputMode === 'contact' && (
                  <div className="space-y-2">
                    <Label>Select Contact</Label>
                    {contactsLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                        <span className="text-sm text-muted-foreground">Loading contacts...</span>
                      </div>
                    ) : contacts.length > 0 ? (
                      <Select value={selectedContact} onValueChange={handleContactChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a contact" />
                        </SelectTrigger>
                        <SelectContent>
                          {contacts.map((contact) => (
                            <SelectItem key={contact.id} value={contact.id}>
                              {contact.first_name} {contact.last_name} ({contact.email})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-sm text-muted-foreground">No contacts available</p>
                    )}
                  </div>
                )}

                {/* Variables List */}
                <div className="space-y-4">
                  {allVariables.map((variable) => (
                    <div key={variable.name} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Label className="font-medium">{variable.displayName}</Label>
                          {variable.isCustom && (
                            <Badge variant="secondary" className="text-xs">Custom</Badge>
                          )}
                          {variable.type === 'contact_field' && (
                            <Badge variant="outline" className="text-xs">Contact Field</Badge>
                          )}
                        </div>
                        {variable.isCustom && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteVariable(variable.name)}
                            className="h-6 w-6 p-0"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {variable.description}
                      </p>
                      <div className="space-y-2">
                        <Label className="text-xs">Value</Label>
                        <Input
                          value={getVariableValue(variable)}
                          onChange={(e) => handleVariableChange(variable.name, e.target.value)}
                          placeholder={`Enter ${variable.displayName.toLowerCase()}`}
                          className="text-sm"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Create Variable Modal */}
                {showCreateVariable && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <Card className="w-96">
                      <CardHeader>
                        <CardTitle>Create Custom Variable</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label>Variable Name</Label>
                          <Input
                            value={newVariable.name}
                            onChange={(e) => setNewVariable({ ...newVariable, name: e.target.value })}
                            placeholder="variable_name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Display Name</Label>
                          <Input
                            value={newVariable.displayName}
                            onChange={(e) => setNewVariable({ ...newVariable, displayName: e.target.value })}
                            placeholder="Variable Name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Default Value</Label>
                          <Input
                            value={newVariable.defaultValue}
                            onChange={(e) => setNewVariable({ ...newVariable, defaultValue: e.target.value })}
                            placeholder="Default value"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button onClick={handleCreateVariable}>Create</Button>
                          <Button variant="outline" onClick={() => setShowCreateVariable(false)}>
                            Cancel
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* HTML Tab */}
          <TabsContent value="html" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Generated HTML</CardTitle>
                <p className="text-sm text-muted-foreground">
                  The final HTML with all variables replaced
                </p>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={previewHtml}
                  readOnly
                  className="min-h-[600px] font-mono text-sm resize-none"
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default TemplatePreviewPage;
