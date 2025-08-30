# Email Analytics Troubleshooting Guide

## 🔍 **Why Analytics Aren't Working**

Based on your current setup, here are the main issues and solutions:

### **Issue 1: Emails Not Being Processed with Tracking**
**Problem**: Emails are sent without tracking pixels and link tracking
**Solution**: ✅ **FIXED** - Updated CampaignBuilder to use `processCompleteEmail()`

### **Issue 2: No Delivery Tracking**
**Problem**: Emails marked as "sent" but not "delivered"
**Solution**: ✅ **FIXED** - Added `trackEmailDelivered()` calls

### **Issue 3: Missing Analytics Integration**
**Problem**: Email sending doesn't call analytics service
**Solution**: ✅ **FIXED** - Integrated AnalyticsService into email sending

## 📊 **How Analytics Work Now**

### **1. Email Processing Flow**
```typescript
// 1. Original email HTML
const originalHtml = "<p>Hello {{name}}!</p><a href='https://example.com'>Click here</a>";

// 2. Process with tracking
const trackingConfig = {
  campaignId: campaign.id,
  recipientId: contact.id,
  baseUrl: window.location.origin
};

const processedHtml = processCompleteEmail(originalHtml, trackingConfig);

// 3. Result: Email with tracking
// <p>Hello John!</p>
// <a href='https://emails.tasknova.io/track-click?c=campaignId&r=recipientId&url=https%3A//example.com'>Click here</a>
// <div>Unsubscribe footer...</div>
// <img src='https://emails.tasknova.io/track-open?c=campaignId&r=recipientId' width='1' height='1' />
```

### **2. Tracking Events**
- **Email Sent**: When email is queued for sending
- **Email Delivered**: When Gmail successfully delivers email
- **Email Opened**: When tracking pixel loads (recipient opens email)
- **Email Clicked**: When recipient clicks tracked link
- **Email Bounced**: When Gmail returns bounce notification
- **Unsubscribed**: When recipient clicks unsubscribe link

### **3. Analytics Calculation**
```sql
-- Open Rate = (Opens ÷ Delivered) × 100
-- Click Rate = (Clicks ÷ Delivered) × 100
-- Bounce Rate = (Bounces ÷ Sent) × 100
-- Unsubscribe Rate = (Unsubscribes ÷ Delivered) × 100
```

## 🧪 **Testing the Analytics System**

### **Step 1: Send a Test Campaign**
1. Create a new campaign with a simple template
2. Add a contact list with your own email
3. Include a link in the email content
4. Send the campaign

### **Step 2: Check Database**
```sql
-- Check campaign stats
SELECT name, total_sent, total_delivered, total_opened, total_clicked 
FROM campaigns 
WHERE name = 'Your Test Campaign';

-- Check email events
SELECT event_type, COUNT(*) 
FROM email_events 
WHERE campaign_id = 'your-campaign-id' 
GROUP BY event_type;

-- Check email opens
SELECT * FROM email_opens WHERE campaign_id = 'your-campaign-id';

-- Check email clicks
SELECT * FROM email_clicks WHERE campaign_id = 'your-campaign-id';
```

### **Step 3: Test Open Tracking**
1. Open the email you received
2. Check if images are enabled (required for tracking pixel)
3. Check database for open event:
```sql
SELECT * FROM email_opens WHERE campaign_id = 'your-campaign-id';
```

### **Step 4: Test Click Tracking**
1. Click any link in the email
2. You should be redirected to the original URL
3. Check database for click event:
```sql
SELECT * FROM email_clicks WHERE campaign_id = 'your-campaign-id';
```

### **Step 5: Test Analytics Dashboard**
1. Go to campaign details
2. Look for analytics section
3. Check if metrics are displayed correctly

## 🚨 **Common Issues & Solutions**

### **Issue: No Opens Being Tracked**
**Causes:**
- Email client blocks images by default
- Tracking pixel URL is incorrect
- Network issues preventing pixel load

**Solutions:**
1. **Enable images** in your email client
2. **Check tracking URL** in email source
3. **Test pixel URL** directly in browser
4. **Check console logs** for tracking errors

### **Issue: No Clicks Being Tracked**
**Causes:**
- Links not being replaced with tracking URLs
- Redirect not working properly
- Network issues

**Solutions:**
1. **Check email source** for tracking URLs
2. **Test tracking URL** directly in browser
3. **Check console logs** for redirect errors
4. **Verify original URL** is properly encoded

### **Issue: Analytics Dashboard Shows Zero**
**Causes:**
- No tracking events recorded
- Analytics function not working
- Database permissions issues

**Solutions:**
1. **Check database tables** for events
2. **Test analytics function** directly:
```sql
SELECT * FROM get_campaign_analytics('your-campaign-id');
```
3. **Check RLS policies** for analytics tables
4. **Verify user permissions**

## 🔧 **Debugging Steps**

### **1. Check Email Source**
1. Open email in your email client
2. View email source (usually Ctrl+U or right-click → View Source)
3. Look for:
   - Tracking pixel: `<img src="https://emails.tasknova.io/track-open?..."`
   - Tracking links: `href="https://emails.tasknova.io/track-click?..."`
   - Unsubscribe link: `href="https://emails.tasknova.io/unsubscribe?..."`

### **2. Test Tracking URLs**
1. Copy tracking pixel URL from email source
2. Open in browser
3. Should see a 1x1 transparent pixel
4. Check browser console for any errors

### **3. Check Database Events**
```sql
-- Check all events for a campaign
SELECT 
  e.event_type,
  e.created_at,
  c.email as recipient_email
FROM email_events e
JOIN contacts c ON e.recipient_id = c.id
WHERE e.campaign_id = 'your-campaign-id'
ORDER BY e.created_at DESC;

-- Check specific event types
SELECT COUNT(*) as event_count, event_type 
FROM email_events 
WHERE campaign_id = 'your-campaign-id' 
GROUP BY event_type;
```

### **4. Test Analytics Function**
```sql
-- Test the analytics calculation function
SELECT * FROM get_campaign_analytics('your-campaign-id');
```

### **5. Check Console Logs**
1. Open browser developer tools
2. Go to Console tab
3. Look for:
   - "Email open tracked successfully"
   - "Email click tracked successfully"
   - Any error messages

## 📈 **Expected Results**

### **After Sending Campaign:**
- `total_sent` = number of emails sent
- `total_delivered` = number of emails delivered (should equal sent if no bounces)
- `email_events` table should have "sent" and "delivered" events

### **After Opening Email:**
- `total_opened` should increase
- `email_opens` table should have new record
- `email_events` table should have "opened" event

### **After Clicking Link:**
- `total_clicked` should increase
- `email_clicks` table should have new record
- `email_events` table should have "clicked" event

### **Analytics Dashboard:**
- Should show real-time metrics
- Open rate = (opens ÷ delivered) × 100
- Click rate = (clicks ÷ delivered) × 100

## 🎯 **Success Criteria**

✅ **Analytics Working When:**
- Emails are processed with tracking elements
- Tracking events are recorded in database
- Analytics dashboard shows correct metrics
- Real-time updates work
- Open and click tracking function properly

❌ **Analytics Not Working When:**
- No tracking elements in emails
- No events recorded in database
- Dashboard shows zero or incorrect metrics
- Tracking URLs don't work
- Console shows errors

## 🔄 **Next Steps**

1. **Deploy the updated code** with analytics integration
2. **Send a test campaign** to yourself
3. **Check email source** for tracking elements
4. **Test open and click tracking**
5. **Verify analytics dashboard** shows correct data
6. **Monitor real-time updates**

The analytics system should now work properly with the fixes implemented!
