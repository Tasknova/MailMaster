import { useState, useEffect, useCallback } from 'react';
import { RealtimeAnalyticsService, RealtimeAnalyticsData } from '@/services/realtimeAnalyticsService';

interface UseRealtimeAnalyticsOptions {
  enabled?: boolean;
  pollingInterval?: number;
  fallbackToPolling?: boolean;
}

interface UseRealtimeAnalyticsReturn {
  data: RealtimeAnalyticsData | null;
  loading: boolean;
  error: string | null;
  isRealtime: boolean;
  lastUpdated: Date | null;
  refresh: () => void;
  toggleRealtime: () => void;
}

export const useRealtimeAnalytics = (
  campaignId: string,
  options: UseRealtimeAnalyticsOptions = {}
): UseRealtimeAnalyticsReturn => {
  const {
    enabled = true,
    pollingInterval = 5000,
    fallbackToPolling = true
  } = options;

  const [data, setData] = useState<RealtimeAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRealtime, setIsRealtime] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const { data: analyticsData } = await RealtimeAnalyticsService.getRealtimeAnalytics(
        campaignId,
        pollingInterval
      );
      
      setData(analyticsData);
      setLastUpdated(analyticsData.lastUpdated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  }, [campaignId, enabled, pollingInterval]);

  const toggleRealtime = useCallback(() => {
    setIsRealtime(!isRealtime);
  }, [isRealtime]);

  useEffect(() => {
    if (!enabled || !campaignId) {
      setLoading(false);
      return;
    }

    let unsubscribe: (() => void) | null = null;
    let pollingTimer: NodeJS.Timeout | null = null;

    const setupAnalytics = async () => {
      try {
        setLoading(true);
        setError(null);

        if (isRealtime) {
          // Set up real-time subscriptions
          unsubscribe = RealtimeAnalyticsService.subscribeToCampaignAnalytics(
            campaignId,
            (analyticsData: RealtimeAnalyticsData) => {
              setData(analyticsData);
              setLastUpdated(analyticsData.lastUpdated);
              setLoading(false);
              setError(null);
            }
          );
        } else if (fallbackToPolling) {
          // Set up polling as fallback
          const { startPolling, stopPolling } = await RealtimeAnalyticsService.getRealtimeAnalytics(
            campaignId,
            pollingInterval
          );
          
          startPolling();
          
          // Store stop function for cleanup
          unsubscribe = () => {
            stopPolling();
          };
        }
      } catch (err) {
        console.error('Error setting up analytics:', err);
        setError(err instanceof Error ? err.message : 'Failed to set up analytics');
        
        if (fallbackToPolling) {
          // Fallback to manual refresh
          setIsRealtime(false);
          await refresh();
        } else {
          setLoading(false);
        }
      }
    };

    setupAnalytics();

    // Cleanup function
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
      if (pollingTimer) {
        clearTimeout(pollingTimer);
      }
    };
  }, [campaignId, enabled, isRealtime, fallbackToPolling, pollingInterval, refresh]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // This will be handled by the main effect cleanup
    };
  }, []);

  return {
    data,
    loading,
    error,
    isRealtime,
    lastUpdated,
    refresh,
    toggleRealtime
  };
};

// Hook for multiple campaigns
export const useMultipleCampaignAnalytics = (
  campaignIds: string[],
  options: UseRealtimeAnalyticsOptions = {}
) => {
  const [analyticsMap, setAnalyticsMap] = useState<Map<string, RealtimeAnalyticsData>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!options.enabled || campaignIds.length === 0) {
      setLoading(false);
      return;
    }

    const unsubscribes: (() => void)[] = [];

    const setupMultipleAnalytics = async () => {
      try {
        setLoading(true);
        setError(null);

        const promises = campaignIds.map(async (campaignId) => {
          const unsubscribe = RealtimeAnalyticsService.subscribeToCampaignAnalytics(
            campaignId,
            (data: RealtimeAnalyticsData) => {
              setAnalyticsMap(prev => new Map(prev.set(campaignId, data)));
            }
          );
          
          unsubscribes.push(unsubscribe);
        });

        await Promise.all(promises);
        setLoading(false);
      } catch (err) {
        console.error('Error setting up multiple analytics:', err);
        setError(err instanceof Error ? err.message : 'Failed to set up analytics');
        setLoading(false);
      }
    };

    setupMultipleAnalytics();

    // Cleanup
    return () => {
      unsubscribes.forEach(unsubscribe => unsubscribe());
    };
  }, [campaignIds, options.enabled]);

  return {
    analyticsMap,
    loading,
    error,
    getAnalytics: (campaignId: string) => analyticsMap.get(campaignId) || null
  };
};
