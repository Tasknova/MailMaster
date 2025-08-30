# OAuth Redirect Fix Guide

## 🚨 Current Issue
You're getting a 404 error on `emails.tasknova.io/dashboard` because the route isn't properly configured on your hosting platform.

## 🔧 Solution Steps

### Step 1: Update Supabase OAuth Settings

1. **Go to Supabase Dashboard**: https://supabase.com/dashboard
2. **Select your project**: `vkxkwdrkcnsytveuteac`
3. **Navigate to**: Authentication > URL Configuration
4. **Update these settings**:

   **Site URL:**
   ```
   https://emails.tasknova.io
   ```

   **Redirect URLs (add these EXACTLY):**
   ```
   https://emails.tasknova.io/dashboard
   https://emails.tasknova.io/
   https://emails.tasknova.io/login
   https://emails.tasknova.io/gmail-callback
   ```

5. **Click "Save"**

### Step 2: Update Google Cloud Console OAuth Settings

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Select your project**
3. **Navigate to**: APIs & Services > Credentials
4. **Find your OAuth 2.0 Client ID and click to edit**
5. **Update Authorized redirect URIs**:

   **Add these URLs:**
   ```
   https://emails.tasknova.io/dashboard
   https://emails.tasknova.io/gmail-callback
   ```

6. **Click "Save"**

### Step 3: Configure Your Hosting Platform

The 404 error suggests your hosting platform needs to be configured for client-side routing. Here are the common solutions:

#### For Vercel:
Create a `vercel.json` file in your project root:
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

#### For Netlify:
Create a `_redirects` file in your `public` folder:
```
/*    /index.html   200
```

#### For Cloudflare Pages:
Add this to your build settings:
- **Build command**: `npm run build`
- **Build output directory**: `dist`
- **Root directory**: `/`

#### For AWS S3 + CloudFront:
Configure CloudFront to serve `index.html` for 404 errors.

### Step 4: Update Your Application Routes

Make sure your React Router is configured to handle the `/dashboard` route properly. Check that your `App.tsx` has the correct route configuration.

### Step 5: Test the Fix

1. **Deploy your changes** to your hosting platform
2. **Go to**: `https://emails.tasknova.io`
3. **Click "Continue with Google"**
4. **Complete the OAuth flow**
5. **You should be redirected to**: `https://emails.tasknova.io/dashboard`

## 🚨 Why This Happened

The issue occurred because:
1. **Client-side routing**: Your React app uses client-side routing, but your hosting platform doesn't know how to handle routes like `/dashboard`
2. **Server-side 404**: When someone visits `/dashboard` directly, the server looks for a file at that path, doesn't find it, and returns 404
3. **SPA routing**: Single Page Applications need the server to serve `index.html` for all routes

## 🔧 Hosting Platform Specific Fixes

### Vercel
```json
// vercel.json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### Netlify
```
# public/_redirects
/*    /index.html   200
```

### Cloudflare Pages
- Set **Build command**: `npm run build`
- Set **Build output directory**: `dist`
- Add **Environment variable**: `NODE_VERSION=18`

### AWS S3 + CloudFront
- Configure CloudFront error pages to serve `index.html` for 404 errors
- Set **Error Code**: 404
- Set **Response Page Path**: `/index.html`
- Set **HTTP Response Code**: 200

## ✅ Expected Result

After making these changes:
- ✅ OAuth will redirect to `https://emails.tasknova.io/dashboard`
- ✅ No more 404 errors
- ✅ Successful authentication flow
- ✅ Proper redirection after Gmail configuration

## 🆘 If Still Having Issues

1. **Check your hosting platform logs** for deployment errors
2. **Verify the domain DNS** is pointing to the correct hosting service
3. **Test with a simple route** like `/` first
4. **Check browser console** for any JavaScript errors
5. **Verify SSL certificate** is properly configured

---

**Status**: 🔧 Hosting configuration fix required
**Priority**: High - Authentication broken
