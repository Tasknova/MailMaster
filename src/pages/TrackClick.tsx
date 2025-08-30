import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { AnalyticsService } from '@/services/analyticsService';

const TrackClick: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  useEffect(() => {
    const trackClick = async () => {
      const campaignId = searchParams.get('c');
      const recipientId = searchParams.get('r');
      const originalUrl = searchParams.get('url');
      
      if (campaignId && recipientId && originalUrl) {
        try {
          // Get user agent and IP (if available)
          const userAgent = navigator.userAgent;
          const clickedUrl = window.location.href;
          
          await AnalyticsService.trackEmailClick(
            campaignId, 
            recipientId, 
            originalUrl, 
            clickedUrl,
            userAgent
          );
          
          console.log('Email click tracked successfully');
          
          // Redirect to the original URL
          window.location.href = decodeURIComponent(originalUrl);
        } catch (error) {
          console.error('Error tracking email click:', error);
          // Still redirect even if tracking fails
          window.location.href = decodeURIComponent(originalUrl);
        }
      } else {
        // If parameters are missing, show an error or redirect to home
        console.error('Missing tracking parameters');
        navigate('/');
      }
    };

    trackClick();
  }, [searchParams, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Redirecting...</p>
      </div>
    </div>
  );
};

export default TrackClick;
