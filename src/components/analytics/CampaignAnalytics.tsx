import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3, 
  Mail, 
  MousePointer, 
  Eye, 
  AlertTriangle, 
  UserMinus,
  TrendingUp,
  Calendar,
  Users
} from 'lucide-react';
import { AnalyticsService, CampaignAnalytics, EmailClick, EmailOpen } from '@/services/analyticsService';
import { RealtimeAnalyticsService, RealtimeAnalyticsData } from '@/services/realtimeAnalyticsService';
import { useRealtimeAnalytics } from '@/hooks/useRealtimeAnalytics';
import { toast } from '@/hooks/use-toast';

interface CampaignAnalyticsProps {
  campaignId: string;
  campaignName: string;
}

const CampaignAnalytics: React.FC<CampaignAnalyticsProps> = ({ campaignId, campaignName }) => {
  const [activeTab, setActiveTab] = useState('overview');
  
  const {
    data,
    loading,
    error,
    isRealtime,
    lastUpdated,
    refresh,
    toggleRealtime
  } = useRealtimeAnalytics(campaignId, {
    enabled: true,
    fallbackToPolling: true
  });

  const analytics = data?.analytics || null;
  const clicks = data?.clicks || [];
  const opens = data?.opens || [];

  // Handle errors
  useEffect(() => {
    if (error) {
      toast({
        title: "Analytics Error",
        description: error,
        variant: "destructive"
      });
    }
  }, [error]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (rate: number) => {
    if (rate >= 20) return 'text-green-600';
    if (rate >= 10) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">No analytics data available for this campaign.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
             <div className="flex items-center justify-between">
         <div>
           <h2 className="text-2xl font-bold tracking-tight">Campaign Analytics</h2>
           <p className="text-muted-foreground">{campaignName}</p>
           {lastUpdated && (
             <p className="text-xs text-muted-foreground mt-1">
               Last updated: {lastUpdated.toLocaleTimeString()}
               {isRealtime && (
                 <span className="ml-2 inline-flex items-center">
                   <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-1"></div>
                   Live
                 </span>
               )}
             </p>
           )}
         </div>
         <div className="flex items-center space-x-2">
           <Button 
             onClick={toggleRealtime} 
             variant={isRealtime ? "default" : "outline"} 
             size="sm"
           >
             {isRealtime ? (
               <>
                 <div className="w-2 h-2 bg-white rounded-full animate-pulse mr-2"></div>
                 Live
               </>
             ) : (
               <>
                 <div className="w-2 h-2 bg-gray-400 rounded-full mr-2"></div>
                 Manual
               </>
             )}
           </Button>
           {!isRealtime && (
             <Button onClick={refresh} variant="outline" size="sm">
               <TrendingUp className="w-4 h-4 mr-2" />
               Refresh
             </Button>
           )}
         </div>
       </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="clicks">Clicks</TabsTrigger>
          <TabsTrigger value="opens">Opens</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
                <Mail className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.total_sent}</div>
                <p className="text-xs text-muted-foreground">
                  Emails sent to recipients
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Open Rate</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${getStatusColor(analytics.open_rate)}`}>
                  {analytics.open_rate}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {analytics.total_opened} out of {analytics.total_delivered} opened
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Click Rate</CardTitle>
                <MousePointer className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${getStatusColor(analytics.click_rate)}`}>
                  {analytics.click_rate}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {analytics.total_clicked} out of {analytics.total_delivered} clicked
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Bounce Rate</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {analytics.bounce_rate}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {analytics.total_bounced} out of {analytics.total_sent} bounced
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Stats */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Delivery Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Delivered</span>
                  <Badge variant="secondary">{analytics.total_delivered}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Bounced</span>
                  <Badge variant="destructive">{analytics.total_bounced}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Unsubscribed</span>
                  <Badge variant="outline">{analytics.total_unsubscribed}</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Engagement Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Opened</span>
                  <Badge variant="default">{analytics.total_opened}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Clicked</span>
                  <Badge variant="default">{analytics.total_clicked}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">CTR</span>
                  <Badge variant="secondary">{analytics.click_rate}%</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="clicks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Click Analytics</CardTitle>
              <p className="text-sm text-muted-foreground">
                Detailed click tracking for this campaign
              </p>
            </CardHeader>
            <CardContent>
              {clicks.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No clicks recorded yet
                </p>
              ) : (
                <div className="space-y-4">
                  {clicks.map((click) => (
                    <div key={click.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-sm truncate">{click.original_url}</p>
                        <p className="text-xs text-muted-foreground">
                          Clicked: {formatDate(click.created_at)}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="text-xs">
                          {click.user_agent ? 'Desktop' : 'Unknown'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="opens" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Open Analytics</CardTitle>
              <p className="text-sm text-muted-foreground">
                Detailed open tracking for this campaign
              </p>
            </CardHeader>
            <CardContent>
              {opens.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No opens recorded yet
                </p>
              ) : (
                <div className="space-y-4">
                  {opens.map((open) => (
                    <div key={open.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-sm">Email Opened</p>
                        <p className="text-xs text-muted-foreground">
                          Opened: {formatDate(open.opened_at)}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="text-xs">
                          {open.user_agent ? 'Desktop' : 'Unknown'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Event Timeline</CardTitle>
              <p className="text-sm text-muted-foreground">
                All events for this campaign
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Mail className="h-4 w-4 text-blue-500" />
                    <div>
                      <p className="font-medium text-sm">Campaign Sent</p>
                      <p className="text-xs text-muted-foreground">
                        {analytics.total_sent} emails sent
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary">Sent</Badge>
                </div>

                {analytics.total_opened > 0 && (
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Eye className="h-4 w-4 text-green-500" />
                      <div>
                        <p className="font-medium text-sm">Emails Opened</p>
                        <p className="text-xs text-muted-foreground">
                          {analytics.total_opened} emails opened
                        </p>
                      </div>
                    </div>
                    <Badge variant="default">Opened</Badge>
                  </div>
                )}

                {analytics.total_clicked > 0 && (
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <MousePointer className="h-4 w-4 text-purple-500" />
                      <div>
                        <p className="font-medium text-sm">Links Clicked</p>
                        <p className="text-xs text-muted-foreground">
                          {analytics.total_clicked} links clicked
                        </p>
                      </div>
                    </div>
                    <Badge variant="default">Clicked</Badge>
                  </div>
                )}

                {analytics.total_bounced > 0 && (
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      <div>
                        <p className="font-medium text-sm">Emails Bounced</p>
                        <p className="text-xs text-muted-foreground">
                          {analytics.total_bounced} emails bounced
                        </p>
                      </div>
                    </div>
                    <Badge variant="destructive">Bounced</Badge>
                  </div>
                )}

                {analytics.total_unsubscribed > 0 && (
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <UserMinus className="h-4 w-4 text-orange-500" />
                      <div>
                        <p className="font-medium text-sm">Unsubscribed</p>
                        <p className="text-xs text-muted-foreground">
                          {analytics.total_unsubscribed} users unsubscribed
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline">Unsubscribed</Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CampaignAnalytics;
