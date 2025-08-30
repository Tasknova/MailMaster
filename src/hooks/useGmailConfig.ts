import { useState, useEffect, useCallback } from 'react';
import GmailConfigService, { GmailStatus } from '@/services/gmailConfigService';
import { toast } from '@/hooks/use-toast';

interface UseGmailConfigReturn {
  status: GmailStatus;
  loading: boolean;
  error: string | null;
  refreshStatus: () => Promise<void>;
  toggleEnabled: (enabled: boolean) => Promise<void>;
  disconnect: () => Promise<void>;
  reconnect: () => Promise<void>;
}

export const useGmailConfig = (): UseGmailConfigReturn => {
  const [status, setStatus] = useState<GmailStatus>({
    isConfigured: false,
    isEnabled: false,
    isAuthenticated: false,
    needsReauth: false
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshStatus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const newStatus = await GmailConfigService.getStatus();
      setStatus(newStatus);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get Gmail status';
      setError(errorMessage);
      console.error('Error refreshing Gmail status:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleEnabled = useCallback(async (enabled: boolean) => {
    try {
      setLoading(true);
      setError(null);
      
      await GmailConfigService.toggleEnabled(enabled);
      
      toast({
        title: enabled ? "Gmail Enabled" : "Gmail Disabled",
        description: enabled 
          ? "Gmail is now enabled for sending emails" 
          : "Gmail is now disabled and won't send emails",
      });
      
      await refreshStatus();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to toggle Gmail status';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [refreshStatus]);

  const disconnect = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      await GmailConfigService.disconnect();
      
      toast({
        title: "Gmail Disconnected",
        description: "Gmail has been disconnected. You can reconnect anytime.",
      });
      
      await refreshStatus();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to disconnect Gmail';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [refreshStatus]);

  const reconnect = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // This will trigger the Gmail OAuth flow
      const { configureGmail } = await import('@/hooks/useAuth');
      const { error } = await configureGmail();
      
      if (error) {
        throw new Error(error.message);
      }
      
      toast({
        title: "Gmail Reconnected",
        description: "Gmail has been successfully reconnected!",
      });
      
      await refreshStatus();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reconnect Gmail';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [refreshStatus]);

  // Load initial status
  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  return {
    status,
    loading,
    error,
    refreshStatus,
    toggleEnabled,
    disconnect,
    reconnect
  };
};
