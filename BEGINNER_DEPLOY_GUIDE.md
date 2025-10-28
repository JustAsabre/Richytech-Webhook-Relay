# 🚀 COMPLETE BEGINNER'S GUIDE: Deploy to Heroku & Vercel (Website Only - No Code!)

**For Complete Beginners** | **No Terminal Required** | **Step-by-Step with Screenshots**

**Created:** October 28, 2025  
**Time Required:** 45 minutes  
**Difficulty:** ⭐ Super Easy - Just clicking buttons!

---

## 📌 WHAT YOU'LL LEARN

By the end of this guide, your Webhook Relay app will be:
- ✅ Live on the internet
- ✅ Accessible via HTTPS
- ✅ Running on professional hosting
- ✅ Ready for real users!

**No coding or terminal commands required!** 🎉

---

## 🎯 OVERVIEW: What We're Doing

1. **Set Up Free Accounts** (10 mins)
   - MongoDB Atlas (database)
   - Redis Cloud (cache)
   - Heroku (backend hosting)
   - Vercel (frontend hosting)

2. **Deploy Backend to Heroku** (20 mins)
   - Connect your GitHub
   - Configure settings
   - Click deploy!

3. **Deploy Frontend to Vercel** (15 mins)
   - Connect your GitHub
   - Set environment variables
   - Click deploy!

4. **Test Everything** (5 mins)

---

## 📋 PART 1: CREATE FREE ACCOUNTS (10 Minutes)

### Step 1.1: MongoDB Atlas (Database)

**What is it?** Your app's database where user accounts, webhooks, and logs are stored.

1. **Go to:** https://www.mongodb.com/cloud/atlas/register
2. **Sign up:**
   - Enter your email
   - Create a password
   - Click "Create your Atlas account"
3. **Choose Free Tier:**
   - Select "M0 Free" (512MB - perfect for starting!)
   - Choose "AWS" as provider
   - Choose a region close to you (e.g., "us-east-1" for USA)
   - Click "Create Deployment"
4. **Security Setup:**
   - **Username:** Choose a database username (e.g., "admin")
   - **Password:** Click "Autogenerate Secure Password" and COPY IT!
   - ⚠️ **SAVE THIS PASSWORD!** You'll need it soon.
   - Click "Create Database User"
5. **Network Access:**
   - Click "Add My Current IP Address"
   - Then click "Allow Access from Anywhere" (for Heroku)
   - Enter `0.0.0.0/0` when prompted
   - Click "Add Entry"
6. **Get Connection String:**
   - Click "Database" in left menu
   - Click "Connect" button
   - Click "Connect your application"
   - Copy the connection string (looks like: `mongodb+srv://admin:<password>@cluster0.xxxxx.mongodb.net/`)
   - **SAVE THIS!** Replace `<password>` with your actual password later

✅ **Checkpoint:** You should have a MongoDB connection string saved!

---

### Step 1.2: Redis Cloud (Cache)

**What is it?** Fast temporary storage for session data and queue management.

1. **Go to:** https://redis.com/try-free
2. **Sign up:**
   - Click "Get Started Free"
   - Enter email and password
   - Verify your email
3. **Create Database:**
   - Click "New subscription"
   - Choose "Fixed size" plan
   - Select "30MB" (FREE)
   - Select "AWS" provider
   - Choose same region as MongoDB (e.g., "us-east-1")
   - Click "Create subscription"
4. **Create Database:**
   - Click "New database"
   - Name: "webhook-relay-cache"
   - Click "Create database"
5. **Get Connection Details:**
   - Click on your database
   - Copy "Public endpoint" (looks like: `redis-12345.c123.us-east-1-3.ec2.cloud.redislabs.com:12345`)
   - Copy "Default user password"
   - **Build Redis URL:** `redis://default:YOUR_PASSWORD@YOUR_ENDPOINT`
   - Example: `redis://default:abc123xyz@redis-12345.c123.us-east-1-3.ec2.cloud.redislabs.com:12345`
   - **SAVE THIS REDIS URL!**

✅ **Checkpoint:** You should have a Redis URL saved!

---

### Step 1.3: Heroku (Backend Hosting)

**What is it?** Where your backend API will run.

1. **Go to:** https://signup.heroku.com
2. **Sign up:**
   - Enter your details
   - Choose "Node.js" as primary language
   - Verify your email
3. **Complete Setup:**
   - Login at https://id.heroku.com/login
   - Skip tutorial (we'll deploy directly!)

✅ **Checkpoint:** You're logged into Heroku dashboard!

---

### Step 1.4: Vercel (Frontend Hosting)

**What is it?** Where your React frontend will be hosted.

1. **Go to:** https://vercel.com/signup
2. **Sign up with GitHub:**
   - Click "Continue with GitHub"
   - Authorize Vercel to access your GitHub
   - This will automatically connect your repositories!

✅ **Checkpoint:** You're logged into Vercel dashboard!

---

## 🔐 PART 2: GENERATE SECRETS (5 Minutes)

You need two secret keys for security. Let's generate them!

### Option A: Online Generator (Easiest)

1. **Go to:** https://www.random.org/strings/?num=2&len=64&digits=on&upperalpha=on&loweralpha=on&unique=on&format=html&rnd=new
2. **Copy both strings:**
   - First string = Your **JWT_SECRET**
   - Second string = Your **HMAC_SECRET**
3. **SAVE BOTH!** You'll need them for Heroku.

### Option B: Use These Pre-Generated Secrets (Also Fine)

```
JWT_SECRET=2b85fd7da095bcda4a857ac7a467c41c170cda49f6b77c530944878a6f62c6090a1878d464f9939e545f3922d42f50307a8ac6382067af3599c5f6a3eb77da56

HMAC_SECRET=35a5cf92be0188daccf4fd4f8fc4fc1406919502ab62d5c263c1fdf2debc07e8014e6eb9e5d1b17e10c049d96139c169178ca418e8dbc0a648724411754c0a53
```

✅ **Checkpoint:** You have JWT_SECRET and HMAC_SECRET ready!

---

## 🎯 PART 3: DEPLOY BACKEND TO HEROKU (20 Minutes)

### Step 3.1: Create Heroku App

1. **Go to Heroku Dashboard:** https://dashboard.heroku.com/apps
2. **Click "New" → "Create new app"**
3. **App Details:**
   - **App name:** `your-webhook-relay-api` (must be unique!)
   - **Region:** Choose "United States" or "Europe" (same as MongoDB/Redis)
   - Click "Create app"

✅ **Checkpoint:** You see your new app's dashboard!

---

### Step 3.2: Connect GitHub

1. **In your Heroku app dashboard:**
   - Click "Deploy" tab at the top
2. **Deployment method:**
   - Click "GitHub" (the GitHub icon)
   - Click "Connect to GitHub"
   - Authorize Heroku if prompted
3. **Search for your repo:**
   - Type: `Richytech-Webhook-Relay`
   - Click "Search"
   - Click "Connect" next to your repository

✅ **Checkpoint:** You see "Connected to JustAsabre/Richytech-Webhook-Relay"

---

### Step 3.3: Configure Environment Variables

This is the MOST IMPORTANT STEP! ⚠️

1. **Click "Settings" tab** (at the top of Heroku dashboard)
2. **Scroll down to "Config Vars"**
3. **Click "Reveal Config Vars"**
4. **Add these variables ONE BY ONE:**

**Copy and paste these exactly:**

| KEY | VALUE |
|-----|-------|
| `NODE_ENV` | `production` |
| `PORT` | `5000` |
| `JWT_SECRET` | Your JWT secret from Part 2 |
| `HMAC_SECRET` | Your HMAC secret from Part 2 |
| `MONGODB_URI` | Your MongoDB connection string from Step 1.1 |
| `REDIS_URL` | Your Redis URL from Step 1.2 |
| `JWT_EXPIRES_IN` | `7d` |
| `DEFAULT_QUOTA_LIMIT` | `1000` |
| `RATE_LIMIT_WINDOW_MS` | `900000` |
| `RATE_LIMIT_MAX_REQUESTS` | `100` |

**IMPORTANT URLs (we'll update these in a moment):**

| KEY | VALUE (TEMPORARY) |
|-----|-------|
| `CLIENT_URL` | `http://localhost:5173` |
| `CORS_ORIGIN` | `http://localhost:5173` |
| `WEBHOOK_BASE_URL` | `https://your-webhook-relay-api.herokuapp.com` |

**Replace `your-webhook-relay-api` with YOUR actual Heroku app name!**

**How to add each variable:**
- Enter the KEY in the left box
- Enter the VALUE in the right box
- Click "Add"
- Repeat for all variables

✅ **Checkpoint:** You have at least 12 config vars set!

---

### Step 3.4: Configure Root Directory for Backend

Since our backend is in a subfolder, we need to tell Heroku:

1. **Still in "Settings" tab**
2. **Scroll to "Buildpacks"**
3. **Click "Add buildpack"**
4. **Select "nodejs"**
5. **Click "Save changes"**

**Now add a config var to set the root:**

6. **Go back to "Config Vars"**
7. **Add one more variable:**
   - KEY: `PROJECT_PATH`
   - VALUE: `backend`
   - Click "Add"

**Alternative method (easier):** Create a file in your project

You actually need to do this on GitHub. Let me create a special file:

---

### Step 3.5: Prepare Backend for Heroku Deployment

We need to create some files to tell Heroku how to deploy the backend folder.

**Create these files in your GitHub repository:**

1. **Go to:** https://github.com/JustAsabre/Richytech-Webhook-Relay
2. **Click "Add file" → "Create new file"**
3. **File name:** `Procfile` (no extension!)
4. **File content:**
```
web: cd backend && npm start
```
5. **Click "Commit new file"**

Now create another file:

6. **Click "Add file" → "Create new file"**
7. **File name:** `package.json` (in root directory)
8. **File content:**
```json
{
  "name": "webhook-relay",
  "version": "1.0.0",
  "engines": {
    "node": "18.x",
    "npm": "10.x"
  },
  "scripts": {
    "install": "cd backend && npm install",
    "start": "cd backend && npm start",
    "build": "cd backend && npm install --production"
  }
}
```
9. **Click "Commit new file"**

✅ **Checkpoint:** Procfile and root package.json created on GitHub!

---

### Step 3.6: Deploy Backend!

1. **Go back to Heroku Dashboard**
2. **Click "Deploy" tab**
3. **Scroll to "Manual deploy"**
4. **Make sure "main" branch is selected**
5. **Click "Deploy Branch"** 🚀

**Watch the build:**
- You'll see logs streaming
- Wait for "Build succeeded!"
- Wait for "Deployed to Heroku"
- This takes 2-3 minutes

6. **Once done, click "View"** or visit: `https://your-webhook-relay-api.herokuapp.com/health`

**You should see:**
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2025-10-28T..."
}
```

🎉 **CONGRATULATIONS!** Your backend is live!

✅ **Checkpoint:** Backend is deployed and /health endpoint works!

---

### Step 3.7: Save Your Backend URL

**Copy this URL:** `https://your-webhook-relay-api.herokuapp.com`

You'll need it for Vercel!

---

## 🎨 PART 4: DEPLOY FRONTEND TO VERCEL (15 Minutes)

### Step 4.1: Import Project to Vercel

1. **Go to Vercel Dashboard:** https://vercel.com/dashboard
2. **Click "Add New..." → "Project"**
3. **Import Git Repository:**
   - You should see "Richytech-Webhook-Relay"
   - Click "Import" next to it
4. **Configure Project:**
   - **Project Name:** `webhook-relay-frontend` (or your choice)
   - **Framework Preset:** Vite (should auto-detect)
   - **Root Directory:** Click "Edit" → Select `frontend` folder → Click "Continue"

---

### Step 4.2: Configure Build Settings

**In the "Build and Output Settings" section:**

- **Build Command:** `npm run build` (should be auto-filled)
- **Output Directory:** `dist` (should be auto-filled)
- **Install Command:** `npm install` (should be auto-filled)

✅ These should be correct already!

---

### Step 4.3: Set Environment Variables

**THIS IS CRITICAL!** ⚠️

1. **Scroll down to "Environment Variables"**
2. **Click to expand**
3. **Add these variables:**

| NAME | VALUE |
|------|-------|
| `VITE_API_URL` | `https://your-webhook-relay-api.herokuapp.com` |
| `VITE_APP_ENV` | `production` |

**Replace `your-webhook-relay-api` with YOUR actual Heroku app name!**

**How to add:**
- Enter NAME in first box
- Enter VALUE in second box
- Click "Add" (+ button)
- Repeat for second variable

---

### Step 4.4: Deploy Frontend!

1. **Click "Deploy"** 🚀
2. **Wait for build** (2-3 minutes)
3. **Watch the build logs:**
   - Installing dependencies...
   - Building application...
   - Build completed!
   - Deploying...
   - Success!

4. **Once complete, you'll see:**
   - 🎉 Confetti animation!
   - **"Congratulations!"** message
   - Three buttons: Visit, Dashboard, Continue to Dashboard

5. **Click "Visit"** to see your live app!

**Your frontend is now live at:** `https://webhook-relay-frontend.vercel.app`

🎉 **CONGRATULATIONS!** Your frontend is live!

✅ **Checkpoint:** Frontend is deployed and you can see the login page!

---

### Step 4.5: Update Backend URLs

Now we need to tell the backend about the frontend URL:

1. **Go back to Heroku Dashboard:** https://dashboard.heroku.com/apps
2. **Click on your backend app** (`your-webhook-relay-api`)
3. **Click "Settings" tab**
4. **Click "Reveal Config Vars"**
5. **Update these two variables:**

**Find `CLIENT_URL` and change value to:**
```
https://webhook-relay-frontend.vercel.app
```

**Find `CORS_ORIGIN` and change value to:**
```
https://webhook-relay-frontend.vercel.app
```

**Replace `webhook-relay-frontend` with YOUR actual Vercel domain!**

6. **Heroku will automatically restart** with new settings (takes 30 seconds)

✅ **Checkpoint:** Backend now allows frontend to connect!

---

## 🧪 PART 5: TEST YOUR DEPLOYMENT (5 Minutes)

### Test 1: Can you access the frontend?

1. **Visit:** `https://webhook-relay-frontend.vercel.app` (your Vercel URL)
2. **You should see:** Login page with Webhook Relay branding
3. ✅ **If yes:** Frontend is working!
4. ❌ **If no:** Check Vercel deployment logs

---

### Test 2: Can you register?

1. **Click "Don't have an account? Sign up"**
2. **Fill in the form:**
   - Full Name: Test User
   - Email: test@example.com
   - Password: TestPass123
3. **Click "Sign Up"**
4. **You should:**
   - See "Registration successful!" message
   - Be redirected to login page
5. ✅ **If yes:** Backend connection is working!
6. ❌ **If no:** Open browser console (F12) and check for errors

---

### Test 3: Can you login?

1. **Enter credentials:**
   - Email: test@example.com
   - Password: TestPass123
2. **Click "Login"**
3. **You should:**
   - See dashboard with "Welcome back, Test User!"
   - See navigation menu (Dashboard, Endpoints, Logs, API Keys, Analytics, Settings)
   - See "Create New Endpoint" button
4. ✅ **If yes:** Full authentication is working!
5. ❌ **If no:** Check browser console

---

### Test 4: Can you create an endpoint?

1. **Click "Create New Endpoint"**
2. **Fill in:**
   - Name: My First Webhook
   - Description: Testing deployment
   - Destination URL: https://webhook.site/unique-url (get from webhook.site)
3. **Click "Create Endpoint"**
4. **You should see:**
   - Success message
   - Webhook URL generated (looks like: `https://your-app.herokuapp.com/webhook/abc123xyz`)
   - HMAC Secret displayed
5. ✅ **If yes:** Everything is working perfectly!
6. ❌ **If no:** Check Heroku logs

---

### Test 5: Send a test webhook

1. **Copy your webhook URL** from the endpoint you just created
2. **Open a new tab and use this tool:** https://reqbin.com/
3. **Configure request:**
   - Method: POST
   - URL: Your webhook URL
   - Headers: `Content-Type: application/json`
   - Body:
   ```json
   {
     "event": "test",
     "message": "Hello from deployment!"
   }
   ```
4. **Click "Send"**
5. **Go back to your app:**
   - Click "Logs" in sidebar
   - You should see your webhook logged!
6. ✅ **If yes:** EVERYTHING WORKS! 🎉
7. ❌ **If no:** Check webhook worker in Heroku logs

---

## 🎉 SUCCESS CHECKLIST

If you can check all these, YOU'RE LIVE! 🚀

- [ ] Frontend loads at Vercel URL
- [ ] Can register new account
- [ ] Can login
- [ ] Can see dashboard
- [ ] Can create endpoint
- [ ] Webhook URL is generated
- [ ] Can send test webhook
- [ ] Webhook appears in logs
- [ ] Can view analytics
- [ ] Can create API keys

---

## 📱 YOUR APP DETAILS (Save This!)

**Your Deployment URLs:**

| Service | URL | Purpose |
|---------|-----|---------|
| **Frontend** | `https://webhook-relay-frontend.vercel.app` | What users visit |
| **Backend API** | `https://your-webhook-relay-api.herokuapp.com` | API endpoints |
| **Health Check** | `https://your-webhook-relay-api.herokuapp.com/health` | Check if backend is up |
| **GitHub Repo** | `https://github.com/JustAsabre/Richytech-Webhook-Relay` | Your code |

**Your Credentials:**

| Service | Username/Email | Notes |
|---------|---------------|-------|
| MongoDB Atlas | your-email | Database |
| Redis Cloud | your-email | Cache |
| Heroku | your-email | Backend hosting |
| Vercel | GitHub account | Frontend hosting |
| GitHub | JustAsabre | Code repository |

**Your Secrets (KEEP PRIVATE!):**

- JWT_SECRET: `[Your secret]`
- HMAC_SECRET: `[Your secret]`
- MongoDB Password: `[Your password]`
- Redis Password: `[Your password]`

---

## 🔄 HOW TO UPDATE YOUR APP

### When you make code changes:

#### Option 1: Automatic Deployment (Recommended)

**Heroku:**
1. Go to your Heroku app → Deploy tab
2. Scroll to "Automatic deploys"
3. Click "Enable Automatic Deploys"
4. Now every push to GitHub = automatic deployment! 🎉

**Vercel:**
- Already automatic! Every push deploys instantly.

#### Option 2: Manual Deployment

**Heroku:**
1. Go to Deploy tab
2. Scroll to "Manual deploy"
3. Click "Deploy Branch"

**Vercel:**
1. Go to your project on Vercel
2. Click "Deployments"
3. Click "Redeploy" on any deployment

---

## 🐛 TROUBLESHOOTING

### "Application Error" on Heroku

**Problem:** Backend won't start

**Solutions:**
1. Check Heroku logs:
   - Go to Heroku app → More → View logs
   - Look for error messages
2. Verify Config Vars are all set correctly
3. Check MongoDB connection string has password filled in
4. Make sure `Procfile` exists in root directory

---

### "Failed to fetch" on Frontend

**Problem:** Frontend can't connect to backend

**Solutions:**
1. Verify `VITE_API_URL` in Vercel matches Heroku URL exactly
2. Verify `CORS_ORIGIN` in Heroku matches Vercel URL exactly
3. Check backend health: Visit `https://your-app.herokuapp.com/health`
4. Check browser console (F12) for error details

---

### Can't register or login

**Problem:** Database connection issue

**Solutions:**
1. Verify MongoDB `MONGODB_URI` in Heroku Config Vars
2. Check MongoDB Atlas → Network Access → Allow 0.0.0.0/0
3. Check MongoDB Atlas → Database Access → User exists with correct password
4. Try replacing `<password>` in connection string with actual password

---

### Webhooks not being received

**Problem:** Webhook queue/worker issue

**Solutions:**
1. Verify `REDIS_URL` in Heroku Config Vars is correct
2. Check Redis Cloud → Database is running
3. Check Heroku logs for worker errors
4. Verify Bull queue is processing jobs

---

## 💡 NEXT STEPS

Now that your app is live:

### 1. Custom Domain (Optional)

**Vercel (Frontend):**
1. Buy domain from Namecheap, GoDaddy, etc.
2. Go to Vercel project → Settings → Domains
3. Add your domain
4. Follow DNS instructions

**Heroku (Backend):**
1. Go to Heroku app → Settings → Domains
2. Click "Add domain"
3. Follow DNS instructions

### 2. Enable Monitoring

**Heroku:**
1. Go to Resources tab
2. Add "Papertrail" add-on (free tier)
3. View logs in real-time

**Sentry (Error Tracking):**
1. Sign up at https://sentry.io
2. Create project
3. Add DSN to Heroku Config Vars: `SENTRY_DSN`
4. Add DSN to Vercel Env Vars: `VITE_SENTRY_DSN`

### 3. Set Up Analytics

**Google Analytics:**
1. Create GA4 property at https://analytics.google.com
2. Copy Measurement ID
3. Add to Vercel: `VITE_GA_MEASUREMENT_ID`

### 4. Upgrade as Needed

**When you get more traffic:**
- Heroku: Upgrade from free to Hobby ($7/mo)
- MongoDB: Upgrade to M10 ($9/mo) for better performance
- Redis: Upgrade for more storage
- Vercel: Usually free tier is enough!

---

## 🎓 WHAT YOU LEARNED

Congratulations! You just:
- ✅ Deployed a full-stack application
- ✅ Set up production databases
- ✅ Configured environment variables
- ✅ Connected frontend to backend
- ✅ Set up automatic deployments
- ✅ Tested a live application
- ✅ Became a deployment expert! 🎉

---

## 📞 NEED HELP?

- **GitHub Issues:** https://github.com/JustAsabre/Richytech-Webhook-Relay/issues
- **Heroku Docs:** https://devcenter.heroku.com
- **Vercel Docs:** https://vercel.com/docs
- **MongoDB Docs:** https://docs.atlas.mongodb.com
- **Redis Docs:** https://docs.redis.com

---

## 🎊 SHARE YOUR SUCCESS!

Your app is LIVE! Share it:
- Tweet about it: "Just deployed my webhook relay service! 🚀"
- Add to portfolio
- Show friends and family
- Start getting users!

---

**Built with ❤️ by Richytech.inc**

**Your journey from code to cloud is complete!** 🌟

---

## 📄 APPENDIX: Quick Reference

### Heroku App URLs
- Dashboard: `https://dashboard.heroku.com/apps/[your-app-name]`
- Logs: `https://dashboard.heroku.com/apps/[your-app-name]/logs`
- Settings: `https://dashboard.heroku.com/apps/[your-app-name]/settings`

### Vercel Project URLs
- Dashboard: `https://vercel.com/[your-username]/[project-name]`
- Deployments: `https://vercel.com/[your-username]/[project-name]/deployments`
- Settings: `https://vercel.com/[your-username]/[project-name]/settings`

### MongoDB Atlas URLs
- Clusters: `https://cloud.mongodb.com/v2#/clusters`
- Network Access: `https://cloud.mongodb.com/v2#/security/network/accessList`
- Database Access: `https://cloud.mongodb.com/v2#/security/database/users`

### Redis Cloud URLs
- Subscriptions: `https://app.redislabs.com/#/subscriptions`
- Databases: `https://app.redislabs.com/#/databases`

---

**End of Guide** 🎉

You did it! Your Webhook Relay Service is live and ready for users!
