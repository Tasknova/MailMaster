import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  Mail, 
  Users, 
  Eye, 
  MousePointer, 
  Calendar,
  Clock,
  BarChart3,
  AlertCircle,
  TrendingUp,
  Send,
  FileText,
  Settings,
  Trash2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

interface Campaign {
  id: string;
  name: string;
  subject: string;
  status: string;
  from_name: string;
  from_email: string;
  reply_to_email: string;
  html_content: string;
  total_recipients: number;
  total_sent: number;
  total_delivered: number;
  total_bounced: number;
  total_opened: number;
  total_clicked: number;
  total_unsubscribed: number;
  created_at: string;
  sent_at: string | null;
  scheduled_at: string | null;
  list_id: string;
  template_id: string | null;
}

interface CampaignDetailsProps {
  campaignId: string;
  onBack: () => void;
}

const CampaignDetails = ({ campaignId, onBack }: CampaignDetailsProps) => {
  const { user } = useAuth();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (campaignId) {
      fetchCampaignDetails();
    }
  }, [campaignId]);

  // Add a refresh function that can be called externally
  const refreshCampaignDetails = () => {
    if (campaignId) {
      fetchCampaignDetails();
    }
  };

  // Expose refresh function to parent component
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).refreshCampaignDetails = refreshCampaignDetails;
    }
  }, [campaignId]);

  const handleDeleteCampaign = async () => {
    if (!campaign) return;

    if (!confirm('Are you sure you want to delete this campaign? This action cannot be undone.')) {
      return;
    }

    setDeleting(true);
    try {
      const { error } = await supabase
        .from('campaigns')
        .delete()
        .eq('id', campaign.id);

      if (error) {
        throw error;
      }

      toast({
        title: "Campaign Deleted",
        description: "The campaign has been successfully deleted.",
      });

      // Navigate back to campaigns list
      onBack();
    } catch (error) {
      console.error('Error deleting campaign:', error);
      toast({
        title: "Error Deleting Campaign",
        description: error instanceof Error ? error.message : "Failed to delete campaign",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  const fetchCampaignDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', campaignId)
        .single();

      if (error) throw error;
      setCampaign(data);
    } catch (error) {
      console.error('Error fetching campaign details:', error);
      toast({
        title: "Error",
        description: "Failed to load campaign details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <Send className="w-5 h-5 text-green-600" />;
      case 'draft':
        return <FileText className="w-5 h-5 text-gray-600" />;
      case 'scheduled':
        return <Calendar className="w-5 h-5 text-blue-600" />;
      case 'sending':
        return <Mail className="w-5 h-5 text-orange-600" />;
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'draft':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'sending':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
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

  const calculateOpenRate = () => {
    if (!campaign || campaign.total_sent === 0) return 0;
    return Math.round((campaign.total_opened / campaign.total_sent) * 100);
  };

  const calculateClickRate = () => {
    if (!campaign || campaign.total_sent === 0) return 0;
    return Math.round((campaign.total_clicked / campaign.total_sent) * 100);
  };

  const calculateBounceRate = () => {
    if (!campaign || campaign.total_sent === 0) return 0;
    return Math.round((campaign.total_bounced / campaign.total_sent) * 100);
  };

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">Campaign not found</h3>
          <Button onClick={onBack}>Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{campaign.name}</h1>
            <p className="text-muted-foreground">{campaign.subject}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge className={`${getStatusColor(campaign.status)} border`}>
            {getStatusIcon(campaign.status)}
            <span className="ml-1">{campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}</span>
          </Badge>
          {campaign.status === 'draft' && (
            <Button variant="hero" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              Edit Campaign
            </Button>
          )}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleDeleteCampaign}
            disabled={deleting}
            className="text-red-600 border-red-200 hover:bg-red-50"
          >
            {deleting ? (
              <div className="animate-spin h-4 w-4" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="recipients">Recipients</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="mt-6 space-y-6">
              {/* Campaign Info Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Recipients</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{campaign.total_recipients}</div>
                    <p className="text-xs text-muted-foreground">
                      Target audience
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Emails Sent</CardTitle>
                    <Send className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">{campaign.total_sent}</div>
                    <p className="text-xs text-muted-foreground">
                      Successfully sent
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Open Rate</CardTitle>
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">{calculateOpenRate()}%</div>
                    <p className="text-xs text-muted-foreground">
                      {campaign.total_opened} opens
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Click Rate</CardTitle>
                    <MousePointer className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-purple-600">{calculateClickRate()}%</div>
                    <p className="text-xs text-muted-foreground">
                      {campaign.total_clicked} clicks
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Campaign Details */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Campaign Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">From</label>
                      <p className="text-sm text-muted-foreground">
                        {campaign.from_name} &lt;{campaign.from_email}&gt;
                      </p>
                    </div>
                    {campaign.reply_to_email && (
                      <div>
                        <label className="text-sm font-medium">Reply To</label>
                        <p className="text-sm text-muted-foreground">{campaign.reply_to_email}</p>
                      </div>
                    )}
                    <div>
                      <label className="text-sm font-medium">Subject Line</label>
                      <p className="text-sm text-muted-foreground">{campaign.subject}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Created</label>
                      <p className="text-sm text-muted-foreground">{formatDate(campaign.created_at)}</p>
                    </div>
                    {campaign.sent_at && (
                      <div>
                        <label className="text-sm font-medium">Sent</label>
                        <p className="text-sm text-muted-foreground">{formatDate(campaign.sent_at)}</p>
                      </div>
                    )}
                    {campaign.scheduled_at && (
                      <div>
                        <label className="text-sm font-medium">Scheduled</label>
                        <p className="text-sm text-muted-foreground">{formatDate(campaign.scheduled_at)}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Delivery Statistics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-green-600" />
                        <span className="text-sm">Delivered</span>
                      </div>
                      <span className="font-medium">{campaign.total_delivered}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-red-600" />
                        <span className="text-sm">Bounced</span>
                      </div>
                      <span className="font-medium">{campaign.total_bounced} ({calculateBounceRate()}%)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-600" />
                        <span className="text-sm">Unsubscribed</span>
                      </div>
                      <span className="font-medium">{campaign.total_unsubscribed}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="mt-6 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Performance Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600">{calculateOpenRate()}%</div>
                      <div className="text-sm text-muted-foreground">Open Rate</div>
                      <Progress value={calculateOpenRate()} className="mt-2" />
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-purple-600">{calculateClickRate()}%</div>
                      <div className="text-sm text-muted-foreground">Click Rate</div>
                      <Progress value={calculateClickRate()} className="mt-2" />
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-red-600">{calculateBounceRate()}%</div>
                      <div className="text-sm text-muted-foreground">Bounce Rate</div>
                      <Progress value={calculateBounceRate()} className="mt-2" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-3">Engagement Overview</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Total Opens</span>
                          <span className="font-medium">{campaign.total_opened}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Total Clicks</span>
                          <span className="font-medium">{campaign.total_clicked}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Unsubscribes</span>
                          <span className="font-medium">{campaign.total_unsubscribed}</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-3">Delivery Overview</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Successfully Delivered</span>
                          <span className="font-medium">{campaign.total_delivered}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Bounced</span>
                          <span className="font-medium">{campaign.total_bounced}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Delivery Rate</span>
                          <span className="font-medium">
                            {campaign.total_sent > 0 ? Math.round(((campaign.total_delivered / campaign.total_sent) * 100)) : 0}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Recipients Tab */}
            <TabsContent value="recipients" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recipient Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Recipient Details</h3>
                    <p className="text-muted-foreground mb-4">
                      Detailed recipient information and engagement data will be available here.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Total Recipients: {campaign.total_recipients}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Preview Tab */}
            <TabsContent value="preview" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Email Preview</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    How your email appears to recipients
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                      <div className="text-sm text-gray-600">
                        <strong>From:</strong> {campaign.from_name} &lt;{campaign.from_email}&gt;
                      </div>
                      <div className="text-sm text-gray-600">
                        <strong>Subject:</strong> {campaign.subject}
                      </div>
                    </div>
                    <div 
                      className="w-full min-h-[600px] bg-white p-6 overflow-auto"
                      dangerouslySetInnerHTML={{ __html: campaign.html_content }}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default CampaignDetails;