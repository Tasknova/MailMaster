import { supabase } from '@/integrations/supabase/client';
import { AnalyticsService, CampaignAnalytics, EmailClick, EmailOpen } from './analyticsService';

export interface RealtimeAnalyticsData {
  analytics: CampaignAnalytics | null;
  clicks: EmailClick[];
  opens: EmailOpen[];
  lastUpdated: Date;
}

export class RealtimeAnalyticsService {
  private static subscriptions: Map<string, any> = new Map();
  private static listeners: Map<string, Set<(data: RealtimeAnalyticsData) => void>> = new Map();

  /**
   * Subscribe to real-time analytics for a campaign
   */
  static subscribeToCampaignAnalytics(
    campaignId: string,
    callback: (data: RealtimeAnalyticsData) => void
  ): () => void {
    // Add callback to listeners
    if (!this.listeners.has(campaignId)) {
      this.listeners.set(campaignId, new Set());
    }
    this.listeners.get(campaignId)!.add(callback);

    // Initial data fetch
    this.fetchInitialData(campaignId);

    // Set up real-time subscriptions
    this.setupRealtimeSubscriptions(campaignId);

    // Return unsubscribe function
    return () => {
      this.unsubscribeFromCampaign(campaignId, callback);
    };
  }

  /**
   * Fetch initial data for a campaign
   */
  private static async fetchInitialData(campaignId: string) {
    try {
      const [analytics, clicks, opens] = await Promise.all([
        AnalyticsService.getCampaignAnalytics(campaignId),
        AnalyticsService.getClickAnalytics(campaignId),
        AnalyticsService.getOpenAnalytics(campaignId)
      ]);

      const data: RealtimeAnalyticsData = {
        analytics,
        clicks,
        opens,
        lastUpdated: new Date()
      };

      this.notifyListeners(campaignId, data);
    } catch (error) {
      console.error('Error fetching initial analytics data:', error);
    }
  }

  /**
   * Set up real-time subscriptions for all analytics tables
   */
  private static setupRealtimeSubscriptions(campaignId: string) {
    // Subscribe to email_events table
    const eventsSubscription = supabase
      .channel(`analytics-events-${campaignId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'email_events',
          filter: `campaign_id=eq.${campaignId}`
        },
        () => {
          this.handleDataChange(campaignId);
        }
      )
      .subscribe();

    // Subscribe to email_clicks table
    const clicksSubscription = supabase
      .channel(`analytics-clicks-${campaignId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'email_clicks',
          filter: `campaign_id=eq.${campaignId}`
        },
        () => {
          this.handleDataChange(campaignId);
        }
      )
      .subscribe();

    // Subscribe to email_opens table
    const opensSubscription = supabase
      .channel(`analytics-opens-${campaignId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'email_opens',
          filter: `campaign_id=eq.${campaignId}`
        },
        () => {
          this.handleDataChange(campaignId);
        }
      )
      .subscribe();

    // Subscribe to campaigns table for stats updates
    const campaignSubscription = supabase
      .channel(`analytics-campaign-${campaignId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'campaigns',
          filter: `id=eq.${campaignId}`
        },
        () => {
          this.handleDataChange(campaignId);
        }
      )
      .subscribe();

    // Store subscriptions for cleanup
    this.subscriptions.set(campaignId, {
      events: eventsSubscription,
      clicks: clicksSubscription,
      opens: opensSubscription,
      campaign: campaignSubscription
    });
  }

  /**
   * Handle data changes and refresh analytics
   */
  private static async handleDataChange(campaignId: string) {
    try {
      // Debounce rapid updates
      if (this.debounceTimers.has(campaignId)) {
        clearTimeout(this.debounceTimers.get(campaignId));
      }

      this.debounceTimers.set(
        campaignId,
        setTimeout(async () => {
          await this.fetchInitialData(campaignId);
        }, 500) // 500ms debounce
      );
    } catch (error) {
      console.error('Error handling analytics data change:', error);
    }
  }

  private static debounceTimers: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Notify all listeners for a campaign
   */
  private static notifyListeners(campaignId: string, data: RealtimeAnalyticsData) {
    const listeners = this.listeners.get(campaignId);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in analytics callback:', error);
        }
      });
    }
  }

  /**
   * Unsubscribe from campaign analytics
   */
  private static unsubscribeFromCampaign(campaignId: string, callback: (data: RealtimeAnalyticsData) => void) {
    // Remove callback from listeners
    const listeners = this.listeners.get(campaignId);
    if (listeners) {
      listeners.delete(callback);
      
      // If no more listeners, clean up subscriptions
      if (listeners.size === 0) {
        this.cleanupSubscriptions(campaignId);
        this.listeners.delete(campaignId);
      }
    }
  }

  /**
   * Clean up all subscriptions for a campaign
   */
  private static cleanupSubscriptions(campaignId: string) {
    const subscriptions = this.subscriptions.get(campaignId);
    if (subscriptions) {
      Object.values(subscriptions).forEach((subscription: any) => {
        if (subscription && typeof subscription.unsubscribe === 'function') {
          subscription.unsubscribe();
        }
      });
      this.subscriptions.delete(campaignId);
    }

    // Clear debounce timer
    if (this.debounceTimers.has(campaignId)) {
      clearTimeout(this.debounceTimers.get(campaignId));
      this.debounceTimers.delete(campaignId);
    }
  }

  /**
   * Get real-time analytics with polling fallback
   */
  static async getRealtimeAnalytics(
    campaignId: string,
    pollingInterval: number = 5000
  ): Promise<{
    data: RealtimeAnalyticsData;
    startPolling: () => void;
    stopPolling: () => void;
  }> {
    let pollingTimer: NodeJS.Timeout | null = null;
    let currentData: RealtimeAnalyticsData | null = null;

    const fetchData = async () => {
      try {
        const [analytics, clicks, opens] = await Promise.all([
          AnalyticsService.getCampaignAnalytics(campaignId),
          AnalyticsService.getClickAnalytics(campaignId),
          AnalyticsService.getOpenAnalytics(campaignId)
        ]);

        currentData = {
          analytics,
          clicks,
          opens,
          lastUpdated: new Date()
        };
      } catch (error) {
        console.error('Error fetching analytics data:', error);
      }
    };

    const startPolling = () => {
      if (pollingTimer) return;
      
      // Initial fetch
      fetchData();
      
      // Set up polling
      pollingTimer = setInterval(fetchData, pollingInterval);
    };

    const stopPolling = () => {
      if (pollingTimer) {
        clearInterval(pollingTimer);
        pollingTimer = null;
      }
    };

    // Initial fetch
    await fetchData();

    return {
      data: currentData!,
      startPolling,
      stopPolling
    };
  }

  /**
   * Clean up all subscriptions (call this when app unmounts)
   */
  static cleanup() {
    this.subscriptions.forEach((_, campaignId) => {
      this.cleanupSubscriptions(campaignId);
    });
    this.subscriptions.clear();
    this.listeners.clear();
    this.debounceTimers.forEach(timer => clearTimeout(timer));
    this.debounceTimers.clear();
  }
}
