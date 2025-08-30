# Google OAuth Configuration Checklist

## 🔍 Complete OAuth Setup Verification

### Step 1: Google Cloud Console - OAuth Consent Screen

1. **Go to**: https://console.cloud.google.com/
2. **Select your project**
3. **Navigate to**: APIs & Services > OAuth consent screen
4. **Verify these settings**:

   ✅ **App Information**:
   - App name: [Your app name]
   - User support email: [Your email]
   - App logo: [Optional]

   ✅ **App Domain**:
   - Authorized domains: `emails.tasknova.io`

   ✅ **Developer contact information**:
   - Email addresses: [Your email]

   ✅ **Scopes**:
   - `.../auth/userinfo.email`
   - `.../auth/userinfo.profile`
   - `openid`

   ✅ **Test users** (if External):
   - Add your email addresses for testing

### Step 2: Google Cloud Console - Credentials

1. **Navigate to**: APIs & Services > Credentials
2. **Find your OAuth 2.0 Client ID**
3. **Click to edit**
4. **Verify these settings**:

   ✅ **Authorized JavaScript origins**:
   ```
   https://emails.tasknova.io
   http://localhost:8083 (for development)
   ```

   ✅ **Authorized redirect URIs**:
   ```
   https://emails.tasknova.io/dashboard
   https://emails.tasknova.io/gmail-callback
   http://localhost:8083/dashboard (for development)
   http://localhost:8083/gmail-callback (for development)
   ```

### Step 3: Supabase Dashboard - Authentication

1. **Go to**: https://supabase.com/dashboard
2. **Select your project**: `vkxkwdrkcnsytveuteac`
3. **Navigate to**: Authentication > Providers
4. **Find Google provider and verify**:

   ✅ **Enabled**: Yes
   ✅ **Client ID**: [Your Google OAuth Client ID]
   ✅ **Client Secret**: [Your Google OAuth Client Secret]

### Step 4: Supabase Dashboard - URL Configuration

1. **Navigate to**: Authentication > URL Configuration
2. **Verify these settings**:

   ✅ **Site URL**:
   ```
   https://emails.tasknova.io
   ```

   ✅ **Redirect URLs**:
   ```
   https://emails.tasknova.io/dashboard
   https://emails.tasknova.io/
   https://emails.tasknova.io/login
   https://emails.tasknova.io/gmail-callback
   ```

### Step 5: Environment Variables

1. **Check your `.env` file**:
   ```
   VITE_SUPABASE_URL=https://vkxkwdrkcnsytveuteac.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

2. **Verify these are set in your hosting platform** (Vercel/Netlify/etc.)

### Step 6: Test OAuth Flow

1. **Clear browser data**:
   ```javascript
   localStorage.clear();
   sessionStorage.clear();
   ```

2. **Go to**: `https://emails.tasknova.io`

3. **Click**: "Continue with Google"

4. **Expected behavior**:
   - ✅ Google consent screen appears
   - ✅ Shows your app name
   - ✅ Shows requested permissions
   - ✅ "Continue" button works
   - ✅ Redirects to dashboard after consent

### Step 7: Debug Console Output

**Expected console logs**:
```
OAuth callback detected: { code: "...", error: null, access_token: false, refresh_token: false }
Processing OAuth code: [code]
Supabase URL: https://vkxkwdrkcnsytveuteac.supabase.co
Supabase Key: Present
Exchange result: { data: true, error: null }
Session data: { hasSession: true, hasUser: true, userId: "...", userEmail: "..." }
Session established successfully: [user-id]
Auth state: { user: [user-id], loading: false, hasUser: true }
```

## 🚨 Common Issues & Solutions

### Issue 1: "Invalid Client" Error
**Solution**: Check Client ID and Secret in Supabase match Google Cloud Console

### Issue 2: "Redirect URI Mismatch" Error
**Solution**: Ensure redirect URIs in Google Cloud Console match exactly

### Issue 3: "Unverified App" Warning
**Solution**: Add test users or verify your app with Google

### Issue 4: No Consent Screen
**Solution**: 
1. Check `prompt: 'consent'` is in OAuth parameters
2. Remove app from https://myaccount.google.com/permissions
3. Try again

### Issue 5: Session Not Established
**Solution**: 
1. Check Supabase project is active
2. Verify environment variables
3. Check network requests in browser dev tools

## 🔧 Quick Fixes

### Fix 1: Reset OAuth Permissions
1. Go to https://myaccount.google.com/permissions
2. Find your app
3. Click "Remove Access"
4. Try OAuth flow again

### Fix 2: Test with Incognito
1. Open incognito/private window
2. Try OAuth flow
3. Check if it works

### Fix 3: Verify Domain
1. Ensure `emails.tasknova.io` is properly configured
2. Check SSL certificate is valid
3. Verify DNS settings

## ✅ Success Criteria

After completing this checklist:
- ✅ Consent screen appears
- ✅ OAuth flow completes successfully
- ✅ User is redirected to dashboard
- ✅ Session is established
- ✅ No console errors

---

**Status**: 🔍 Verification checklist
**Priority**: High - Complete OAuth setup
