
# Email Analytics Implementation Guide

## 📊 Overview

This guide explains how to implement comprehensive email analytics in your MailMaster application, including open rate tracking, click rate tracking, and detailed analytics dashboard.

## 🎯 Features Implemented

### 1. **Open Rate Tracking**
- **Tracking Pixel**: 1x1 transparent image embedded in emails
- **Automatic Detection**: When recipient opens email, pixel loads and triggers tracking
- **Unique Tracking**: Tracks unique opens per recipient

### 2. **Click Rate Tracking**
- **Link Replacement**: All links in emails are replaced with tracking URLs
- **Redirect System**: Clicking tracked links redirects to original URL after logging
- **Detailed Analytics**: Tracks which links were clicked, when, and by whom

### 3. **Analytics Dashboard**
- **Real-time Metrics**: Open rates, click rates, bounce rates
- **Detailed Views**: Individual click and open tracking
- **Event Timeline**: Complete campaign event history

### 4. **Unsubscribe Management**
- **One-click Unsubscribe**: Automatic unsubscribe links in emails
- **Resubscribe Option**: Users can easily resubscribe
- **Status Tracking**: Contact status management

## 🗄️ Database Schema

### Analytics Tables Created

```sql
-- Email tracking events (general events table)
CREATE TABLE email_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL, -- sent, delivered, opened, clicked, bounced, unsubscribed
  event_data JSONB DEFAULT '{}',
  user_agent TEXT,
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Click tracking table (detailed click tracking)
CREATE TABLE email_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  original_url TEXT NOT NULL,
  clicked_url TEXT NOT NULL,
  user_agent TEXT,
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Open tracking table (detailed open tracking)
CREATE TABLE email_opens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  user_agent TEXT,
  ip_address INET,
  opened_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Analytics Function

```sql
-- Function to calculate campaign analytics
CREATE OR REPLACE FUNCTION get_campaign_analytics(campaign_uuid UUID)
RETURNS TABLE (
  total_sent INTEGER,
  total_delivered INTEGER,
  total_opened INTEGER,
  total_clicked INTEGER,
  total_bounced INTEGER,
  total_unsubscribed INTEGER,
  open_rate DECIMAL(5,2),
  click_rate DECIMAL(5,2),
  bounce_rate DECIMAL(5,2),
  unsubscribe_rate DECIMAL(5,2)
) AS $$
BEGIN
  RETURN QUERY
  WITH campaign_stats AS (
    SELECT 
      c.total_recipients,
      c.total_sent,
      c.total_delivered,
      c.total_opened,
      c.total_clicked,
      c.total_bounced,
      c.total_unsubscribed
    FROM campaigns c
    WHERE c.id = campaign_uuid
  )
  SELECT 
    cs.total_sent,
    cs.total_delivered,
    cs.total_opened,
    cs.total_clicked,
    cs.total_bounced,
    cs.total_unsubscribed,
    CASE 
      WHEN cs.total_delivered > 0 THEN 
        ROUND((cs.total_opened::DECIMAL / cs.total_delivered::DECIMAL) * 100, 2)
      ELSE 0 
    END as open_rate,
    CASE 
      WHEN cs.total_delivered > 0 THEN 
        ROUND((cs.total_clicked::DECIMAL / cs.total_delivered::DECIMAL) * 100, 2)
      ELSE 0 
    END as click_rate,
    CASE 
      WHEN cs.total_sent > 0 THEN 
        ROUND((cs.total_bounced::DECIMAL / cs.total_sent::DECIMAL) * 100, 2)
      ELSE 0 
    END as bounce_rate,
    CASE 
      WHEN cs.total_delivered > 0 THEN 
        ROUND((cs.total_unsubscribed::DECIMAL / cs.total_delivered::DECIMAL) * 100, 2)
      ELSE 0 
    END as unsubscribe_rate
  FROM campaign_stats cs;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## 🔧 Implementation Details

### 1. Analytics Service (`src/services/analyticsService.ts`)

**Key Methods:**
- `getCampaignAnalytics()` - Get overall campaign metrics
- `trackEmailOpen()` - Track email opens
- `trackEmailClick()` - Track link clicks
- `trackEmailSent()` - Track email sends
- `trackEmailDelivered()` - Track email deliveries
- `trackEmailBounced()` - Track bounces
- `trackUnsubscribe()` - Track unsubscribes

### 2. Email Tracking Utilities (`src/lib/emailTracking.ts`)

**Key Functions:**
- `addTrackingPixel()` - Add tracking pixel to email HTML
- `addLinkTracking()` - Replace links with tracking URLs
- `processCompleteEmail()` - Process email with all tracking elements
- `generateUnsubscribeLink()` - Create unsubscribe links

### 3. Tracking Pages

**TrackOpen.tsx** - Handles open tracking via pixel
**TrackClick.tsx** - Handles click tracking and redirects
**Unsubscribe.tsx** - Manages unsubscribe/resubscribe

### 4. Analytics Dashboard (`src/components/analytics/CampaignAnalytics.tsx`)

**Features:**
- Real-time metrics display
- Tabbed interface (Overview, Clicks, Opens, Events)
- Color-coded performance indicators
- Detailed event timeline

## 📧 Email Processing Flow

### 1. **Before Sending Email**

```typescript
import { processCompleteEmail, TrackingConfig } from '@/lib/emailTracking';

// Create tracking configuration
const trackingConfig: TrackingConfig = {
  campaignId: campaign.id,
  recipientId: contact.id,
  baseUrl: 'https://emails.tasknova.io' // Your domain
};

// Process email content
const processedHtml = processCompleteEmail(originalHtml, trackingConfig);
```

### 2. **What Gets Added to Email**

```html
<!-- Original email content -->
<div>Your email content here</div>
<a href="https://example.com">Click here</a>

<!-- After processing -->
<div>Your email content here</div>
<a href="https://emails.tasknova.io/track-click?c=campaignId&r=recipientId&url=https%3A//example.com">Click here</a>

<!-- Unsubscribe footer -->
<div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666;">
  <p>If you no longer wish to receive these emails, you can <a href="https://emails.tasknova.io/unsubscribe?c=campaignId&r=recipientId" style="color: #0066cc;">unsubscribe here</a>.</p>
</div>

<!-- Tracking pixel -->
<img src="https://emails.tasknova.io/track-open?c=campaignId&r=recipientId" width="1" height="1" style="display:none;" alt="" />
```

## 🚀 Integration Steps

### 1. **Update Campaign Sending Logic**

Modify your email sending function to include tracking:

```typescript
// In your campaign sending service
import { processCompleteEmail } from '@/lib/emailTracking';
import { AnalyticsService } from '@/services/analyticsService';

const sendCampaignEmail = async (campaign: Campaign, contact: Contact) => {
  // Process email with tracking
  const trackingConfig = {
    campaignId: campaign.id,
    recipientId: contact.id,
    baseUrl: window.location.origin
  };
  
  const processedHtml = processCompleteEmail(campaign.html_content, trackingConfig);
  
  // Send email with processed content
  await sendEmail({
    to: contact.email,
    subject: campaign.subject,
    html: processedHtml
  });
  
  // Track email sent
  await AnalyticsService.trackEmailSent(campaign.id, contact.id);
};
```

### 2. **Add Routes to App**

```typescript
// In your main App.tsx or router
import TrackOpen from '@/pages/TrackOpen';
import TrackClick from '@/pages/TrackClick';
import Unsubscribe from '@/pages/Unsubscribe';

// Add these routes
<Route path="/track-open" element={<TrackOpen />} />
<Route path="/track-click" element={<TrackClick />} />
<Route path="/unsubscribe" element={<Unsubscribe />} />
```

### 3. **Integrate Analytics Dashboard**

```typescript
// In your campaign details or dashboard
import CampaignAnalytics from '@/components/analytics/CampaignAnalytics';

// Use the component
<CampaignAnalytics 
  campaignId={campaign.id} 
  campaignName={campaign.name} 
/>
```

## 📊 Analytics Metrics Explained

### **Open Rate**
- **Formula**: (Opens ÷ Delivered) × 100
- **Industry Average**: 15-25%
- **Good Rate**: 20%+

### **Click Rate (CTR)**
- **Formula**: (Clicks ÷ Delivered) × 100
- **Industry Average**: 2-5%
- **Good Rate**: 3%+

### **Bounce Rate**
- **Formula**: (Bounces ÷ Sent) × 100
- **Industry Average**: 2-5%
- **Good Rate**: <2%

### **Unsubscribe Rate**
- **Formula**: (Unsubscribes ÷ Delivered) × 100
- **Industry Average**: 0.1-0.5%
- **Good Rate**: <0.2%

## 🔒 Privacy & Compliance

### **GDPR Compliance**
- Unsubscribe links in every email
- Clear privacy policy
- Data retention policies
- Right to be forgotten

### **CAN-SPAM Compliance**
- Clear sender identification
- Accurate subject lines
- Physical address in emails
- Easy unsubscribe mechanism

### **Data Protection**
- IP addresses stored for analytics
- User agent tracking for device info
- Secure data transmission
- Access controls via RLS

## 🧪 Testing

### **Testing Open Tracking**
1. Send test email to yourself
2. Open email in different clients
3. Check analytics dashboard
4. Verify pixel loads correctly

### **Testing Click Tracking**
1. Include links in test email
2. Click each link
3. Verify redirect to original URL
4. Check click analytics

### **Testing Unsubscribe**
1. Click unsubscribe link
2. Verify status changes to 'unsubscribed'
3. Test resubscribe functionality
4. Check unsubscribe analytics

## 🚨 Limitations & Considerations

### **Open Tracking Limitations**
- **Image Blocking**: Many email clients block images by default
- **Preview Panes**: Opens in preview panes may not trigger pixel
- **Mobile Apps**: Some mobile email apps don't load images
- **Privacy Settings**: Users with strict privacy settings

### **Click Tracking Limitations**
- **Link Blocking**: Some security software blocks tracking links
- **Copy/Paste**: Users copying links directly won't be tracked
- **Forwarding**: Forwarded emails may not maintain tracking

### **Accuracy Considerations**
- **Multiple Opens**: Same user opening multiple times
- **Shared Devices**: Multiple users on same device
- **Bot Activity**: Automated email scanning
- **Caching**: Email client caching

## 🔧 Advanced Features

### **Future Enhancements**
1. **Geographic Tracking**: IP-based location tracking
2. **Device Analytics**: Mobile vs desktop opens
3. **Time-based Analytics**: Best sending times
4. **A/B Testing**: Subject line and content testing
5. **Automation**: Triggered email sequences
6. **Segmentation**: Behavioral segmentation
7. **Real-time Alerts**: Performance notifications

### **Performance Optimization**
1. **Database Indexing**: Optimize query performance
2. **Caching**: Cache analytics data
3. **Batch Processing**: Process events in batches
4. **Data Archiving**: Archive old analytics data

## 📈 Best Practices

### **Email Design**
- Use clear, compelling subject lines
- Include relevant links for tracking
- Optimize for mobile devices
- Test across email clients

### **Analytics Usage**
- Monitor metrics regularly
- Set up performance alerts
- Clean email lists regularly
- Segment based on engagement

### **Compliance**
- Include unsubscribe in every email
- Respect unsubscribe requests immediately
- Maintain clear privacy policies
- Regular compliance audits

## 🎯 Success Metrics

### **Key Performance Indicators**
- **Open Rate**: Target 20%+
- **Click Rate**: Target 3%+
- **Bounce Rate**: Keep under 2%
- **Unsubscribe Rate**: Keep under 0.2%
- **List Growth**: Maintain positive growth
- **Engagement Score**: Track overall engagement

### **ROI Measurement**
- **Cost per Email**: Track sending costs
- **Revenue per Email**: Track conversions
- **Customer Lifetime Value**: Track long-term value
- **Campaign ROI**: Overall campaign performance

This comprehensive analytics system will provide you with detailed insights into your email campaign performance, helping you optimize your email marketing strategy and improve engagement rates.
