# Google OAuth Setup with Gmail Sending Permissions

This guide will help you set up Google OAuth authentication with Gmail sending permissions and user profile access for your MailMaster application.

## Overview

The application now uses Google OAuth through Supabase to:
1. **Authenticate users** with their Google account
2. **Get user profile information** (name, email, profile picture)
3. **Grant Gmail sending permissions** to send emails on behalf of the user

## Step 1: Google Cloud Console Setup

### 1.1 Create/Select Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Make sure billing is enabled (required for API usage)

### 1.2 Enable Gmail API
1. Navigate to "APIs & Services" > "Library"
2. Search for "Gmail API"
3. Click on "Gmail API" and click "Enable"

### 1.3 Configure OAuth Consent Screen
1. Go to "APIs & Services" > "OAuth consent screen"
2. Choose "External" user type
3. Fill in required information:
   - **App name**: "MailMaster"
   - **User support email**: Your email
   - **Developer contact information**: Your email
4. **Add scopes**:
   - `https://www.googleapis.com/auth/userinfo.email`
   - `https://www.googleapis.com/auth/userinfo.profile`
   - `https://www.googleapis.com/auth/gmail.send`
5. Add test users (your Gmail address)
6. Save and continue

### 1.4 Create OAuth 2.0 Credentials
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Choose "Web application"
4. Set the following:
   - **Name**: "MailMaster Web Client"
   - **Authorized redirect URIs**: 
     - For development: `http://localhost:8080/auth/callback`
     - For production: `https://yourdomain.com/auth/callback`
5. Click "Create"
6. **Save the Client ID and Client Secret** - you'll need these!

## Step 2: Supabase Configuration

### 2.1 Enable Google Provider
1. Go to your Supabase Dashboard
2. Navigate to "Authentication" > "Providers"
3. Find "Google" and click "Enable"

### 2.2 Configure Google OAuth
1. In the Google provider settings, enter:
   - **Client ID**: The Client ID from Google Cloud Console
   - **Client Secret**: The Client Secret from Google Cloud Console
2. **Add custom scopes**:
   ```
   openid email profile https://www.googleapis.com/auth/gmail.send
   ```
3. **Redirect URL**: `http://localhost:8080/auth/callback`
4. Click "Save"

### 2.3 Environment Variables (Optional)
If you want to configure via environment variables, add to your `.env` file:
```env
SUPABASE_GOOGLE_CLIENT_ID=your_client_id
SUPABASE_GOOGLE_CLIENT_SECRET=your_client_secret
```

## Step 3: Application Features

### 3.1 User Authentication
- Users can sign up/sign in with their Google account
- The application automatically retrieves:
  - Full name
  - First name
  - Last name
  - Email address
  - Profile picture

### 3.2 Gmail Integration
- Users grant Gmail sending permissions during authentication
- The application can send emails on behalf of the user
- No need for separate Gmail API credentials

### 3.3 Profile Information
The application stores the following user information:
```typescript
interface UserProfile {
  full_name: string;
  first_name: string;
  last_name: string;
  email: string;
  avatar_url: string;
}
```

## Step 4: Testing the Integration

### 4.1 Test Authentication
1. Start your application: `npm run dev`
2. Go to the signup/login page
3. Click "Continue with Google"
4. Complete the OAuth flow
5. Verify you're redirected to the dashboard

### 4.2 Test Gmail Sending
1. Go to Settings > Gmail Settings
2. Click "Test Connection"
3. Check your email for the test message

### 4.3 Verify Profile Data
1. Check that your name and profile picture are displayed
2. Verify the email address is correct
3. Test the logout functionality

## Troubleshooting

### Common Issues

1. **"Invalid redirect URI" error**
   - Ensure the redirect URI in Google Cloud Console matches exactly
   - Check that it's configured in Supabase as well

2. **"Scope not allowed" error**
   - Make sure the Gmail scope is added to your OAuth consent screen
   - Verify the scope is included in Supabase configuration

3. **Authentication fails**
   - Check that your app is not in testing mode (for production)
   - Verify all required scopes are included
   - Ensure the Gmail API is enabled

4. **Gmail sending fails**
   - Verify the user granted Gmail sending permissions
   - Check that the access token includes the Gmail scope
   - Test the Gmail API directly

### Debug Steps

1. **Check OAuth consent screen**:
   - Go to Google Cloud Console > OAuth consent screen
   - Verify all required scopes are listed

2. **Verify Supabase configuration**:
   - Check Authentication > Providers > Google
   - Ensure Client ID and Secret are correct
   - Verify redirect URL matches

3. **Test OAuth flow**:
   - Use browser developer tools to check network requests
   - Look for any error messages in the console
   - Verify the callback URL is being called correctly

## Security Considerations

1. **Never expose Client Secret** in client-side code
2. **Use HTTPS** in production
3. **Implement proper session management**
4. **Validate OAuth state parameter** (handled by Supabase)
5. **Store sensitive data securely** (handled by Supabase)

## Production Deployment

When deploying to production:

1. **Update redirect URIs** in Google Cloud Console
2. **Update Supabase configuration** with production URLs
3. **Configure environment variables** properly
4. **Test the complete OAuth flow** in production
5. **Monitor authentication logs** for any issues

## Support

If you encounter issues:

1. Check the browser console for error messages
2. Review the Supabase authentication logs
3. Verify Google Cloud Console configuration
4. Test with a different Google account
5. Check the application logs for detailed error information

---

**Note**: This setup provides a seamless authentication experience while ensuring users have the necessary permissions to send emails through Gmail. The user's profile information is automatically retrieved and stored for use throughout the application. 