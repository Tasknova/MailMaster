import React, { useState, useEffect } from 'react';
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
  ArrowLeft,
  RefreshCw,
  Copy,
  Plus,
  GripVertical,
  X,
  Edit3
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

interface TemplatePreviewProps {
  htmlContent: string;
  onBack: () => void;
  contactListId?: string;
}

const TemplatePreview = ({ htmlContent, onBack, contactListId }: TemplatePreviewProps) => {
  const [activeTab, setActiveTab] = useState('preview');
  const [previewHtml, setPreviewHtml] = useState('');
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<string>('');
  const [loading, setLoading] = useState(false);
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
      defaultValue: 'Sample Subject'
    },
    {
      name: 'unsubscribe_url',
      displayName: 'Unsubscribe URL',
      description: 'Link to unsubscribe from emails',
      type: 'text',
      defaultValue: 'https://example.com/unsubscribe'
    }
  ];

  // Extract custom variables from HTML content
  const extractCustomVariables = (html: string): TemplateVariable[] => {
    const variableRegex = /\{\{([^}]+)\}\}/g;
    const matches = html.match(variableRegex) || [];
    const customVars: TemplateVariable[] = [];

    matches.forEach(match => {
      const varName = match.replace(/\{\{|\}\}/g, '');
      const existingVar = commonVariables.find(v => v.name === varName);
      
      if (!existingVar) {
        customVars.push({
          name: varName,
          displayName: varName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          description: `Custom variable: ${varName}`,
          type: 'custom',
          defaultValue: `Sample ${varName}`,
          isCustom: true
        });
      }
    });

    return customVars;
  };

  const allVariables = [...commonVariables, ...extractCustomVariables(htmlContent)];

  useEffect(() => {
    if (contactListId) {
      fetchContacts();
    }
    generatePreview();
  }, [htmlContent, variables, contactListId]);

  const fetchContacts = async () => {
    if (!contactListId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('id, first_name, last_name, email, company_name')
        .eq('list_id', contactListId)
        .order('first_name');

      if (error) throw error;
      
      setContacts(data || []);
      
      if (data && data.length > 0) {
        setSelectedContact(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching contacts:', error);
      toast({
        title: "Error fetching contacts",
        description: "Failed to load contacts for preview",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generatePreview = () => {
    let preview = htmlContent;
    
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
    if (variable.type === 'contact_field' && selectedContact && variableInputMode === 'contact') {
      const contact = contacts.find(c => c.id === selectedContact);
      if (contact && variable.contactField) {
        return contact[variable.contactField as keyof Contact] || '';
      }
    }
    return variables[variable.name] || variable.defaultValue || '';
  };

  const createCustomVariable = () => {
    if (!newVariable.name.trim() || !newVariable.displayName.trim()) {
      toast({
        title: "Missing required fields",
        description: "Variable name and display name are required",
        variant: "destructive",
      });
      return;
    }

    // Add the new variable to the HTML content
    const newVariableTag = `{{${newVariable.name}}}`;
    const updatedHtml = htmlContent + `\n<!-- Custom Variable: ${newVariable.displayName} -->\n${newVariableTag}`;
    
    // Update the parent component's HTML content (this would need to be passed as a prop)
    // For now, we'll just add it to our local variables
    const customVar: TemplateVariable = {
      name: newVariable.name,
      displayName: newVariable.displayName,
      description: `Custom variable: ${newVariable.displayName}`,
      type: 'custom',
      defaultValue: newVariable.defaultValue || `Sample ${newVariable.displayName}`,
      isCustom: true
    };

    // Add to variables state
    setVariables(prev => ({
      ...prev,
      [newVariable.name]: newVariable.defaultValue || ''
    }));

    setNewVariable({ name: '', displayName: '', defaultValue: '' });
    setShowCreateVariable(false);
    
    toast({
      title: "Variable Created",
      description: `Custom variable "${newVariable.displayName}" has been created`,
    });
  };

  const insertVariableIntoHtml = (variableName: string) => {
    const variableTag = `{{${variableName}}}`;
    navigator.clipboard.writeText(variableTag);
    toast({
      title: "Variable Copied",
      description: `Variable tag "${variableTag}" copied to clipboard. Paste it in your HTML editor.`,
    });
  };

  return (
    <div className="w-full h-screen flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Template Preview</h1>
            <p className="text-muted-foreground">Preview and configure your email template</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={resetVariables}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Reset Variables
          </Button>
          <Button variant="outline" size="sm" onClick={copyPreviewHtml}>
            <Copy className="w-4 h-4 mr-2" />
            Copy HTML
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="preview">Preview</TabsTrigger>
              <TabsTrigger value="variables">Variables</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            {/* Preview Tab */}
            <TabsContent value="preview" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="w-5 h-5" />
                    Email Preview
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    How your email will appear to recipients
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                      <div className="text-sm text-gray-600">
                        <strong>From:</strong> Tasknova MailMaster &lt;noreply@tasknova.com&gt;
                      </div>
                      <div className="text-sm text-gray-600">
                        <strong>Subject:</strong> {variables.subject || 'Sample Subject'}
                      </div>
                    </div>
                    <div 
                      className="w-full min-h-[600px] bg-white p-6 overflow-auto"
                      dangerouslySetInnerHTML={{ __html: previewHtml }}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Variables Tab */}
            <TabsContent value="variables" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Contact Selection */}
                {contactListId && contacts.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <User className="w-5 h-5" />
                        Contact Selection
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Select a contact to auto-fill variables
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Select Contact</Label>
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
                      </div>
                      
                      {selectedContact && (
                        <div className="p-3 bg-muted rounded-lg">
                          <h4 className="font-medium mb-2">Selected Contact Details</h4>
                          {(() => {
                            const contact = contacts.find(c => c.id === selectedContact);
                            return contact ? (
                              <div className="text-sm space-y-1">
                                <div><strong>Name:</strong> {contact.first_name} {contact.last_name}</div>
                                <div><strong>Email:</strong> {contact.email}</div>
                                {contact.company_name && (
                                  <div><strong>Company:</strong> {contact.company_name}</div>
                                )}
                              </div>
                            ) : null;
                          })()}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Variable Configuration */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Settings className="w-5 h-5" />
                          Variable Configuration
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          Configure template variables
                        </p>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setShowCreateVariable(true)}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Create Variable
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Input Mode Toggle */}
                    <div className="flex items-center gap-4">
                      <Label className="text-sm font-medium">Input Mode:</Label>
                      <div className="flex gap-2">
                        <Button
                          variant={variableInputMode === 'manual' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setVariableInputMode('manual')}
                        >
                          Manual Input
                        </Button>
                        <Button
                          variant={variableInputMode === 'contact' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setVariableInputMode('contact')}
                        >
                          Contact Mapping
                        </Button>
                      </div>
                    </div>

                    {/* Variable List */}
                    <div className="space-y-3">
                      {allVariables.map((variable) => (
                        <div key={variable.name} className="space-y-2 p-3 border rounded-lg">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Label htmlFor={variable.name} className="text-sm font-medium">
                                {variable.displayName}
                              </Label>
                              <Badge variant="outline" className="text-xs">
                                {variable.type}
                              </Badge>
                              {variable.isCustom && (
                                <Badge variant="secondary" className="text-xs">
                                  Custom
                                </Badge>
                              )}
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => insertVariableIntoHtml(variable.name)}
                                title="Copy variable tag"
                              >
                                <Copy className="w-3 h-3" />
                              </Button>
                              {variable.isCustom && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setEditingVariable(variable.name)}
                                  title="Edit variable"
                                >
                                  <Edit3 className="w-3 h-3" />
                                </Button>
                              )}
                            </div>
                          </div>
                          
                          {variableInputMode === 'manual' ? (
                            <Input
                              id={variable.name}
                              value={getVariableValue(variable)}
                              onChange={(e) => handleVariableChange(variable.name, e.target.value)}
                              placeholder={variable.description}
                              className="text-sm"
                            />
                          ) : (
                            <div className="text-sm text-muted-foreground p-2 bg-muted rounded">
                              {variable.type === 'contact_field' 
                                ? `Mapped from contact: ${variable.contactField}`
                                : 'Manual input required for this variable type'
                              }
                            </div>
                          )}
                          
                          <p className="text-xs text-muted-foreground">
                            {variable.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Preview Settings</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Configure preview display options
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Preview Width</Label>
                      <Select defaultValue="600">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="400">Mobile (400px)</SelectItem>
                          <SelectItem value="600">Desktop (600px)</SelectItem>
                          <SelectItem value="800">Wide (800px)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Theme</Label>
                      <Select defaultValue="light">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="light">Light Theme</SelectItem>
                          <SelectItem value="dark">Dark Theme</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t">
                    <h4 className="font-medium mb-2">Template Variables Found</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {allVariables.map((variable) => (
                        <Badge key={variable.name} variant="secondary" className="text-xs">
                          {`{{${variable.name}}}`}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Create Variable Modal */}
      {showCreateVariable && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Create Custom Variable</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCreateVariable(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Variable Name</Label>
                <Input
                  value={newVariable.name}
                  onChange={(e) => setNewVariable(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., product_name"
                />
                <p className="text-xs text-muted-foreground">
                  Use lowercase with underscores (e.g., product_name, discount_code)
                </p>
              </div>
              
              <div className="space-y-2">
                <Label>Display Name</Label>
                <Input
                  value={newVariable.displayName}
                  onChange={(e) => setNewVariable(prev => ({ ...prev, displayName: e.target.value }))}
                  placeholder="e.g., Product Name"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Default Value</Label>
                <Input
                  value={newVariable.defaultValue}
                  onChange={(e) => setNewVariable(prev => ({ ...prev, defaultValue: e.target.value }))}
                  placeholder="e.g., Sample Product"
                />
              </div>
            </div>
            
            <div className="flex gap-2 mt-6">
              <Button onClick={createCustomVariable} className="flex-1">
                Create Variable
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowCreateVariable(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplatePreview;
