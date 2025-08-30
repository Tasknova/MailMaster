import { supabase } from '@/integrations/supabase/client';

export interface CampaignAnalytics {
  total_sent: number;
  total_delivered: number;
  total_opened: number;
  total_clicked: number;
  total_bounced: number;
  total_unsubscribed: number;
  open_rate: number;
  click_rate: number;
  bounce_rate: number;
  unsubscribe_rate: number;
}

export interface EmailEvent {
  id: string;
  campaign_id: string;
  recipient_id: string;
  event_type: 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'unsubscribed';
  event_data: Record<string, any>;
  user_agent?: string;
  ip_address?: string;
  created_at: string;
}

export interface EmailClick {
  id: string;
  campaign_id: string;
  recipient_id: string;
  original_url: string;
  clicked_url: string;
  user_agent?: string;
  ip_address?: string;
  created_at: string;
}

export interface EmailOpen {
  id: string;
  campaign_id: string;
  recipient_id: string;
  user_agent?: string;
  ip_address?: string;
  opened_at: string;
}

export class AnalyticsService {
  // Get campaign analytics
  static async getCampaignAnalytics(campaignId: string): Promise<CampaignAnalytics | null> {
    try {
      const { data, error } = await supabase
        .rpc('get_campaign_analytics', { campaign_uuid: campaignId });

      if (error) {
        console.error('Error fetching campaign analytics:', error);
        return null;
      }

      return data?.[0] || null;
    } catch (error) {
      console.error('Error in getCampaignAnalytics:', error);
      return null;
    }
  }

  // Track email open
  static async trackEmailOpen(campaignId: string, recipientId: string, userAgent?: string, ipAddress?: string): Promise<void> {
    try {
      // Insert into email_opens table
      const { error: openError } = await supabase
        .from('email_opens')
        .insert({
          campaign_id: campaignId,
          recipient_id: recipientId,
          user_agent: userAgent,
          ip_address: ipAddress
        });

      if (openError) {
        console.error('Error tracking email open:', openError);
        return;
      }

      // Insert into email_events table
      const { error: eventError } = await supabase
        .from('email_events')
        .insert({
          campaign_id: campaignId,
          recipient_id: recipientId,
          event_type: 'opened',
          user_agent: userAgent,
          ip_address: ipAddress
        });

      if (eventError) {
        console.error('Error tracking email event:', eventError);
      }

      // Update campaign stats
      await this.updateCampaignStats(campaignId, 'opened');
    } catch (error) {
      console.error('Error in trackEmailOpen:', error);
    }
  }

  // Track email click
  static async trackEmailClick(
    campaignId: string, 
    recipientId: string, 
    originalUrl: string, 
    clickedUrl: string,
    userAgent?: string, 
    ipAddress?: string
  ): Promise<void> {
    try {
      // Insert into email_clicks table
      const { error: clickError } = await supabase
        .from('email_clicks')
        .insert({
          campaign_id: campaignId,
          recipient_id: recipientId,
          original_url: originalUrl,
          clicked_url: clickedUrl,
          user_agent: userAgent,
          ip_address: ipAddress
        });

      if (clickError) {
        console.error('Error tracking email click:', clickError);
        return;
      }

      // Insert into email_events table
      const { error: eventError } = await supabase
        .from('email_events')
        .insert({
          campaign_id: campaignId,
          recipient_id: recipientId,
          event_type: 'clicked',
          event_data: { original_url: originalUrl, clicked_url: clickedUrl },
          user_agent: userAgent,
          ip_address: ipAddress
        });

      if (eventError) {
        console.error('Error tracking email event:', eventError);
      }

      // Update campaign stats
      await this.updateCampaignStats(campaignId, 'clicked');
    } catch (error) {
      console.error('Error in trackEmailClick:', error);
    }
  }

  // Track email sent
  static async trackEmailSent(campaignId: string, recipientId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('email_events')
        .insert({
          campaign_id: campaignId,
          recipient_id: recipientId,
          event_type: 'sent'
        });

      if (error) {
        console.error('Error tracking email sent:', error);
      }
    } catch (error) {
      console.error('Error in trackEmailSent:', error);
    }
  }

  // Track email delivered
  static async trackEmailDelivered(campaignId: string, recipientId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('email_events')
        .insert({
          campaign_id: campaignId,
          recipient_id: recipientId,
          event_type: 'delivered'
        });

      if (error) {
        console.error('Error tracking email delivered:', error);
      }
    } catch (error) {
      console.error('Error in trackEmailDelivered:', error);
    }
  }

  // Track email bounced
  static async trackEmailBounced(campaignId: string, recipientId: string, reason?: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('email_events')
        .insert({
          campaign_id: campaignId,
          recipient_id: recipientId,
          event_type: 'bounced',
          event_data: { reason }
        });

      if (error) {
        console.error('Error tracking email bounced:', error);
        return;
      }

      // Update campaign stats
      await this.updateCampaignStats(campaignId, 'bounced');
    } catch (error) {
      console.error('Error in trackEmailBounced:', error);
    }
  }

  // Track unsubscribe
  static async trackUnsubscribe(campaignId: string, recipientId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('email_events')
        .insert({
          campaign_id: campaignId,
          recipient_id: recipientId,
          event_type: 'unsubscribed'
        });

      if (error) {
        console.error('Error tracking unsubscribe:', error);
        return;
      }

      // Update campaign stats
      await this.updateCampaignStats(campaignId, 'unsubscribed');
    } catch (error) {
      console.error('Error in trackUnsubscribe:', error);
    }
  }

  // Update campaign statistics
  private static async updateCampaignStats(campaignId: string, eventType: string): Promise<void> {
    try {
      // Get current campaign stats
      const { data: campaign } = await supabase
        .from('campaigns')
        .select('total_sent, total_delivered, total_opened, total_clicked, total_bounced, total_unsubscribed')
        .eq('id', campaignId)
        .single();

      if (!campaign) return;

      // Calculate new stats based on event type
      let updateData: any = {};
      
      switch (eventType) {
        case 'opened':
          updateData.total_opened = (campaign.total_opened || 0) + 1;
          break;
        case 'clicked':
          updateData.total_clicked = (campaign.total_clicked || 0) + 1;
          break;
        case 'bounced':
          updateData.total_bounced = (campaign.total_bounced || 0) + 1;
          break;
        case 'unsubscribed':
          updateData.total_unsubscribed = (campaign.total_unsubscribed || 0) + 1;
          break;
      }

      if (Object.keys(updateData).length > 0) {
        const { error } = await supabase
          .from('campaigns')
          .update(updateData)
          .eq('id', campaignId);

        if (error) {
          console.error('Error updating campaign stats:', error);
        }
      }
    } catch (error) {
      console.error('Error in updateCampaignStats:', error);
    }
  }

  // Get detailed click analytics
  static async getClickAnalytics(campaignId: string): Promise<EmailClick[]> {
    try {
      const { data, error } = await supabase
        .from('email_clicks')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching click analytics:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getClickAnalytics:', error);
      return [];
    }
  }

  // Get detailed open analytics
  static async getOpenAnalytics(campaignId: string): Promise<EmailOpen[]> {
    try {
      const { data, error } = await supabase
        .from('email_opens')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('opened_at', { ascending: false });

      if (error) {
        console.error('Error fetching open analytics:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getOpenAnalytics:', error);
      return [];
    }
  }

  // Get all events for a campaign
  static async getCampaignEvents(campaignId: string): Promise<EmailEvent[]> {
    try {
      const { data, error } = await supabase
        .from('email_events')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching campaign events:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getCampaignEvents:', error);
      return [];
    }
  }
}
