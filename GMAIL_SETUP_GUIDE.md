# Gmail API Setup Guide

## Current Issue
The "Gmail API not authenticated" error occurs because no Gmail API credentials have been saved to the database, and the OAuth flow hasn't been completed to grant Gmail sending permissions.

## Quick Fix (Temporary)
I've temporarily bypassed the Gmail authentication check so you can test the campaign functionality. The app will now simulate email sending without actually sending emails.

## Permanent Solution

### Step 1: Set up Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Gmail API:
   - Go to "APIs & Services" → "Library"
   - Search for "Gmail API"
   - Click on it and press "Enable"
4. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth 2.0 Client IDs"
   - Choose "Web application"
   - Add these redirect URIs:
     - `http://localhost:5173/gmail-callback` (for development)
     - `https://yourdomain.com/gmail-callback` (for production)
   - Copy your Client ID and Client Secret

### Step 2: Add Credentials to Database

Run this SQL query in your Supabase dashboard:

```sql
INSERT INTO gmail_credentials (user_id, client_id, client_secret, is_active)
SELECT 
  u.id,
  'YOUR_GOOGLE_CLIENT_ID', -- Replace with your actual Client ID
  'YOUR_GOOGLE_CLIENT_SECRET', -- Replace with your actual Client Secret
  true
FROM auth.users u
WHERE u.email = 'rajpalrathore4455@gmail.com'
AND NOT EXISTS (
  SELECT 1 FROM gmail_credentials gc 
  WHERE gc.user_id = u.id AND gc.is_active = true
);
```

### Step 3: Complete Gmail OAuth Flow

1. Go to your app's Settings page
2. Click on "Gmail Settings"
3. Click "Authenticate with Gmail"
4. You'll be redirected to Google to grant Gmail permissions
5. After granting permissions, you'll be redirected back and tokens will be saved

### Step 4: Remove Temporary Bypass

Once Gmail OAuth is working, remove the temporary bypass by:

1. Going to `src/components/campaigns/CampaignBuilder.tsx`
2. Finding the commented authentication check (around line 280)
3. Uncommenting the authentication check and removing the bypass

### Step 5: Test the Integration

1. Go to Gmail Settings in your app
2. Click "Test Connection" to send a test email
3. If successful, you can now send real campaigns

## Troubleshooting

### "Invalid redirect URI" error
- Make sure the redirect URI in Google Cloud Console exactly matches: `http://localhost:5173/gmail-callback`
- Check for extra spaces or typos

### "Access blocked" error
- Make sure your app is not in testing mode, or add your email as a test user
- For production use, you'll need to verify your app with Google

### "Quota exceeded" error
- Gmail API has daily sending limits
- Check your Google Cloud Console quotas

### Authentication popup doesn't work
- Make sure popup blockers are disabled
- Try refreshing the page and trying again

## Security Notes

- Never share your Client Secret publicly
- Store credentials securely
- Consider using environment variables for production

## API Limits

- Gmail API has a daily sending quota (typically 1000 emails/day for regular accounts)
- Check your quota in Google Cloud Console > APIs & Services > Quotas

## Support

If you encounter issues:
1. Check the browser console for error messages
2. Verify your Google Cloud Console settings
3. Ensure your Gmail account has API access enabled
4. Check that you're not hitting API limits 