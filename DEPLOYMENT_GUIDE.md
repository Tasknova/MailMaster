# Deployment Guide - Fix OAuth 404 Error

## 🚨 Current Issue
Your OAuth is redirecting to `https://emails.tasknova.io/dashboard` but getting a 404 error because your hosting platform isn't configured for client-side routing.

## 🔧 Quick Fix Steps

### Step 1: Update OAuth Settings

**Supabase Dashboard:**
1. Go to https://supabase.com/dashboard
2. Select project: `vkxkwdrkcnsytveuteac`
3. Go to Authentication > URL Configuration
4. Set Site URL: `https://emails.tasknova.io`
5. Add Redirect URLs:
   - `https://emails.tasknova.io/dashboard`
   - `https://emails.tasknova.io/`
   - `https://emails.tasknova.io/login`
   - `https://emails.tasknova.io/gmail-callback`

**Google Cloud Console:**
1. Go to https://console.cloud.google.com/
2. Find your OAuth 2.0 Client ID
3. Add Authorized redirect URIs:
   - `https://emails.tasknova.io/dashboard`
   - `https://emails.tasknova.io/gmail-callback`

### Step 2: Deploy Configuration Files

I've created these configuration files for you:

- `vercel.json` - For Vercel hosting
- `public/_redirects` - For Netlify hosting
- `public/_headers` - For Netlify security headers

### Step 3: Deploy Your Application

**For Vercel:**
```bash
# Install Vercel CLI if not installed
npm i -g vercel

# Deploy
vercel --prod
```

**For Netlify:**
```bash
# Build your project
npm run build

# Deploy the dist folder to Netlify
# Or connect your GitHub repo to Netlify for automatic deployments
```

**For Cloudflare Pages:**
1. Connect your GitHub repo to Cloudflare Pages
2. Set Build command: `npm run build`
3. Set Build output directory: `dist`

### Step 4: Test the Fix

1. Go to `https://emails.tasknova.io`
2. Click "Continue with Google"
3. Complete OAuth flow
4. Should redirect to `https://emails.tasknova.io/dashboard` successfully

## 🔧 What These Files Do

### `vercel.json`
- Tells Vercel to serve `index.html` for all routes
- Adds security headers
- Enables client-side routing

### `public/_redirects`
- Tells Netlify to serve `index.html` for all routes
- Enables client-side routing

### `public/_headers`
- Adds security headers for Netlify
- Protects against clickjacking and other attacks

## 🚨 Why This Happened

React Router uses client-side routing, but your hosting platform was trying to find actual files at `/dashboard`, `/login`, etc. These files don't exist because React Router handles routing in the browser.

The configuration files tell your hosting platform to serve `index.html` for all routes, letting React Router handle the routing.

## ✅ Expected Result

After deployment:
- ✅ OAuth redirects work properly
- ✅ No more 404 errors
- ✅ All routes work correctly
- ✅ Security headers are in place

## 🆘 If Still Having Issues

1. **Check hosting platform logs** for deployment errors
2. **Verify DNS settings** point to correct hosting service
3. **Test with simple route** like `/` first
4. **Clear browser cache** and try again
5. **Check SSL certificate** is properly configured

---

**Status**: 🔧 Ready for deployment
**Priority**: High - Authentication broken
