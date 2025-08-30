import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AnalyticsService } from '@/services/analyticsService';

const TrackOpen: React.FC = () => {
  const [searchParams] = useSearchParams();
  
  useEffect(() => {
    const trackOpen = async () => {
      const campaignId = searchParams.get('c');
      const recipientId = searchParams.get('r');
      
      if (campaignId && recipientId) {
        try {
          // Get user agent and IP (if available)
          const userAgent = navigator.userAgent;
          // Note: IP address would need to be passed from server-side
          
          await AnalyticsService.trackEmailOpen(campaignId, recipientId, userAgent);
          console.log('Email open tracked successfully');
        } catch (error) {
          console.error('Error tracking email open:', error);
        }
      }
    };

    trackOpen();
  }, [searchParams]);

  // Return a 1x1 transparent pixel
  return (
    <div style={{ width: '1px', height: '1px', backgroundColor: 'transparent' }}>
      {/* This div serves as the tracking pixel */}
    </div>
  );
};

export default TrackOpen;
