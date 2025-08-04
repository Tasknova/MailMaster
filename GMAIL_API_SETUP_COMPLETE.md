# Complete Gmail API Setup Guide

## 🎯 **Overview**
This guide will help you set up Gmail API integration for MailMaster. The system now uses a database to store credentials securely and handles OAuth flow properly.

## 📋 **Prerequisites**
- Google Cloud Console account
- Gmail account
- MailMaster application running

## 🔧 **Step 1: Create Database Table**

First, run this SQL in your Supabase dashboard:

```sql
-- Create table for Gmail API credentials
CREATE TABLE IF NOT EXISTS gmail_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id TEXT NOT NULL,
  client_secret TEXT NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE gmail_credentials ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own Gmail credentials" ON gmail_credentials
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own Gmail credentials" ON gmail_credentials
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own Gmail credentials" ON gmail_credentials
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own Gmail credentials" ON gmail_credentials
  FOR DELETE USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_gmail_credentials_updated_at 
  BEFORE UPDATE ON gmail_credentials 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
```

## 🌐 **Step 2: Google Cloud Console Setup**

### 2.1 Create/Select Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Make sure billing is enabled (required for API usage)

### 2.2 Enable Gmail API
1. Navigate to "APIs & Services" > "Library"
2. Search for "Gmail API"
3. Click on "Gmail API" and click "Enable"

### 2.3 Configure OAuth Consent Screen
1. Go to "APIs & Services" > "OAuth consent screen"
2. Choose "External" user type
3. Fill in required information:
   - App name: "MailMaster"
   - User support email: Your email
   - Developer contact information: Your email
4. Add scopes:
   - `https://www.googleapis.com/auth/gmail.send`
5. Add test users (your Gmail address)
6. Save and continue

### 2.4 Create OAuth 2.0 Credentials
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Choose "Web application"
4. Set the following:
   - **Name**: "MailMaster Gmail API"
   - **Authorized redirect URIs**: 
     - For development: `http://localhost:8080/gmail-callback`
     - For production: `https://yourdomain.com/gmail-callback`
5. Click "Create"
6. **Save the Client ID and Client Secret** - you'll need these!

## ⚙️ **Step 3: Configure MailMaster**

### 3.1 Access Gmail Settings
1. Log into MailMaster
2. Go to Settings > Integrations
3. Click "Configure" next to Gmail API

### 3.2 Enter Credentials
1. Copy the callback URL shown in the settings
2. Go back to Google Cloud Console and add this exact URL to your OAuth 2.0 Client ID
3. Enter your Client ID and Client Secret in MailMaster
4. Click "Save Settings"

### 3.3 Authenticate
1. Click "Authenticate with Gmail"
2. You'll be redirected to Google's OAuth consent screen
3. Grant permission to send emails
4. You'll be redirected back to MailMaster
5. The authentication status should show "Authenticated"

## 🧪 **Step 4: Test the Integration**

1. In the Gmail settings, click "Test Connection"
2. This will send a test email to your Gmail address
3. Check your email - you should receive a test message
4. If successful, you'll see a success notification

## 📧 **Step 5: Send Campaigns**

Once authenticated, you can:
1. Create email campaigns
2. Select your Gmail account as the sender
3. Send campaigns through Gmail API
4. Monitor delivery and engagement

## 🔒 **Security Features**

- **Database Storage**: Credentials stored securely in Supabase
- **Row Level Security**: Users can only access their own credentials
- **Token Management**: Automatic token refresh and expiration handling
- **CSRF Protection**: State parameter prevents cross-site request forgery
- **Secure OAuth Flow**: Proper redirect handling and error management

## 🚨 **Troubleshooting**

### Common Issues:

**"Invalid redirect URI"**
- Make sure the callback URL in Google Cloud Console matches exactly
- Check for trailing slashes or typos

**"Authentication failed"**
- Verify Client ID and Client Secret are correct
- Check that Gmail API is enabled
- Ensure OAuth consent screen is configured

**"No access token available"**
- Try logging out and re-authenticating
- Check if tokens have expired

**"Failed to send email"**
- Verify you're authenticated
- Check Gmail API quotas
- Ensure the sender email is verified

### Debug Steps:
1. Check browser console for errors
2. Verify database table exists and has RLS policies
3. Confirm OAuth consent screen has correct scopes
4. Test with a simple email first

## 📊 **API Quotas**

Gmail API has the following limits:
- **Per user per day**: 1,000,000,000 quota units
- **Per user per 100 seconds**: 250 quota units
- **Per user per 100 seconds per user**: 420 quota units

Sending an email typically costs 100 quota units.

## 🚀 **Production Deployment**

For production:
1. Update callback URL to your production domain
2. Configure OAuth consent screen for production
3. Remove test users and publish the app
4. Set up proper error monitoring
5. Configure email sending limits

## ✅ **Success Indicators**

- ✅ Database table created with RLS policies
- ✅ Google Cloud Console configured
- ✅ OAuth credentials created
- ✅ MailMaster settings saved
- ✅ Gmail authentication successful
- ✅ Test email received
- ✅ Campaigns can be sent

---

**Need Help?** Check the troubleshooting section or review the Google Cloud Console logs for detailed error messages. 