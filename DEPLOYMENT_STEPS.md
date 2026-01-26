# Quick Deployment Steps to Vercel

This is a quick reference guide. For detailed information, see `VERCEL_DEPLOYMENT_PLAN.md`.

## Prerequisites

1. ✅ Your code is committed and pushed to Git (GitHub/GitLab/Bitbucket)
2. ✅ Your FastAPI backend is deployed and accessible
3. ✅ You have a Vercel account (sign up at [vercel.com](https://vercel.com))

## Step-by-Step Deployment

### 1. Deploy to Vercel

**Option A: Via Dashboard (Easiest)**
1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your Git repository
3. Configure:
   - Framework: Next.js (auto-detected)
   - Root Directory: `./`
4. Add Environment Variable:
   - Name: `BROWSER_FLOW_BACKEND_URL`
   - Value: Your FastAPI backend URL (e.g., `https://your-backend.herokuapp.com`)
5. Click **Deploy**

**Option B: Via CLI**
```bash
npm i -g vercel
vercel login
vercel
# Follow prompts, add environment variables when asked
vercel --prod  # Deploy to production
```

### 2. Get Your Vercel URL

After deployment, you'll get a URL like:
- `https://your-project.vercel.app` (production)
- `https://your-project-git-main.vercel.app` (preview)

### 3. Update Chrome Extension

Update the service worker to use your Vercel URL:

```bash
# Replace with your actual Vercel URL
npm run update-extension-url https://your-project.vercel.app
```

Or manually edit `public/service-worker.js`:
```javascript
const TASK_API_BASE = "https://your-project.vercel.app/api/tasks";
```

### 4. Reload Chrome Extension

1. Go to `chrome://extensions`
2. Find "Browser Flow" extension
3. Click the reload icon
4. Test the extension

### 5. Verify Everything Works

- ✅ Visit your Vercel dashboard and check deployment status
- ✅ Test API endpoint: `https://your-project.vercel.app/api/tasks` (should return 400 for GET without params, which is expected)
- ✅ Test extension: Click extension icon and create a task
- ✅ Check Vercel function logs for any errors

## Environment Variables Checklist

Make sure these are set in Vercel Dashboard → Project Settings → Environment Variables:

- [ ] `BROWSER_FLOW_BACKEND_URL` - Your FastAPI backend URL

## Troubleshooting

**API returns 502 Bad Gateway**
- Check `BROWSER_FLOW_BACKEND_URL` is correct
- Verify FastAPI backend is running and accessible
- Check Vercel function logs

**Extension can't connect**
- Verify service-worker.js has correct Vercel URL
- Check browser console for CORS errors
- Ensure you're using HTTPS (Vercel provides this automatically)

**Build fails**
- Check Node.js version (Vercel uses 18.x by default)
- Verify all dependencies are in package.json
- Check build logs in Vercel dashboard

## Next Steps

- [ ] Set up custom domain (optional)
- [ ] Configure preview deployments for PRs
- [ ] Set up monitoring/analytics
- [ ] Update README with production URLs

## Need Help?

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Support](https://vercel.com/support)
- See `VERCEL_DEPLOYMENT_PLAN.md` for detailed information
