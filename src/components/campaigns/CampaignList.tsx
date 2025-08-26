import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Mail, 
  Users, 
  Eye, 
  MousePointer, 
  Calendar,
  Plus,
  ArrowRight,
  Trash2,
  Edit
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { getStatusColor } from '@/lib/theme';
import { toast } from '@/hooks/use-toast';

interface Campaign {
  id: string;
  name: string;
  subject: string;
  status: string;
  total_recipients: number;
  total_sent: number;
  total_opened: number;
  total_clicked: number;
  created_at: string;
  sent_at: string | null;
}

interface CampaignListProps {
  onCreateCampaign: () => void;
  onViewCampaign: (campaign: Campaign) => void;
  onEditCampaign?: (campaign: Campaign) => void;
  refreshTrigger?: number;
}

const CampaignList = ({ onCreateCampaign, onViewCampaign, onEditCampaign, refreshTrigger }: CampaignListProps) => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingCampaignId, setDeletingCampaignId] = useState<string | null>(null);

  useEffect(() => {
    fetchCampaigns();
  }, [refreshTrigger]); // Refresh when refreshTrigger changes

  const fetchCampaigns = async () => {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching campaigns:', error);
      } else {
        setCampaigns(data || []);
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCampaign = async (campaignId: string) => {
    if (!confirm('Are you sure you want to delete this campaign? This action cannot be undone.')) {
      return;
    }

    setDeletingCampaignId(campaignId);
    try {
      const { error } = await supabase
        .from('campaigns')
        .delete()
        .eq('id', campaignId);

      if (error) {
        throw error;
      }

      toast({
        title: "Campaign Deleted",
        description: "The campaign has been successfully deleted.",
      });

      // Refresh the campaigns list
      fetchCampaigns();
    } catch (error) {
      console.error('Error deleting campaign:', error);
      toast({
        title: "Error Deleting Campaign",
        description: error instanceof Error ? error.message : "Failed to delete campaign",
        variant: "destructive",
      });
    } finally {
      setDeletingCampaignId(null);
    }
  };

  const handleEditCampaign = (campaign: Campaign) => {
    if (onEditCampaign) {
      onEditCampaign(campaign);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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
          <h2 className="text-2xl font-bold tracking-tight">Campaigns</h2>
          <p className="text-muted-foreground">Manage and track your email campaigns</p>
        </div>
        <Button onClick={onCreateCampaign} variant="hero" className="gap-2">
          <Plus className="w-4 h-4" />
          Create Campaign
        </Button>
      </div>

      {campaigns.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Mail className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No campaigns yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first email campaign to get started
            </p>
            <Button onClick={onCreateCampaign} variant="hero">
              Create Your First Campaign
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {campaigns.map((campaign) => (
            <Card key={campaign.id} className="hover:shadow-card transition-smooth">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{campaign.name}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {campaign.subject}
                    </p>
                  </div>
                  <Badge className={getStatusColor(campaign.status)}>
                    {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{campaign.total_recipients}</p>
                      <p className="text-xs text-muted-foreground">Recipients</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{campaign.total_sent}</p>
                      <p className="text-xs text-muted-foreground">Sent</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">
                        {campaign.total_sent > 0 
                          ? `${Math.round((campaign.total_opened / campaign.total_sent) * 100)}%`
                          : '0%'
                        }
                      </p>
                      <p className="text-xs text-muted-foreground">Open Rate</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <MousePointer className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">
                        {campaign.total_sent > 0 
                          ? `${Math.round((campaign.total_clicked / campaign.total_sent) * 100)}%`
                          : '0%'
                        }
                      </p>
                      <p className="text-xs text-muted-foreground">Click Rate</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {campaign.sent_at 
                        ? `Sent ${formatDate(campaign.sent_at)}`
                        : `Created ${formatDate(campaign.created_at)}`
                      }
                    </span>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => onViewCampaign(campaign)}>
                      View Details
                    </Button>
                    {campaign.status === 'draft' && (
                      <Button 
                        variant="default" 
                        size="sm"
                        onClick={() => handleEditCampaign(campaign)}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                    )}
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleDeleteCampaign(campaign.id)}
                      disabled={deletingCampaignId === campaign.id}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      {deletingCampaignId === campaign.id ? (
                        <div className="animate-spin h-4 w-4" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
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

export default CampaignList;