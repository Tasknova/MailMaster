# Gmail API Setup Guide

This guide will help you set up Gmail API integration to send emails through your Gmail account.

## Prerequisites

- A Google account
- Access to Google Cloud Console

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" at the top
3. Click "New Project"
4. Enter a project name (e.g., "MailMaster Email Service")
5. Click "Create"

## Step 2: Enable Gmail API

1. In your new project, go to "APIs & Services" > "Library"
2. Search for "Gmail API"
3. Click on "Gmail API"
4. Click "Enable"

## Step 3: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. If prompted, configure the OAuth consent screen:
   - User Type: External
   - App name: MailMaster
   - User support email: Your email
   - Developer contact information: Your email
   - Save and continue through the rest (you can skip optional fields)

4. Create OAuth 2.0 Client ID:
   - Application type: Web application
   - Name: MailMaster Web Client
   - Authorized redirect URIs: `http://localhost:5173/auth/callback`
   - Click "Create"

5. **Important**: Copy the Client ID and Client Secret - you'll need these!

## Step 4: Configure MailMaster

1. Open MailMaster application
2. Go to Settings > Integrations
3. Click "Configure" next to Gmail API
4. Enter your credentials:
   - **Client ID**: The Client ID from step 3
   - **Client Secret**: The Client Secret from step 3
   - **Redirect URI**: `http://localhost:5173/auth/callback`
5. Click "Save Settings"

## Step 5: Authenticate with Gmail

1. Click "Authenticate with Gmail"
2. A popup will open with Google's OAuth consent screen
3. Sign in with your Google account
4. Grant permission to send emails on your behalf
5. The popup will close automatically when authentication is complete

## Step 6: Test the Integration

1. Click "Test Connection" to send a test email
2. Check your email to confirm the test was successful

## Troubleshooting

### "Invalid redirect URI" error
- Make sure the redirect URI in Google Cloud Console exactly matches: `http://localhost:5173/auth/callback`
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

## Production Deployment

For production use:

1. Update the redirect URI to your production domain
2. Verify your app with Google (required for external users)
3. Set up proper environment variables for credentials
4. Consider using a service account for server-to-server communication

## API Limits

- Gmail API has a daily sending quota (typically 1000 emails/day for regular accounts)
- Check your quota in Google Cloud Console > APIs & Services > Quotas

## Support

If you encounter issues:
1. Check the browser console for error messages
2. Verify your Google Cloud Console settings
3. Ensure your Gmail account has API access enabled
4. Check that you're not hitting API limits

---

**Note**: This setup allows MailMaster to send emails through your Gmail account. The emails will appear as sent from your Gmail address and will be stored in your Gmail Sent folder. 