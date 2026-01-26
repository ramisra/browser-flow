# Vercel Deployment Plan for Browser Flow

This document outlines the steps and considerations for deploying the Browser Flow Next.js application to Vercel.

## Overview

Browser Flow consists of:
1. **Next.js Application** - Backend API and dashboard (to be deployed on Vercel)
2. **Chrome Extension** - Client-side extension that communicates with the Next.js API
3. **FastAPI Backend** - External backend service (must be deployed separately)

## Pre-Deployment Checklist

### 1. Environment Variables

The following environment variables need to be configured in Vercel:

- **`BROWSER_FLOW_BACKEND_URL`** (Required)
  - Description: Base URL for the FastAPI backend service
  - Example: `https://your-fastapi-backend.herokuapp.com` or `https://api.yourdomain.com`
  - Default (dev): `http://localhost:8000`
  - Used in: `app/api/tasks/route.ts`, `app/api/contexts/route.ts`, and other API routes

### 2. Code Changes Required

#### A. Update Service Worker for Production

The `public/service-worker.js` currently has a hardcoded localhost URL. This needs to be made configurable:

**Current Issue:**
```javascript
const TASK_API_BASE =
  "https://localhost:3000/api/tasks".replace("https://", "http://");
```

**Solution Options:**

**Option 1: Use Environment Variable in Build (Recommended)**
- Create a build script that replaces the URL during build
- Or use a config file that gets injected

**Option 2: Use Runtime Configuration**
- Store the API URL in Chrome extension storage
- Allow users to configure it in extension settings

**Option 3: Use Manifest Variable**
- Use Chrome's `chrome.runtime.getURL()` and configure in manifest

**Recommended Approach:** We'll create a build-time replacement script that injects the Vercel URL.

#### B. Update Next.js Configuration

The `next.config.mjs` may need updates for Vercel compatibility:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Remove experimental.appDir as it's stable in Next.js 14
  // Add output configuration if needed
};
```

### 3. Build Configuration

Vercel will automatically detect Next.js and use the build command from `package.json`:
- Build command: `npm run build` (already configured)
- Output directory: `.next` (automatic for Next.js)

## Deployment Steps

### Step 1: Prepare the Repository

1. **Ensure all changes are committed:**
   ```bash
   git add .
   git commit -m "Prepare for Vercel deployment"
   ```

2. **Push to GitHub/GitLab/Bitbucket:**
   ```bash
   git push origin main
   ```

### Step 2: Deploy to Vercel

#### Option A: Via Vercel Dashboard (Recommended for first deployment)

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"Add New Project"**
3. Import your Git repository
4. Configure project settings:
   - **Framework Preset:** Next.js (auto-detected)
   - **Root Directory:** `./` (root)
   - **Build Command:** `npm run build` (auto-detected)
   - **Output Directory:** `.next` (auto-detected)
   - **Install Command:** `npm install` (auto-detected)

5. **Add Environment Variables:**
   - Go to Project Settings → Environment Variables
   - Add `BROWSER_FLOW_BACKEND_URL` with your FastAPI backend URL
   - Select environments: Production, Preview, Development

6. Click **"Deploy"**

#### Option B: Via Vercel CLI

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Login:**
   ```bash
   vercel login
   ```

3. **Deploy:**
   ```bash
   vercel
   ```
   - Follow prompts to link project
   - Add environment variables when prompted

4. **Deploy to Production:**
   ```bash
   vercel --prod
   ```

### Step 3: Update Chrome Extension

After deployment, you'll get a Vercel URL like: `https://your-project.vercel.app`

**Update the Chrome Extension:**

1. **Option 1: Build-time replacement (Recommended)**
   - Create a script that replaces the API URL in `service-worker.js` during build
   - Or use a config file approach

2. **Option 2: Manual update**
   - Update `public/service-worker.js` line 1-2:
     ```javascript
     const TASK_API_BASE = "https://your-project.vercel.app/api/tasks";
     ```
   - Rebuild and reload extension

3. **Option 3: Environment-based configuration**
   - Create a `config.js` file that reads from Chrome storage
   - Allow users to set API URL in extension options

### Step 4: Verify Deployment

1. **Check API endpoints:**
   - `https://your-project.vercel.app/api/tasks` (POST/GET)
   - `https://your-project.vercel.app/api/contexts` (GET)
   - `https://your-project.vercel.app/api/profile` (GET)

2. **Test from Chrome Extension:**
   - Load updated extension
   - Test task creation
   - Verify polling works

3. **Check Vercel logs:**
   - Go to Vercel Dashboard → Your Project → Deployments → View Function Logs
   - Monitor for any errors

## Post-Deployment Configuration

### 1. Custom Domain (Optional)

1. Go to Project Settings → Domains
2. Add your custom domain
3. Configure DNS as instructed by Vercel

### 2. Environment-Specific URLs

- **Production:** `https://your-project.vercel.app`
- **Preview:** `https://your-project-git-branch.vercel.app` (for PR previews)
- **Development:** Use localhost for local development

### 3. CORS Configuration

If your FastAPI backend is on a different domain, ensure CORS is configured:
- Vercel automatically handles CORS for API routes
- FastAPI backend should allow requests from your Vercel domain

### 4. Rate Limiting

Consider adding rate limiting for API routes:
- Use Vercel's built-in rate limiting
- Or implement in your API routes

## Troubleshooting

### Common Issues

1. **Environment Variables Not Working**
   - Ensure variables are set in Vercel dashboard
   - Redeploy after adding variables
   - Check variable names match exactly (case-sensitive)

2. **API Routes Returning 502**
   - Check `BROWSER_FLOW_BACKEND_URL` is correct
   - Verify FastAPI backend is accessible
   - Check Vercel function logs

3. **Build Failures**
   - Check Node.js version (Vercel uses Node 18.x by default)
   - Verify all dependencies are in `package.json`
   - Check build logs in Vercel dashboard

4. **Extension Can't Connect**
   - Verify Vercel URL is correct in service-worker
   - Check CORS settings
   - Ensure HTTPS is used (Vercel provides HTTPS by default)

## Next Steps After Deployment

1. **Update README.md** with production URLs
2. **Create `.env.example`** file for local development
3. **Set up CI/CD** for automatic deployments
4. **Configure monitoring** (Vercel Analytics, Sentry, etc.)
5. **Set up preview deployments** for pull requests

## Files That Need Updates

- [ ] `public/service-worker.js` - Update API base URL
- [ ] `next.config.mjs` - Verify Vercel compatibility
- [ ] `.env.example` - Create example env file
- [ ] `README.md` - Update with production instructions

## Additional Considerations

### Security

1. **API Authentication:** Consider adding API keys or authentication
2. **Rate Limiting:** Implement rate limiting for public endpoints
3. **Input Validation:** Ensure all inputs are validated
4. **HTTPS:** Vercel provides HTTPS by default (good!)

### Performance

1. **Caching:** Configure appropriate cache headers
2. **CDN:** Vercel automatically uses CDN for static assets
3. **Function Timeout:** Vercel has 10s timeout for Hobby plan, 60s for Pro

### Monitoring

1. **Vercel Analytics:** Enable in project settings
2. **Error Tracking:** Consider Sentry or similar
3. **Logs:** Use Vercel's function logs for debugging

## Cost Considerations

- **Hobby Plan:** Free, suitable for development/testing
  - 100GB bandwidth/month
  - 100 serverless function executions/day
  - 10s function timeout

- **Pro Plan:** $20/month, for production
  - Unlimited bandwidth
  - Unlimited function executions
  - 60s function timeout
  - Better performance

## Support Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js on Vercel](https://vercel.com/docs/frameworks/nextjs)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
