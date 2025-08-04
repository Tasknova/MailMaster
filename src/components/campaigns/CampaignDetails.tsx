import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowLeft, 
  Mail, 
  Users, 
  Eye, 
  MousePointer, 
  Calendar,
  Clock,
  BarChart3,
  AlertCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { getStatusColor, getIconColor } from '@/lib/theme';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';

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
}

interface CampaignDetailsProps {
  campaignId: string;
  onBack: () => void;
}

const CampaignDetails = ({ campaignId, onBack }: CampaignDetailsProps) => {
  const { user } = useAuth();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (campaignId) {
      fetchCampaignDetails();
    }
  }, [campaignId]);

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
        return <Mail className="w-5 h-5" />;
      case 'draft':
        return <Clock className="w-5 h-5" />;
      case 'scheduled':
        return <Calendar className="w-5 h-5" />;
      case 'sending':
        return <Mail className="w-5 h-5" />;
      case 'failed':
        return <AlertCircle className="w-5 h-5" />;
      default:
        return <Clock className="w-5 h-5" />;
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
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="text-center p-8">
        <h3 className="text-lg font-semibold mb-2">Campaign not found</h3>
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
          <h2 className="text-2xl font-bold tracking-tight">{campaign.name}</h2>
          <p className="text-muted-foreground">{campaign.subject}</p>
        </div>
      </div>

      {/* Campaign Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getStatusIcon(campaign.status)}
            Campaign Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <Badge className={getStatusColor(campaign.status)}>
                {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
              </Badge>
              <p className="text-sm text-muted-foreground mt-1">
                {campaign.sent_at 
                  ? `Sent on ${formatDate(campaign.sent_at)}`
                  : campaign.scheduled_at 
                    ? `Scheduled for ${formatDate(campaign.scheduled_at)}`
                    : `Created on ${formatDate(campaign.created_at)}`
                }
              </p>
            </div>
            {campaign.status === 'draft' && (
              <Button variant="hero">Edit Campaign</Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Campaign Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Campaign Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium">From</Label>
              <p className="text-sm text-muted-foreground">
                {campaign.from_name} &lt;{campaign.from_email}&gt;
              </p>
            </div>
            {campaign.reply_to_email && (
              <div>
                <Label className="text-sm font-medium">Reply To</Label>
                <p className="text-sm text-muted-foreground">{campaign.reply_to_email}</p>
              </div>
            )}
            <div>
              <Label className="text-sm font-medium">Subject Line</Label>
              <p className="text-sm text-muted-foreground">{campaign.subject}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{campaign.total_recipients}</div>
                <div className="text-sm text-muted-foreground">Recipients</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{campaign.total_sent}</div>
                <div className="text-sm text-muted-foreground">Sent</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{calculateOpenRate()}%</div>
                <div className="text-sm text-muted-foreground">Open Rate</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{calculateClickRate()}%</div>
                <div className="text-sm text-muted-foreground">Click Rate</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Detailed Analytics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Delivery Stats */}
          <div>
            <h4 className="font-semibold mb-3">Delivery Statistics</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3">
                <Mail className={`w-5 h-5 ${getIconColor('success')}`} />
                <div>
                  <div className="font-medium">{campaign.total_delivered}</div>
                  <div className="text-sm text-muted-foreground">Delivered</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <AlertCircle className={`w-5 h-5 ${getIconColor('error')}`} />
                <div>
                  <div className="font-medium">{campaign.total_bounced}</div>
                  <div className="text-sm text-muted-foreground">Bounced ({calculateBounceRate()}%)</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Users className={`w-5 h-5 ${getIconColor('primary')}`} />
                <div>
                  <div className="font-medium">{campaign.total_unsubscribed}</div>
                  <div className="text-sm text-muted-foreground">Unsubscribed</div>
                </div>
              </div>
            </div>
          </div>

          {/* Engagement Stats */}
          <div>
            <h4 className="font-semibold mb-3">Engagement Statistics</h4>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Open Rate</span>
                  <span>{calculateOpenRate()}%</span>
                </div>
                <Progress value={calculateOpenRate()} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Click Rate</span>
                  <span>{calculateClickRate()}%</span>
                </div>
                <Progress value={calculateClickRate()} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Bounce Rate</span>
                  <span>{calculateBounceRate()}%</span>
                </div>
                <Progress value={calculateBounceRate()} className="h-2" />
              </div>
            </div>
          </div>

          {/* Detailed Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <Eye className={`w-5 h-5 ${getIconColor('primary')}`} />
              <div>
                <div className="font-medium">{campaign.total_opened}</div>
                <div className="text-sm text-muted-foreground">Total Opens</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <MousePointer className={`w-5 h-5 ${getIconColor('secondary')}`} />
              <div>
                <div className="font-medium">{campaign.total_clicked}</div>
                <div className="text-sm text-muted-foreground">Total Clicks</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Email Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Email Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div 
            className="border rounded-lg p-4 bg-white"
            dangerouslySetInnerHTML={{ __html: campaign.html_content }}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default CampaignDetails; 