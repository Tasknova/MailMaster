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

const ContactManager = () => {
  const { user } = useAuth();
  const [contactLists, setContactLists] = useState<ContactList[]>([]);
  const [showCreateList, setShowCreateList] = useState(false);
  const [showUploadCsv, setShowUploadCsv] = useState(false);
  const [selectedListId, setSelectedListId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [csvData, setCsvData] = useState('');
  const [newList, setNewList] = useState({ name: '', description: '' });

  useEffect(() => {
    if (user) {
      fetchContactLists();
    }
  }, [user]);

  const fetchContactLists = async () => {
    try {
      const { data, error } = await supabase
        .from('contact_lists')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setContactLists(data || []);
    } catch (error) {
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

  const parseCsvAndUpload = async () => {
    if (!csvData.trim()) {
      toast({ title: "Please enter CSV data", variant: "destructive" });
      return;
    }

    if (!selectedListId) {
      toast({ title: "Please select a contact list", variant: "destructive" });
      return;
    }

    try {
      // Parse CSV data
      const lines = csvData.trim().split('\n');
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      
      // Validate required columns
      const emailIndex = headers.findIndex(h => h.includes('email'));
      if (emailIndex === -1) {
        toast({ title: "CSV must contain an 'email' column", variant: "destructive" });
        return;
      }

      const firstNameIndex = headers.findIndex(h => h.includes('first') && h.includes('name'));
      const lastNameIndex = headers.findIndex(h => h.includes('last') && h.includes('name'));

      const contacts = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
        
        if (values[emailIndex]) {
          contacts.push({
            user_id: user?.id,
            list_id: selectedListId,
            email: values[emailIndex],
            first_name: firstNameIndex >= 0 ? values[firstNameIndex] || null : null,
            last_name: lastNameIndex >= 0 ? values[lastNameIndex] || null : null,
          });
        }
      }

      if (contacts.length === 0) {
        toast({ title: "No valid contacts found in CSV", variant: "destructive" });
        return;
      }

      // Insert contacts
      const { error } = await supabase
        .from('contacts')
        .insert(contacts);

      if (error) throw error;

      toast({ 
        title: `Successfully uploaded ${contacts.length} contacts!`,
        description: "Contacts have been added to your list"
      });
      
      setCsvData('');
      setShowUploadCsv(false);
      fetchContactLists();
    } catch (error) {
      toast({
        title: "Error uploading contacts",
        description: error instanceof Error ? error.message : "Failed to upload contacts",
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

      {/* Upload CSV Form */}
      {showUploadCsv && (
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
              <Label htmlFor="csv-data">CSV Data</Label>
              <Textarea
                id="csv-data"
                value={csvData}
                onChange={(e) => setCsvData(e.target.value)}
                placeholder="email,first_name,last_name&#10;john@example.com,John,Doe&#10;jane@example.com,Jane,Smith"
                className="min-h-32"
              />
              <p className="text-xs text-muted-foreground">
                First row should contain column headers. Required: email. Optional: first_name, last_name
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={parseCsvAndUpload}>Upload Contacts</Button>
              <Button variant="outline" onClick={() => setShowUploadCsv(false)}>
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
                    <Button variant="outline" size="sm">
                      View Contacts
                    </Button>
                    <Button variant="secondary" size="sm">
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