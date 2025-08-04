# OAuth Redirect Fix Guide

## 🚨 Current Issue
You're getting redirected to `http://localhost:8080/dashboard#` with a hash symbol, which indicates an incomplete OAuth flow.

## 🔧 Fix Steps

### Step 1: Google Cloud Console Configuration

1. **Go to Google Cloud Console:** https://console.cloud.google.com/
2. **Select your project**
3. **Navigate to:** APIs & Services > Credentials
4. **Find your OAuth 2.0 Client ID and click to edit**
5. **Scroll down to "Authorized redirect URIs"**
6. **Add this EXACT URL:**
   ```
   http://localhost:8080/dashboard
   ```
7. **Click "Save"**

### Step 2: Supabase Dashboard Configuration

1. **Go to Supabase Dashboard:** https://supabase.com/dashboard
2. **Select your project**
3. **Navigate to:** Authentication > URL Configuration
4. **Update these settings:**

   **Site URL:**
   ```
   http://localhost:8080
   ```

   **Redirect URLs (add these EXACTLY):**
   ```
   http://localhost:8080/dashboard
   http://localhost:8080/
   http://localhost:8080/login
   ```

5. **Click "Save"**

### Step 3: Clear Browser Data

1. **Open Developer Tools (F12)**
2. **Right-click the refresh button**
3. **Select "Empty Cache and Hard Reload"**
4. **Or use an incognito/private window**

### Step 4: Restart Development Server

```bash
# Stop your current server (Ctrl+C)
npm run dev
```

### Step 5: Test OAuth

1. **Go to:** `http://localhost:8080`
2. **Click "Continue with Google"**
3. **Complete the OAuth flow**
4. **You should be redirected to:** `http://localhost:8080/dashboard` (without the #)

## 🚨 Troubleshooting the Hash (#) Issue

### Why You're Getting the Hash:
The `#` at the end of the URL means:
- The OAuth flow is not completing properly
- The redirect URL doesn't match what's configured
- There's a mismatch between Google and Supabase settings

### Common Causes:
1. **Trailing slashes** in redirect URLs
2. **Wrong port** in configuration
3. **Cached OAuth settings**
4. **Missing redirect URLs**

### Quick Fix Checklist:
- [ ] Google Cloud Console has `http://localhost:8080/dashboard`
- [ ] Supabase has `http://localhost:8080/dashboard`
- [ ] No trailing slashes in URLs
- [ ] Browser cache cleared
- [ ] Development server running on port 8080

## 🔍 Debug Information

### Check Console Logs:
When you try OAuth, look for these logs:
```
OAuth redirect URL: http://localhost:8080/dashboard
AuthCallback: Processing callback...
AuthCallback: Current URL: http://localhost:8080/dashboard
```

### If You Still Get the Hash:
1. **Check the browser console for errors**
2. **Verify all URLs match exactly**
3. **Try in an incognito window**
4. **Check if your server is running on port 8080**

## 🎯 Expected Flow

1. **User clicks "Continue with Google"**
2. **Google OAuth popup opens**
3. **User authorizes the app**
4. **Google redirects to:** `http://localhost:8080/dashboard?code=...`
5. **User is automatically logged in and sees the dashboard**
6. **No additional redirects needed**

## 🚀 Success Indicators

- ✅ OAuth redirects to `http://localhost:8080/dashboard` (no hash)
- ✅ URL contains `?code=` parameter
- ✅ No 404 errors
- ✅ User is automatically logged in
- ✅ User sees the dashboard immediately

## 📞 If Still Having Issues

1. **Double-check all URLs are exactly as shown above**
2. **Make sure your development server is running on port 8080**
3. **Try the OAuth flow in an incognito window**
4. **Check the browser console for any error messages**

---

**Important:** The most common cause of the hash issue is incorrect redirect URLs in Google Cloud Console or Supabase. Make sure they match exactly: `http://localhost:8080/dashboard` 