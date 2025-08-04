import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Users, 
  Mail, 
  Plus,
  Search,
  Edit,
  Trash2,
  Download,
  Upload
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

interface Contact {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  status: string;
  created_at: string;
}

interface ContactList {
  id: string;
  name: string;
  description: string;
  total_contacts: number;
  created_at: string;
}

interface ContactDetailsProps {
  listId: string;
  onBack: () => void;
}

const ContactDetails = ({ listId, onBack }: ContactDetailsProps) => {
  const { user } = useAuth();
  const [contactList, setContactList] = useState<ContactList | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddContact, setShowAddContact] = useState(false);
  const [newContact, setNewContact] = useState({
    email: '',
    first_name: '',
    last_name: ''
  });

  useEffect(() => {
    if (listId) {
      fetchContactList();
      fetchContacts();
    }
  }, [listId]);

  const fetchContactList = async () => {
    try {
      const { data, error } = await supabase
        .from('contact_lists')
        .select('*')
        .eq('id', listId)
        .single();

      if (error) throw error;
      setContactList(data);
    } catch (error) {
      toast({
        title: "Error fetching contact list",
        description: error instanceof Error ? error.message : "Failed to load contact list",
        variant: "destructive",
      });
    }
  };

  const fetchContacts = async () => {
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('list_id', listId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setContacts(data || []);
    } catch (error) {
      toast({
        title: "Error fetching contacts",
        description: error instanceof Error ? error.message : "Failed to load contacts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addContact = async () => {
    if (!newContact.email.trim()) {
      toast({ title: "Email is required", variant: "destructive" });
      return;
    }

    try {
      const { error } = await supabase
        .from('contacts')
        .insert({
          user_id: user?.id,
          list_id: listId,
          email: newContact.email,
          first_name: newContact.first_name || null,
          last_name: newContact.last_name || null,
        });

      if (error) throw error;

      toast({ title: "Contact added successfully!" });
      setNewContact({ email: '', first_name: '', last_name: '' });
      setShowAddContact(false);
      fetchContacts();
      fetchContactList(); // Refresh list count
    } catch (error) {
      toast({
        title: "Error adding contact",
        description: error instanceof Error ? error.message : "Failed to add contact",
        variant: "destructive",
      });
    }
  };

  const deleteContact = async (contactId: string) => {
    if (!confirm('Are you sure you want to delete this contact?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', contactId);

      if (error) throw error;

      toast({ title: "Contact deleted successfully!" });
      fetchContacts();
      fetchContactList(); // Refresh list count
    } catch (error) {
      toast({
        title: "Error deleting contact",
        description: error instanceof Error ? error.message : "Failed to delete contact",
        variant: "destructive",
      });
    }
  };

  const exportContacts = () => {
    const csvContent = [
      'email,first_name,last_name,status,created_at',
      ...contacts.map(contact => 
        `${contact.email},${contact.first_name || ''},${contact.last_name || ''},${contact.status},${contact.created_at}`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${contactList?.name}-contacts.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({ title: "Contacts exported successfully!" });
  };

  const filteredContacts = contacts.filter(contact =>
    contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (contact.first_name && contact.first_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (contact.last_name && contact.last_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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

  if (!contactList) {
    return (
      <div className="text-center p-8">
        <h3 className="text-lg font-semibold mb-2">Contact list not found</h3>
        <Button onClick={onBack}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{contactList.name}</h2>
          <p className="text-muted-foreground">
            {contactList.description || 'No description'}
          </p>
        </div>
      </div>

      {/* Contact List Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Contact List Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-2xl font-bold text-primary">{contactList.total_contacts}</div>
              <div className="text-sm text-muted-foreground">Total Contacts</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {contacts.filter(c => c.status === 'active').length}
              </div>
              <div className="text-sm text-muted-foreground">Active</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {formatDate(contactList.created_at)}
              </div>
              <div className="text-sm text-muted-foreground">Created</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search contacts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportContacts}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" onClick={() => setShowAddContact(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Import
          </Button>
          <Button variant="hero" onClick={() => setShowAddContact(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Contact
          </Button>
        </div>
      </div>

      {/* Add Contact Form */}
      {showAddContact && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Email *</label>
                <Input
                  type="email"
                  value={newContact.email}
                  onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                  placeholder="john@example.com"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">First Name</label>
                <Input
                  value={newContact.first_name}
                  onChange={(e) => setNewContact({ ...newContact, first_name: e.target.value })}
                  placeholder="John"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Last Name</label>
                <Input
                  value={newContact.last_name}
                  onChange={(e) => setNewContact({ ...newContact, last_name: e.target.value })}
                  placeholder="Doe"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={addContact}>Add Contact</Button>
              <Button variant="outline" onClick={() => setShowAddContact(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contacts List */}
      <Card>
        <CardHeader>
          <CardTitle>Contacts ({filteredContacts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredContacts.length === 0 ? (
            <div className="text-center py-8">
              <Mail className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No contacts found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm ? 'Try adjusting your search terms' : 'Add your first contact to get started'}
              </p>
              {!searchTerm && (
                <Button onClick={() => setShowAddContact(true)} variant="hero">
                  Add Your First Contact
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredContacts.map((contact) => (
                <div
                  key={contact.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                      <span className="text-xs font-semibold text-primary-foreground">
                        {contact.first_name?.charAt(0) || contact.email.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium">{contact.email}</div>
                      <div className="text-sm text-muted-foreground">
                        {contact.first_name && contact.last_name 
                          ? `${contact.first_name} ${contact.last_name}`
                          : contact.first_name || contact.last_name || 'No name provided'
                        }
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={contact.status === 'active' ? 'default' : 'secondary'}>
                      {contact.status}
                    </Badge>
                    <Button variant="outline" size="sm">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => deleteContact(contact.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ContactDetails; 