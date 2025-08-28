import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  Send, 
  FileText, 
  Users, 
  Mail, 
  Eye, 
  ChevronLeft, 
  ChevronRight,
  Save,
  Clock,
  Plus,
  X,
  GripVertical
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import GmailService from '@/services/gmailService';

interface ContactList {
  id: string;
  name: string;
  total_contacts: number;
  fields?: string[]; // Contact list fields for variable mapping
}

interface Template {
  id: string;
  name: string;
  description: string;
  html_content: string;
  is_default: boolean;
  created_at: string;
  variables?: string[]; // Template variables
}

interface VariableMapping {
  [key: string]: {
    manualValue: string;
    contactField: string;
  };
}

interface CampaignBuilderProps {
  onBack: () => void;
  onCreateContactList?: () => void;
  onCampaignSent?: () => void;
  campaignId?: string;
  onViewTemplate?: (templateId: string) => void;
}

const CampaignBuilder = ({ onBack, onCreateContactList, onCampaignSent, campaignId, onViewTemplate }: CampaignBuilderProps) => {
  const { user } = useAuth();
  const [contactLists, setContactLists] = useState<ContactList[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);
  const [sendingEmails, setSendingEmails] = useState(false);
  const [sendingProgress, setSendingProgress] = useState({ current: 0, total: 0 });
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedContactList, setSelectedContactList] = useState<ContactList | null>(null);
  const [draggedVariable, setDraggedVariable] = useState<string | null>(null);
  const subjectInputRef = useRef<HTMLInputElement>(null);
  
  // Campaign form state
  const [campaignName, setCampaignName] = useState('');
  const [campaignDescription, setCampaignDescription] = useState('');
  const [subjectLine, setSubjectLine] = useState('');
  const [selectedListId, setSelectedListId] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  
  // Variable mappings
  const [subjectVariables, setSubjectVariables] = useState<VariableMapping>({});
  const [templateVariables, setTemplateVariables] = useState<VariableMapping>({});
  
  // Campaign action
  const [campaignAction, setCampaignAction] = useState<'send' | 'draft' | 'schedule'>('send');
  const [scheduleDate, setScheduleDate] = useState('');

  const steps = [
    { id: 1, title: 'Campaign Details', description: 'Name and description' },
    { id: 2, title: 'Contact List', description: 'Select recipients' },
    { id: 3, title: 'Subject Line', description: 'Email subject with variables' },
    { id: 4, title: 'Template & Action', description: 'Select template and send campaign' }
  ];

  const fetchContactLists = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('contact_lists')
        .select('id, name, total_contacts')
        .order('name');

      if (error) throw error;
      
      // Fetch contact fields for each list
      const listsWithFields = await Promise.all(
        (data || []).map(async (list) => {
          const { data: contacts } = await supabase
            .from('contacts')
            .select('*')
            .eq('list_id', list.id)
            .limit(1);
          
          const fields = contacts && contacts.length > 0 ? Object.keys(contacts[0]).filter(key => 
            !['id', 'user_id', 'list_id', 'created_at', 'updated_at'].includes(key)
          ) : ['email', 'first_name', 'last_name'];
          
          return { ...list, fields };
        })
      );
      
      setContactLists(listsWithFields);
    } catch (error) {
      console.error('Error fetching contact lists:', error);
    }
  }, []);

  const fetchTemplates = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Extract variables from template content
      const templatesWithVariables = (data || []).map(template => {
        const variables = extractVariablesFromContent(template.html_content);
        return { ...template, variables };
      });
      
      setTemplates(templatesWithVariables);
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  }, []);

  const extractVariablesFromContent = (content: string): string[] => {
    const variableRegex = /\{\{([^}]+)\}\}/g;
    const variables: string[] = [];
    let match;
    
    while ((match = variableRegex.exec(content)) !== null) {
      const variable = match[1].trim();
      // Exclude 'subject' variable since it's handled separately in the subject line
      if (variable !== 'subject') {
        variables.push(variable);
      }
    }
    
    return [...new Set(variables)]; // Remove duplicates
  };

  useEffect(() => {
    if (user?.id) {
      fetchContactLists();
      fetchTemplates();
    }
  }, [user?.id, fetchContactLists, fetchTemplates]);

  const handleListChange = (listId: string) => {
    setSelectedListId(listId);
    const list = contactLists.find(l => l.id === listId);
    setSelectedContactList(list || null);
  };

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const template = templates.find(t => t.id === templateId);
          if (template && template.variables) {
        // Initialize template variables
        const initialVariables: VariableMapping = {};
        template.variables.forEach(variable => {
          if (!templateVariables[variable]) {
            initialVariables[variable] = { manualValue: '', contactField: '' };
          }
        });
        setTemplateVariables(prev => ({ ...prev, ...initialVariables }));
      }
  };

  const updateTemplateVariable = (variable: string, field: 'manualValue' | 'contactField', value: string) => {
    setTemplateVariables(prev => ({
      ...prev,
      [variable]: {
        ...prev[variable],
        [field]: value
      }
    }));
  };

  const getSelectedTemplate = () => {
    return templates.find(t => t.id === selectedTemplateId);
  };

  const handleViewTemplate = () => {
    if (selectedTemplateId && onViewTemplate) {
      onViewTemplate(selectedTemplateId);
    } else {
      toast({
        title: "No Template Selected",
        description: "Please select a template first to view it",
        variant: "destructive",
      });
    }
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, variable: string) => {
    setDraggedVariable(variable);
    e.dataTransfer.setData('text/plain', variable);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e: React.DragEvent, target: 'subject' | 'template') => {
    e.preventDefault();
    const variable = e.dataTransfer.getData('text/plain');
    
    if (target === 'subject' && subjectInputRef.current) {
      const input = subjectInputRef.current;
      const start = input.selectionStart || 0;
      const end = input.selectionEnd || 0;
      const currentValue = subjectLine;
      
      const newValue = currentValue.substring(0, start) + `{{${variable}}}` + currentValue.substring(end);
      setSubjectLine(newValue);
      
      // Add the variable to subjectVariables mapping
      setSubjectVariables(prev => ({
        ...prev,
        [variable]: {
          manualValue: '',
          contactField: variable
        }
      }));
      
      // Set cursor position after the inserted variable
      setTimeout(() => {
        input.focus();
        input.setSelectionRange(start + variable.length + 4, start + variable.length + 4);
      }, 0);
    }
    
    setDraggedVariable(null);
  };

  // Extract variables from subject line and update subjectVariables
  const extractSubjectVariables = (subject: string) => {
    const variableRegex = /\{\{([^}]+)\}\}/g;
    const variables: string[] = [];
    let match;
    
    while ((match = variableRegex.exec(subject)) !== null) {
      const variable = match[1].trim();
      variables.push(variable);
    }
    
    // Update subjectVariables with new variables
    const newSubjectVariables: VariableMapping = {};
    variables.forEach(variable => {
      newSubjectVariables[variable] = {
        manualValue: subjectVariables[variable]?.manualValue || '',
        contactField: subjectVariables[variable]?.contactField || variable
      };
    });
    
    setSubjectVariables(newSubjectVariables);
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!campaignName.trim();
      case 2:
        return !!selectedListId;
      case 3:
        return !!subjectLine.trim();
      case 4:
        return true; // Step 4 is now the final step, so it's always valid
      default:
        return false;
    }
  };

  const canProceed = validateStep(currentStep);
  const canGoBack = currentStep > 1;

  const nextStep = () => {
    if (canProceed && currentStep < 4) { // Changed to 4
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (canGoBack) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSaveCampaign = async (action: 'send' | 'draft' | 'schedule') => {
    if (!validateStep(1) || !validateStep(2) || !validateStep(3) || !validateStep(4)) { // Changed to 4
      toast({
        title: "Validation Error",
        description: "Please complete all required fields",
        variant: "destructive",
      });
      return;
    }

    // Check Gmail authentication if action is 'send'
    if (action === 'send') {
      const gmailService = new GmailService();
      const isAuthenticated = await gmailService.isAuthenticated();
      
      if (!isAuthenticated) {
        toast({
          title: "Gmail Not Configured",
          description: "Please configure Gmail settings before sending campaigns",
          variant: "destructive",
        });
        return;
      }
    }

    setLoading(true);
    try {
      // Get the selected template to extract HTML content
      const selectedTemplate = templates.find(t => t.id === selectedTemplateId);
      if (!selectedTemplate) {
        throw new Error('Selected template not found');
      }

             // Get user profile and company profile for from_name and from_email
       // Fetch user profile
       const { data: userProfile, error: profileError } = await supabase
         .from('profiles')
         .select('name, email')
         .eq('id', user?.id)
         .single();

       if (profileError) {
         console.error('Error fetching user profile:', profileError);
         throw new Error('Failed to fetch user profile');
       }

             const campaignData = {
         user_id: user?.id,
         name: campaignName,
         description: campaignDescription,
         subject: subjectLine, // Use 'subject' instead of 'subject_line'
         html_content: selectedTemplate.html_content, // Required field
         text_content: null, // Optional field
         from_name: userProfile?.name || 'MailMaster', // Required field
         from_email: userProfile?.email || user?.email, // Required field
         reply_to_email: userProfile?.email || user?.email, // Optional field
         contact_list_id: selectedListId,
         template_id: selectedTemplateId,
         status: action === 'send' ? 'sent' : action === 'draft' ? 'draft' : 'scheduled',
         scheduled_at: action === 'schedule' && scheduleDate ? new Date(scheduleDate).toISOString() : null,
         sent_at: action === 'send' ? new Date().toISOString() : null,
         subject_variables: subjectVariables,
         template_variables: templateVariables,
         total_recipients: selectedContactList?.total_contacts || 0
       };

      const { data: campaign, error } = await supabase
        .from('campaigns')
        .insert(campaignData)
        .select()
        .single();

      if (error) throw error;

             // If action is 'send', actually send the emails
       if (action === 'send') {
         setSendingEmails(true);
         try {
           await sendCampaignEmails(campaign, selectedTemplate, userProfile);
         } finally {
           setSendingEmails(false);
         }
       }

      toast({
        title: "Campaign Saved",
        description: `Campaign has been ${action === 'send' ? 'sent' : action === 'draft' ? 'saved as draft' : 'scheduled'}`,
      });

      if (onCampaignSent) {
        onCampaignSent();
      }
    } catch (error) {
      console.error('Error saving campaign:', error);
      toast({
        title: "Error",
        description: "Failed to save campaign",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Function to send campaign emails
  const sendCampaignEmails = async (campaign: any, template: any, userProfile: any) => {
    try {
      // Check if Gmail is authenticated
      const gmailService = new GmailService();
      const isAuthenticated = await gmailService.isAuthenticated();
      
      if (!isAuthenticated) {
        throw new Error('Gmail not authenticated. Please configure Gmail settings first.');
      }

      // Get all contacts from the selected contact list
      const { data: contacts, error: contactsError } = await supabase
        .from('contacts')
        .select('*')
        .eq('list_id', selectedListId);

      if (contactsError) throw contactsError;
      if (!contacts || contacts.length === 0) {
        throw new Error('No contacts found in the selected list');
      }

      let sentCount = 0;
      let errorCount = 0;

      // Set initial progress
      setSendingProgress({ current: 0, total: contacts.length });

      // Send emails to each contact
      for (let i = 0; i < contacts.length; i++) {
        const contact = contacts[i];
        setSendingProgress({ current: i + 1, total: contacts.length });
        try {
          // Process template variables
          let processedHtml = template.html_content;
          let processedSubject = subjectLine;

                     // Replace template variables with contact data or manual values
           if (templateVariables) {
             Object.keys(templateVariables).forEach(variable => {
               const mapping = templateVariables[variable];
               let value = '';

               // Use contact field mapping if available, otherwise use manual value
               if (mapping.contactField && contact[mapping.contactField]) {
                 value = contact[mapping.contactField];
               } else if (mapping.manualValue) {
                 value = mapping.manualValue;
               }

               // Replace variable in HTML content
               const variableRegex = new RegExp(`\\{\\{${variable}\\}\\}`, 'g');
               processedHtml = processedHtml.replace(variableRegex, value);
             });
           }

           

                     // Replace subject line variables
           console.log('Processing subject line variables:', subjectVariables);
           console.log('Original subject:', processedSubject);
           if (subjectVariables) {
             Object.keys(subjectVariables).forEach(variable => {
               const mapping = subjectVariables[variable];
               let value = '';

               if (mapping.contactField && contact[mapping.contactField]) {
                 value = contact[mapping.contactField];
               } else if (mapping.manualValue) {
                 value = mapping.manualValue;
               }

               console.log(`Replacing {{${variable}}} with: ${value}`);
               const variableRegex = new RegExp(`\\{\\{${variable}\\}\\}`, 'g');
               processedSubject = processedSubject.replace(variableRegex, value);
             });
           }
           console.log('Processed subject:', processedSubject);

                     // Send email using Gmail service
                     await gmailService.sendEmail({
            to: [contact.email],
            subject: processedSubject,
            htmlContent: processedHtml,
            fromName: userProfile?.name || 'MailMaster',
            fromEmail: userProfile?.email || user?.email
          });

          sentCount++;
        } catch (emailError) {
          console.error(`Error sending email to ${contact.email}:`, emailError);
          errorCount++;
        }
      }

      // Update campaign with sending results
      await supabase
        .from('campaigns')
        .update({
          total_sent: sentCount,
          total_bounced: errorCount,
          status: errorCount === 0 ? 'sent' : 'sent_with_errors'
        })
        .eq('id', campaign.id);

      if (errorCount > 0) {
        toast({
          title: "Campaign Sent with Errors",
          description: `Sent: ${sentCount}, Errors: ${errorCount}`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Campaign Sent Successfully",
          description: `All ${sentCount} emails sent successfully!`,
        });
      }

    } catch (error) {
      console.error('Error sending campaign emails:', error);
      throw error;
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Campaign Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="campaign-name">Campaign Name *</Label>
                  <Input
                    id="campaign-name"
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                    placeholder="Enter a unique campaign name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="campaign-description">Campaign Description</Label>
                  <Textarea
                    id="campaign-description"
                    value={campaignDescription}
                    onChange={(e) => setCampaignDescription(e.target.value)}
                    placeholder="Describe your campaign (optional)"
                    rows={3}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 2:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Contact List
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="contact-list">Contact List *</Label>
                  <Select value={selectedListId} onValueChange={handleListChange}>
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
                
                {selectedContactList && (
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-medium text-blue-900 mb-2">
                      Selected: {selectedContactList.name}
                    </h4>
                    <p className="text-sm text-blue-700 mb-2">
                      {selectedContactList.total_contacts} contacts
                    </p>
                    {selectedContactList.fields && (
                      <div>
                        <p className="text-sm text-blue-700 mb-1">Available fields:</p>
                        <div className="flex flex-wrap gap-1">
                          {selectedContactList.fields.map(field => (
                            <Badge key={field} variant="secondary" className="text-xs">
                              {field}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCreateContactList}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Contact List
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 3:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Subject Line
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject Line *</Label>
                                     <Input
                     ref={subjectInputRef}
                     id="subject"
                     value={subjectLine}
                     onChange={(e) => {
                       setSubjectLine(e.target.value);
                       extractSubjectVariables(e.target.value);
                     }}
                     placeholder="Enter your email subject"
                     onDragOver={handleDragOver}
                     onDrop={(e) => handleDrop(e, 'subject')}
                     className="min-h-[60px]"
                   />
                </div>
                
                                 {selectedContactList && selectedContactList.fields && (
                   <div className="space-y-2">
                     <Label>Drag & Drop Variables</Label>
                     <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                       {selectedContactList.fields.map(field => (
                         <Badge 
                           key={field} 
                           variant="outline" 
                           className="cursor-grab active:cursor-grabbing flex items-center gap-1 hover:bg-primary hover:text-primary-foreground transition-colors"
                           draggable
                           onDragStart={(e) => handleDragStart(e, field)}
                         >
                           <GripVertical className="w-3 h-3" />
                           {field}
                         </Badge>
                       ))}
                     </div>
                     <p className="text-xs text-muted-foreground">
                       Drag any variable above and drop it into the subject line input
                     </p>
                   </div>
                 )}

                 {/* Subject Line Variables Configuration */}
                 {Object.keys(subjectVariables).length > 0 && (
                   <div className="space-y-4">
                     <Label>Subject Line Variables</Label>
                     <div className="space-y-3">
                       {Object.keys(subjectVariables).map(variable => (
                         <div key={variable} className="p-4 border rounded-lg space-y-3">
                           <Label className="font-medium">{variable}</Label>
                           
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                             <div className="space-y-2">
                               <Label className="text-sm">Manual Value</Label>
                               <Input
                                 value={subjectVariables[variable]?.manualValue || ''}
                                 onChange={(e) => setSubjectVariables(prev => ({
                                   ...prev,
                                   [variable]: {
                                     ...prev[variable],
                                     manualValue: e.target.value
                                   }
                                 }))}
                                 placeholder={`Enter manual value for ${variable}`}
                               />
                             </div>
                             
                             <div className="space-y-2">
                               <Label className="text-sm">Contact Field Mapping</Label>
                               <Select 
                                 value={subjectVariables[variable]?.contactField || 'no-mapping'}
                                 onValueChange={(value) => setSubjectVariables(prev => ({
                                   ...prev,
                                   [variable]: {
                                     ...prev[variable],
                                     contactField: value === 'no-mapping' ? '' : value
                                   }
                                 }))}
                               >
                                 <SelectTrigger>
                                   <SelectValue placeholder="Select contact field" />
                                 </SelectTrigger>
                                 <SelectContent>
                                   <SelectItem value="no-mapping">No mapping</SelectItem>
                                   {selectedContactList?.fields?.map(field => (
                                     <SelectItem key={field} value={field}>
                                       {field}
                                     </SelectItem>
                                   ))}
                                 </SelectContent>
                               </Select>
                             </div>
                           </div>
                           
                           <div className="text-xs text-muted-foreground">
                             You can set both a manual value and a contact field mapping. The contact field will override the manual value when sending.
                           </div>
                         </div>
                       ))}
                     </div>
                   </div>
                 )}
              </div>
            </CardContent>
          </Card>
        );

      case 4:
        const selectedTemplate = getSelectedTemplate();
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Email Template
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email-template">Email Template *</Label>
                  <div className="flex gap-2">
                    <Select value={selectedTemplateId} onValueChange={handleTemplateChange}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Choose a template" />
                      </SelectTrigger>
                      <SelectContent>
                        {templates.map((template) => (
                          <SelectItem key={template.id} value={template.id}>
                            {template.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleViewTemplate}
                      disabled={!selectedTemplateId}
                      className="flex-shrink-0"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </Button>
                  </div>
                </div>

                {selectedTemplate && (
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <h4 className="font-medium text-green-900 mb-2">
                        Template Selected: {selectedTemplate.name}
                      </h4>
                      <p className="text-sm text-green-700">
                        {selectedTemplate.description}
                      </p>
                    </div>

                    {selectedTemplate.variables && selectedTemplate.variables.length > 0 && (
                      <div className="space-y-4">
                        <Label>Template Variables</Label>
                        
                        {/* Available Contact Fields for Drag & Drop */}
                        {selectedContactList && selectedContactList.fields && (
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">Available Contact Fields (Drag & Drop)</Label>
                            <div className="flex flex-wrap gap-2 p-3 bg-blue-50 rounded-lg border-2 border-dashed border-blue-300">
                              {selectedContactList.fields.map(field => (
                                <Badge 
                                  key={field} 
                                  variant="outline" 
                                  className="cursor-grab active:cursor-grabbing flex items-center gap-1 hover:bg-blue-600 hover:text-white transition-colors"
                                  draggable
                                  onDragStart={(e) => handleDragStart(e, field)}
                                >
                                  <GripVertical className="w-3 h-3" />
                                  {field}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Variable Configuration */}
                        <div className="space-y-3">
                          {selectedTemplate.variables.map(variable => (
                            <div key={variable} className="p-4 border rounded-lg space-y-3">
                              <Label className="font-medium">{variable}</Label>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="space-y-2">
                                  <Label className="text-sm">Manual Value</Label>
                                  <Input
                                    value={templateVariables[variable]?.manualValue || ''}
                                    onChange={(e) => updateTemplateVariable(variable, 'manualValue', e.target.value)}
                                    placeholder={`Enter manual value for ${variable}`}
                                  />
                                </div>
                                
                                <div className="space-y-2">
                                  <Label className="text-sm">Contact Field Mapping</Label>
                                  <Select 
                                    value={templateVariables[variable]?.contactField || 'no-mapping'}
                                    onValueChange={(value) => updateTemplateVariable(variable, 'contactField', value === 'no-mapping' ? '' : value)}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select contact field" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="no-mapping">No mapping</SelectItem>
                                      {selectedContactList?.fields?.map(field => (
                                        <SelectItem key={field} value={field}>
                                          {field}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                              
                              <div className="text-xs text-muted-foreground">
                                You can set both a manual value and a contact field mapping. The contact field will override the manual value when sending.
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons - Added to template selection page */}
                <div className="mt-6 pt-6 border-t">
                  <Label className="text-lg font-semibold mb-4 block">Campaign Action</Label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <Button
                      variant={campaignAction === 'send' ? 'default' : 'outline'}
                      className="h-20 flex flex-col gap-2"
                      onClick={() => setCampaignAction('send')}
                    >
                      <Send className="w-5 h-5" />
                      <span>Send Now</span>
                    </Button>
                    
                    <Button
                      variant={campaignAction === 'draft' ? 'default' : 'outline'}
                      className="h-20 flex flex-col gap-2"
                      onClick={() => setCampaignAction('draft')}
                    >
                      <Save className="w-5 h-5" />
                      <span>Save Draft</span>
                    </Button>
                    
                    <Button
                      variant={campaignAction === 'schedule' ? 'default' : 'outline'}
                      className="h-20 flex flex-col gap-2"
                      onClick={() => setCampaignAction('schedule')}
                    >
                      <Clock className="w-5 h-5" />
                      <span>Schedule</span>
                    </Button>
                  </div>

                  {campaignAction === 'schedule' && (
                    <div className="space-y-2 mb-4">
                      <Label htmlFor="schedule-date">Schedule Date & Time</Label>
                      <Input
                        id="schedule-date"
                        type="datetime-local"
                        value={scheduleDate}
                        onChange={(e) => setScheduleDate(e.target.value)}
                      />
                    </div>
                  )}

                                     <div className="flex gap-2">
                     <Button
                       onClick={() => handleSaveCampaign(campaignAction)}
                       disabled={loading || sendingEmails || (campaignAction === 'schedule' && !scheduleDate)}
                       className="flex-1"
                     >
                       {loading || sendingEmails ? (
                         <div className="flex items-center gap-2">
                           <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                           {sendingEmails ? 
                             `Sending Emails... (${sendingProgress.current}/${sendingProgress.total})` : 
                             'Saving...'
                           }
                         </div>
                       ) : (
                         <>
                           {campaignAction === 'send' && <Send className="w-4 h-4 mr-2" />}
                           {campaignAction === 'draft' && <Save className="w-4 h-4 mr-2" />}
                           {campaignAction === 'schedule' && <Clock className="w-4 h-4 mr-2" />}
                           {campaignAction === 'send' ? 'Send Campaign' : 
                            campaignAction === 'draft' ? 'Save as Draft' : 'Schedule Campaign'}
                         </>
                       )}
                     </Button>
                   </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      default:
        return null;
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
    <div className="w-full max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Create New Campaign</h1>
            <p className="text-muted-foreground">Step {currentStep} of 4: {steps[currentStep - 1].description}</p>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                step.id <= currentStep 
                  ? 'bg-primary border-primary text-primary-foreground' 
                  : 'border-gray-300 text-gray-500'
              }`}>
                {step.id < currentStep ? (
                  <span className="text-xs">✓</span>
                ) : (
                  <span className="text-xs">{step.id}</span>
                )}
              </div>
              <div className="ml-2 hidden sm:block">
                <div className="text-sm font-medium">{step.title}</div>
                <div className="text-xs text-muted-foreground">{step.description}</div>
              </div>
              {index < steps.length - 1 && (
                <div className={`w-16 h-0.5 mx-4 ${
                  step.id < currentStep ? 'bg-primary' : 'bg-gray-300'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      {renderStepContent()}

      {/* Navigation */}
      <div className="flex justify-between mt-8">
        <Button
          variant="outline"
          onClick={prevStep}
          disabled={!canGoBack}
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>
        
        <div className="flex gap-2">
          {currentStep < 4 ? ( // Changed to 4
            <Button
              onClick={nextStep}
              disabled={!canProceed}
            >
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default CampaignBuilder;