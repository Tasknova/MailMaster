# SaaS Gmail API Setup Guide

## Overview
This guide explains how to set up Gmail API for a SaaS application where **one Google Cloud Console project** handles all users, rather than requiring each user to create their own project.

## Architecture

### Single Project Approach ✅
- **One Google Cloud Console project** for the entire SaaS application
- **One set of OAuth credentials** shared by all users
- **Individual user tokens** stored in the database
- **Simple user experience** - users just click "Connect Gmail"

### Multi-Project Approach ❌ (What we avoided)
- Each user creates their own Google Cloud Console project
- Each user manages their own OAuth credentials
- Complex setup process for every user
- Poor user experience

## Setup Steps

### Step 1: Create Google Cloud Console Project (Once)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (e.g., "MailMaster SaaS")
3. Enable the Gmail API:
   - Go to "APIs & Services" → "Library"
   - Search for "Gmail API"
   - Click on it and press "Enable"

### Step 2: Create OAuth 2.0 Credentials (Once)

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth 2.0 Client IDs"
3. Choose "Web application"
4. Add these redirect URIs:
   - `http://localhost:5173/gmail-callback` (for development)
   - `https://yourdomain.com/gmail-callback` (for production)
5. Copy your Client ID and Client Secret

### Step 3: Configure Environment Variables

Add these to your `.env` file:

```env
VITE_GOOGLE_CLIENT_ID=your_client_id_here
VITE_GOOGLE_CLIENT_SECRET=your_client_secret_here
```

### Step 4: Update Database Schema

Run this SQL in your Supabase dashboard to remove the client credentials columns:

```sql
-- Remove client_id and client_secret columns from gmail_credentials table
-- These are now stored as environment variables for the SaaS application
ALTER TABLE gmail_credentials 
DROP COLUMN IF EXISTS client_id,
DROP COLUMN IF EXISTS client_secret;
```

### Step 5: Configure OAuth Consent Screen

1. Go to "APIs & Services" → "OAuth consent screen"
2. Choose "External" (unless you have a Google Workspace)
3. Fill in the required information:
   - App name: "MailMaster"
   - User support email: your email
   - Developer contact information: your email
4. Add scopes:
   - `https://www.googleapis.com/auth/gmail.send`
   - `https://www.googleapis.com/auth/gmail.compose`
5. Add test users (your email and any other test emails)

## User Experience

### For Users (Simple!)
1. User signs up for your SaaS
2. User goes to Settings → Gmail Settings
3. User clicks "Connect Gmail"
4. User is redirected to Google to grant permissions
5. User is redirected back and can start sending emails

### No User Setup Required!
- Users don't need to create Google Cloud Console projects
- Users don't need to manage OAuth credentials
- Users don't need to configure redirect URIs
- Users just click one button to connect

## Security Considerations

### Environment Variables
- Store `VITE_GOOGLE_CLIENT_ID` and `VITE_GOOGLE_CLIENT_SECRET` securely
- Never commit these to version control
- Use different credentials for development and production

### Token Storage
- User access tokens are stored in the `gmail_credentials` table
- Each user has their own tokens
- Tokens are encrypted and secure
- Row Level Security (RLS) ensures users can only access their own tokens

### OAuth Flow
- State parameter prevents CSRF attacks
- Tokens are refreshed automatically
- Users can revoke access at any time

## Production Deployment

### Domain Configuration
1. Update the redirect URI in Google Cloud Console to your production domain
2. Update the `REDIRECT_URI` in the code to use your production domain
3. Ensure your domain is verified in Google Cloud Console

### OAuth Consent Screen
1. Submit your app for verification (required for external users)
2. Or keep it in testing mode and add users as test users
3. For production, you'll need to verify your app with Google

## Troubleshooting

### "Invalid redirect URI" error
- Make sure the redirect URI in Google Cloud Console matches exactly
- Check for trailing slashes or typos
- Ensure you're using the correct domain (localhost vs production)

### "Access blocked" error
- Add the user's email as a test user in OAuth consent screen
- Or verify your app with Google for production use

### "Quota exceeded" error
- Gmail API has daily sending limits
- Check your quota in Google Cloud Console > APIs & Services > Quotas
- Consider implementing rate limiting in your app

## API Limits

- **Per user per day**: 1,000,000,000 quota units
- **Per user per 100 seconds**: 250 quota units
- **Per user per 100 seconds per user**: 420 quota units
- **Sending an email**: 100 quota units

## Code Changes Made

### GmailService.ts
- Removed constructor parameters (no longer needed)
- Added static environment variables for credentials
- Simplified token management
- Removed user-specific credential storage

### Database Schema
- Removed `client_id` and `client_secret` columns
- Kept `access_token`, `refresh_token`, and `token_expires_at`
- Each user still has their own tokens

### Components Updated
- CampaignBuilder.tsx
- GmailSettings.tsx
- GmailCallback.tsx

## Benefits of This Approach

1. **Simple User Experience**: One-click Gmail connection
2. **Scalable**: Works for unlimited users
3. **Secure**: Centralized credential management
4. **Maintainable**: Single point of configuration
5. **Cost Effective**: No per-user Google Cloud Console costs

## Next Steps

1. Set up your Google Cloud Console project
2. Add environment variables
3. Update the database schema
4. Test the OAuth flow
5. Deploy to production
6. Monitor usage and quotas

This approach makes your SaaS application much more user-friendly and scalable! 