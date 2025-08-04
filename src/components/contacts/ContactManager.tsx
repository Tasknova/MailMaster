import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Upload, Users, Plus, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

interface ContactList {
  id: string;
  name: string;
  description: string;
  total_contacts: number;
  created_at: string;
}

interface ContactManagerProps {
  onViewContacts?: (listId: string) => void;
}

const ContactManager = ({ onViewContacts }: ContactManagerProps) => {
  const { user } = useAuth();
  const [contactLists, setContactLists] = useState<ContactList[]>([]);
  const [showCreateList, setShowCreateList] = useState(false);
  const [showUploadCsv, setShowUploadCsv] = useState(false);
  const [showAddContact, setShowAddContact] = useState(false);
  const [selectedListId, setSelectedListId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [csvData, setCsvData] = useState('');
  const [newList, setNewList] = useState({ name: '', description: '' });
  const [csvColumns, setCsvColumns] = useState<string[]>([]);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [showColumnSelection, setShowColumnSelection] = useState(false);
  const [csvRows, setCsvRows] = useState<string[][]>([]);
  const [selectedFileName, setSelectedFileName] = useState<string>('');
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [newContact, setNewContact] = useState({
    email: '',
    first_name: '',
    last_name: '',
    custom_fields: {}
  });

  useEffect(() => {
    if (user) {
      fetchContactLists();
    }
  }, [user]);

  const fetchContactLists = async () => {
    try {
      console.log('Fetching contact lists for user:', user?.id);
      
      const { data, error } = await supabase
        .from('contact_lists')
        .select('*')
        .order('created_at', { ascending: false });

      console.log('Contact lists fetch result:', { data, error });
      if (error) throw error;
      setContactLists(data || []);
    } catch (error) {
      console.error('Error fetching contact lists:', error);
      toast({
        title: "Error fetching contact lists",
        description: error instanceof Error ? error.message : "Failed to load contact lists",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createContactList = async () => {
    if (!newList.name.trim()) {
      toast({ title: "List name is required", variant: "destructive" });
      return;
    }

    try {
      const { error } = await supabase
        .from('contact_lists')
        .insert({
          user_id: user?.id,
          name: newList.name,
          description: newList.description,
        });

      if (error) throw error;

      toast({ title: "Contact list created successfully!" });
      setNewList({ name: '', description: '' });
      setShowCreateList(false);
      fetchContactLists();
    } catch (error) {
      toast({
        title: "Error creating contact list",
        description: error instanceof Error ? error.message : "Failed to create contact list",
        variant: "destructive",
      });
    }
  };

  const parseCsvData = () => {
    if (!csvData.trim()) {
      toast({ title: "Please select a CSV file", variant: "destructive" });
      return;
    }

    try {
      // Parse CSV data
      const lines = csvData.trim().split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      const dataRows = lines.slice(1).map(line => 
        line.split(',').map(v => v.trim().replace(/"/g, ''))
      );

      // Validate CSV format - must have email column
      const hasEmailColumn = headers.some(header => 
        header.toLowerCase().includes('email')
      );

      if (!hasEmailColumn) {
        toast({
          title: "Invalid CSV Format",
          description: "CSV must contain an 'email' column. Required format: fname,lname,email (additional columns optional)",
          variant: "destructive",
        });
        return;
      }

      // Auto-map standard columns
      const emailColumn = headers.find(header => header.toLowerCase().includes('email'));
      const fnameColumn = headers.find(header => 
        header.toLowerCase().includes('fname') || 
        header.toLowerCase().includes('first') && header.toLowerCase().includes('name')
      );
      const lnameColumn = headers.find(header => 
        header.toLowerCase().includes('lname') || 
        header.toLowerCase().includes('last') && header.toLowerCase().includes('name')
      );

      // Set auto-selected columns
      const autoSelected = [emailColumn, fnameColumn, lnameColumn].filter(Boolean);
      setSelectedColumns(autoSelected);

      setCsvColumns(headers);
      setCsvRows(dataRows);
      setShowColumnSelection(true);
    } catch (error) {
      toast({
        title: "Error parsing CSV",
        description: "Please check your CSV format. Required: fname,lname,email",
        variant: "destructive",
      });
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast({
        title: "Invalid file type",
        description: "Please select a CSV file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select a CSV file smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    setIsProcessingFile(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setCsvData(content);
      setSelectedFileName(file.name);
      
      // Auto-parse the CSV after upload
      setTimeout(() => {
        parseCsvData();
        setIsProcessingFile(false);
      }, 100);
    };
    reader.onerror = () => {
      setIsProcessingFile(false);
      toast({
        title: "Error reading file",
        description: "Failed to read the CSV file",
        variant: "destructive",
      });
    };
    reader.readAsText(file);
  };

  const handleColumnSelection = (column: string, checked: boolean) => {
    if (checked) {
      if (selectedColumns.length >= 4) {
        toast({ 
          title: "Maximum 4 columns allowed", 
          variant: "destructive" 
        });
        return;
      }
      setSelectedColumns([...selectedColumns, column]);
    } else {
      setSelectedColumns(selectedColumns.filter(col => col !== column));
    }
  };

  const selectAllColumns = () => {
    const columnsToSelect = csvColumns.slice(0, 4);
    setSelectedColumns(columnsToSelect);
  };

  const clearColumnSelection = () => {
    setSelectedColumns([]);
  };

  const uploadContactsWithSelectedColumns = async () => {
    if (!selectedListId) {
      toast({ title: "Please select a contact list", variant: "destructive" });
      return;
    }

    if (selectedColumns.length === 0) {
      toast({ title: "Please select at least one column", variant: "destructive" });
      return;
    }

    // Ensure email column is selected
    const hasEmailColumn = selectedColumns.some(col => col.toLowerCase().includes('email'));
    if (!hasEmailColumn) {
      toast({ 
        title: "Email column is required", 
        description: "Please select the email column to continue",
        variant: "destructive" 
      });
      return;
    }

    try {
      const contacts = [];
      for (let i = 0; i < csvRows.length; i++) {
        const values = csvRows[i];
        if (values.length >= csvColumns.length) {
          const contact: any = {
            user_id: user?.id,
            list_id: selectedListId,
            email: null,
            first_name: null,
            last_name: null,
            custom_fields: {}
          };

          selectedColumns.forEach((column) => {
            const columnIndex = csvColumns.indexOf(column);
            const value = columnIndex >= 0 ? values[columnIndex] : '';
            
            if (column.toLowerCase().includes('email')) {
              contact.email = value || null;
            } else if (column.toLowerCase().includes('fname') || 
                      (column.toLowerCase().includes('first') && column.toLowerCase().includes('name'))) {
              contact.first_name = value || null;
            } else if (column.toLowerCase().includes('lname') || 
                      (column.toLowerCase().includes('last') && column.toLowerCase().includes('name'))) {
              contact.last_name = value || null;
            } else {
              // Store other columns in custom_fields
              contact.custom_fields[column] = value || null;
            }
          });

          // Only add if email is present and valid
          if (contact.email && contact.email.trim() !== '') {
            contacts.push(contact);
          }
        }
      }

      if (contacts.length === 0) {
        toast({ 
          title: "No valid contacts found", 
          description: "All contacts must have a valid email address",
          variant: "destructive" 
        });
        return;
      }

      // Insert contacts in batches
      const batchSize = 100;
      let insertedCount = 0;
      let errorCount = 0;

      for (let i = 0; i < contacts.length; i += batchSize) {
        const batch = contacts.slice(i, i + batchSize);
        
        const { error } = await supabase
          .from('contacts')
          .insert(batch);

        if (error) {
          console.error('Error inserting batch:', error);
          errorCount += batch.length;
        } else {
          insertedCount += batch.length;
        }
      }

      // Update contact list count
      const currentList = contactLists.find(l => l.id === selectedListId);
      if (currentList) {
        const { error: updateError } = await supabase
          .from('contact_lists')
          .update({ total_contacts: currentList.total_contacts + insertedCount })
          .eq('id', selectedListId);

        if (updateError) {
          console.error('Error updating contact list count:', updateError);
        }
      }

      // Show results
      if (errorCount === 0) {
        toast({
          title: "Upload Successful!",
          description: `Successfully uploaded ${insertedCount} contacts to the list.`,
        });
      } else {
        toast({
          title: "Upload Completed with Issues",
          description: `Uploaded ${insertedCount} contacts, ${errorCount} failed.`,
          variant: "destructive",
        });
      }

      // Reset form
      setShowUploadCsv(false);
      setShowColumnSelection(false);
      setSelectedColumns([]);
      setCsvColumns([]);
      setCsvRows([]);
      setCsvData('');
      setSelectedFileName('');
      setIsProcessingFile(false);
      setSelectedListId('');
      // Reset file input
      const fileInput = document.getElementById('csv-file-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

      // Refresh contact lists
      fetchContactLists();
    } catch (error) {
      console.error('Error uploading contacts:', error);
      toast({
        title: "Error uploading contacts",
        description: error instanceof Error ? error.message : "Failed to upload contacts",
        variant: "destructive",
      });
    }
  };

  const addContactManually = async () => {
    if (!selectedListId) {
      toast({ title: "Please select a contact list", variant: "destructive" });
      return;
    }

    if (!newContact.email.trim()) {
      toast({ title: "Email is required", variant: "destructive" });
      return;
    }

    try {
      const { error } = await supabase
        .from('contacts')
        .insert({
          user_id: user?.id,
          list_id: selectedListId,
          email: newContact.email,
          first_name: newContact.first_name || null,
          last_name: newContact.last_name || null,
          custom_fields: newContact.custom_fields
        });

      if (error) throw error;

      toast({ 
        title: "Contact added successfully!",
        description: "Contact has been added to your list"
      });
      
      setNewContact({
        email: '',
        first_name: '',
        last_name: '',
        custom_fields: {}
      });
      setShowAddContact(false);
      fetchContactLists();
    } catch (error) {
      toast({
        title: "Error adding contact",
        description: error instanceof Error ? error.message : "Failed to add contact",
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

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Contact Lists</h2>
          <p className="text-muted-foreground">Manage your email contact lists</p>
        </div>
                 <div className="flex gap-2">
           <Button variant="outline" onClick={() => setShowAddContact(true)}>
             <Users className="w-4 h-4 mr-2" />
             Add Contact
           </Button>
           <Button variant="outline" onClick={() => setShowUploadCsv(true)}>
             <Upload className="w-4 h-4 mr-2" />
             Upload CSV
           </Button>
           <Button variant="hero" onClick={() => setShowCreateList(true)}>
             <Plus className="w-4 h-4 mr-2" />
             Create List
           </Button>
         </div>
      </div>

             {/* Create List Form */}
       {showCreateList && (
         <Card>
           <CardHeader>
             <CardTitle>Create New Contact List</CardTitle>
           </CardHeader>
           <CardContent className="space-y-4">
             <div className="space-y-2">
               <Label htmlFor="list-name">List Name</Label>
               <Input
                 id="list-name"
                 value={newList.name}
                 onChange={(e) => setNewList({ ...newList, name: e.target.value })}
                 placeholder="My Contact List"
               />
             </div>
             <div className="space-y-2">
               <Label htmlFor="list-description">Description (Optional)</Label>
               <Input
                 id="list-description"
                 value={newList.description}
                 onChange={(e) => setNewList({ ...newList, description: e.target.value })}
                 placeholder="Description of this contact list"
               />
             </div>
             <div className="flex gap-2">
               <Button onClick={createContactList}>Create List</Button>
               <Button variant="outline" onClick={() => setShowCreateList(false)}>
                 Cancel
               </Button>
             </div>
           </CardContent>
         </Card>
       )}

       {/* Add Contact Form */}
       {showAddContact && (
         <Card>
           <CardHeader>
             <CardTitle>Add New Contact</CardTitle>
           </CardHeader>
           <CardContent className="space-y-4">
             <div className="space-y-2">
               <Label htmlFor="contact-list-select">Select Contact List</Label>
               <select
                 id="contact-list-select"
                 value={selectedListId}
                 onChange={(e) => setSelectedListId(e.target.value)}
                 className="w-full px-3 py-2 border border-input bg-background rounded-md"
               >
                 <option value="">Select a list...</option>
                 {contactLists.map((list) => (
                   <option key={list.id} value={list.id}>
                     {list.name}
                   </option>
                 ))}
               </select>
             </div>
             <div className="space-y-2">
               <Label htmlFor="contact-email">Email *</Label>
               <Input
                 id="contact-email"
                 type="email"
                 value={newContact.email}
                 onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                 placeholder="john@example.com"
               />
             </div>
             <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                 <Label htmlFor="contact-first-name">First Name</Label>
                 <Input
                   id="contact-first-name"
                   value={newContact.first_name}
                   onChange={(e) => setNewContact({ ...newContact, first_name: e.target.value })}
                   placeholder="John"
                 />
               </div>
               <div className="space-y-2">
                 <Label htmlFor="contact-last-name">Last Name</Label>
                 <Input
                   id="contact-last-name"
                   value={newContact.last_name}
                   onChange={(e) => setNewContact({ ...newContact, last_name: e.target.value })}
                   placeholder="Doe"
                 />
               </div>
             </div>
             <div className="flex gap-2">
               <Button onClick={addContactManually}>Add Contact</Button>
               <Button variant="outline" onClick={() => setShowAddContact(false)}>
                 Cancel
               </Button>
             </div>
           </CardContent>
         </Card>
       )}

             {/* Upload CSV Form */}
       {showUploadCsv && !showColumnSelection && (
         <Card>
           <CardHeader>
             <CardTitle>Upload Contacts from CSV</CardTitle>
           </CardHeader>
           <CardContent className="space-y-4">
             <div className="space-y-2">
               <Label htmlFor="contact-list">Select Contact List</Label>
               <select
                 id="contact-list"
                 value={selectedListId}
                 onChange={(e) => setSelectedListId(e.target.value)}
                 className="w-full px-3 py-2 border border-input bg-background rounded-md"
               >
                 <option value="">Select a list...</option>
                 {contactLists.map((list) => (
                   <option key={list.id} value={list.id}>
                     {list.name}
                   </option>
                 ))}
               </select>
             </div>
             <div className="space-y-2">
               <Label htmlFor="csv-file-upload">CSV File</Label>
               <div className="space-y-2">
                 <Input
                   type="file"
                   id="csv-file-upload"
                   accept=".csv"
                   onChange={handleFileUpload}
                   className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                 />
                 {selectedFileName && (
                   <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-md">
                     <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                     <span className="text-sm text-green-700">
                       File selected: <strong>{selectedFileName}</strong>
                     </span>
                   </div>
                 )}
                 {isProcessingFile && (
                   <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                     <div className="w-2 h-2 bg-blue-500 rounded-full animate-spin"></div>
                     <span className="text-sm text-blue-700">
                       Processing file...
                     </span>
                   </div>
                 )}
               </div>
               <p className="text-xs text-muted-foreground">
                 <strong>Required format:</strong> fname,lname,email (additional columns optional). Email column is mandatory.
                 <br />
                 <strong>File size limit:</strong> 5MB maximum
               </p>
             </div>
             <div className="flex gap-2">
               <Button onClick={parseCsvData} disabled={!csvData || isProcessingFile}>
                 {isProcessingFile ? 'Processing...' : 'Continue to Column Selection'}
               </Button>
               <Button variant="outline" onClick={() => {
                 setShowUploadCsv(false);
                 setCsvData('');
                 setSelectedFileName('');
                 setIsProcessingFile(false);
                 // Reset file input
                 const fileInput = document.getElementById('csv-file-upload') as HTMLInputElement;
                 if (fileInput) fileInput.value = '';
               }}>
                 Cancel
               </Button>
             </div>
           </CardContent>
         </Card>
       )}

       {/* Column Selection Form */}
       {showColumnSelection && (
         <Card>
           <CardHeader>
             <CardTitle>Select Columns to Import</CardTitle>
             <p className="text-sm text-muted-foreground">
               Choose up to 4 columns from your CSV file. <strong>Email column is required.</strong>
             </p>
           </CardHeader>
           <CardContent className="space-y-4">
             <div className="space-y-2">
               <Label>Contact List</Label>
               <select
                 value={selectedListId}
                 onChange={(e) => setSelectedListId(e.target.value)}
                 className="w-full px-3 py-2 border border-input bg-background rounded-md"
               >
                 <option value="">Select a list...</option>
                 {contactLists.map((list) => (
                   <option key={list.id} value={list.id}>
                     {list.name}
                   </option>
                 ))}
               </select>
             </div>

             <div className="space-y-3">
               <div className="flex items-center justify-between">
                 <Label>Available Columns ({csvColumns.length})</Label>
                 <div className="flex gap-2">
                   <Button 
                     variant="outline" 
                     size="sm" 
                     onClick={selectAllColumns}
                     disabled={selectedColumns.length >= 4}
                   >
                     Select All (Max 4)
                   </Button>
                   <Button 
                     variant="outline" 
                     size="sm" 
                     onClick={clearColumnSelection}
                   >
                     Clear All
                   </Button>
                 </div>
               </div>
               
               <div className="grid grid-cols-2 gap-3">
                 {csvColumns.map((column, index) => (
                   <div key={index} className="flex items-center space-x-2">
                     <input
                       type="checkbox"
                       id={`column-${index}`}
                       checked={selectedColumns.includes(column)}
                       onChange={(e) => handleColumnSelection(column, e.target.checked)}
                       className="rounded border-gray-300"
                     />
                     <Label 
                       htmlFor={`column-${index}`} 
                       className="text-sm font-medium cursor-pointer"
                     >
                       {column}
                     </Label>
                   </div>
                 ))}
               </div>

               {selectedColumns.length > 0 && (
                 <div className="p-3 bg-muted rounded-lg">
                   <p className="text-sm font-medium mb-2">Selected Columns ({selectedColumns.length}/4):</p>
                   <div className="flex flex-wrap gap-2">
                     {selectedColumns.map((column, index) => (
                       <Badge key={index} variant="secondary">
                         {column}
                       </Badge>
                     ))}
                   </div>
                 </div>
               )}

               <div className="text-xs text-muted-foreground">
                 <p>• <strong>Email column is required</strong> - CSV must contain an email column</p>
                 <p>• <strong>Required format:</strong> fname,lname,email (additional columns optional)</p>
                 <p>• Missing values will be set to null automatically</p>
                 <p>• Other columns will be stored as custom fields</p>
               </div>
             </div>

             <div className="flex gap-2">
               <Button 
                 onClick={uploadContactsWithSelectedColumns}
                 disabled={selectedColumns.length === 0 || !selectedListId}
               >
                 Upload {csvRows.length} Contacts
               </Button>
               <Button 
                 variant="outline" 
                 onClick={() => {
                   setShowColumnSelection(false);
                   setSelectedColumns([]);
                   setCsvColumns([]);
                   setCsvRows([]);
                   setCsvData('');
                   setSelectedFileName('');
                   setIsProcessingFile(false);
                   // Reset file input
                   const fileInput = document.getElementById('csv-file-upload') as HTMLInputElement;
                   if (fileInput) fileInput.value = '';
                 }}
               >
                 Back to CSV Input
               </Button>
               <Button 
                 variant="outline" 
                 onClick={() => {
                   setShowUploadCsv(false);
                   setShowColumnSelection(false);
                   setSelectedColumns([]);
                   setCsvColumns([]);
                   setCsvRows([]);
                   setCsvData('');
                   setSelectedFileName('');
                   setIsProcessingFile(false);
                   // Reset file input
                   const fileInput = document.getElementById('csv-file-upload') as HTMLInputElement;
                   if (fileInput) fileInput.value = '';
                 }}
               >
                 Cancel
               </Button>
             </div>
           </CardContent>
         </Card>
       )}

      {/* Contact Lists */}
      {contactLists.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No contact lists yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first contact list to organize your email recipients
            </p>
            <Button onClick={() => setShowCreateList(true)} variant="hero">
              Create Your First List
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {contactLists.map((list) => (
            <Card key={list.id} className="hover:shadow-card transition-smooth">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{list.name}</CardTitle>
                    {list.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {list.description}
                      </p>
                    )}
                  </div>
                  <Badge variant="secondary">
                    {list.total_contacts} contact{list.total_contacts !== 1 ? 's' : ''}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FileText className="w-4 h-4" />
                    <span>Created {formatDate(list.created_at)}</span>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => onViewContacts?.(list.id)}
                    >
                      View Contacts
                    </Button>
                    <Button 
                      variant="secondary" 
                      size="sm"
                      onClick={() => {
                        // TODO: Implement edit list functionality
                        toast({
                          title: "Edit List",
                          description: "Edit functionality coming soon!",
                        });
                      }}
                    >
                      Edit List
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ContactManager;