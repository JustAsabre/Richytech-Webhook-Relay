# 🚀 Deploy to Render & Vercel (Alternative Guide)

**⚠️ IMPORTANT:** We recommend using **Fly.io** instead of Render.  
**See FLYIO_DEPLOY_GUIDE.md for the recommended deployment method.**

**Why Fly.io over Render?**
- ✅ More generous free tier (3 VMs vs Render's 750 hours/month)
- ✅ Never sleeps (Render free tier sleeps after 15min inactivity)
- ✅ Global edge deployment
- ✅ Faster performance
- ✅ Better for webhook services (no cold starts)

---

## Use This Guide Only If You Prefer Render

If you still want to use Render, here's how:

### Prerequisites
- GitHub account
- MongoDB Atlas account (see FLYIO_DEPLOY_GUIDE.md Step 1.1)
- Redis Cloud account (see FLYIO_DEPLOY_GUIDE.md Step 1.2)

---

## PART 1: CREATE RENDER ACCOUNT

### Step 1: Sign Up for Render

1. **Go to:** https://render.com/register
2. **Sign up with GitHub:**
   - Click "Sign up with GitHub"
   - Authorize Render
   - Verify your email
3. **Complete Setup:**
   - Login at https://dashboard.render.com

✅ **Checkpoint:** You're logged into Render dashboard!

---

## PART 2: DEPLOY BACKEND TO RENDER

### Step 1: Create New Web Service

1. **Go to Render Dashboard:** https://dashboard.render.com
2. **Click "New +" → "Web Service"**
3. **Connect GitHub Repository:**
   - Find your "Richytech-Webhook-Relay" repository
   - Click "Connect"

### Step 2: Configure Web Service

Fill in the following settings:

| Setting | Value |
|---------|-------|
| **Name** | `webhook-relay-backend` (or your choice) |
| **Region** | Choose closest to you (e.g., Oregon USA) |
| **Branch** | `main` |
| **Root Directory** | `backend` |
| **Environment** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Plan** | **Free** ⚠️ (sleeps after 15min inactivity) |

### Step 3: Set Environment Variables

Click "Advanced" → "Add Environment Variable" and add these:

| NAME | VALUE |
|------|-------|
| `NODE_ENV` | `production` |
| `PORT` | `10000` (Render uses port 10000) |
| `MONGODB_URI` | Your MongoDB connection string |
| `REDIS_URL` | Your Redis URL |
| `JWT_SECRET` | Your JWT secret (64 character string) |
| `HMAC_SECRET` | Your HMAC secret (64 character string) |
| `JWT_EXPIRES_IN` | `7d` |
| `DEFAULT_QUOTA_LIMIT` | `1000` |
| `RATE_LIMIT_WINDOW_MS` | `900000` |
| `RATE_LIMIT_MAX_REQUESTS` | `100` |
| `CLIENT_URL` | `http://localhost:5173` (will update after frontend deploy) |
| `CORS_ORIGIN` | `http://localhost:5173` (will update after frontend deploy) |
| `API_URL` | `https://webhook-relay-backend.onrender.com` (use YOUR service name) |

**Important:** Replace placeholder values with your actual credentials!

### Step 4: Deploy

1. **Click "Create Web Service"**
2. **Wait for deployment** (3-5 minutes)
3. **Watch the logs** for any errors
4. **Once deployed**, you'll see "Your service is live at..." with a URL

✅ **Checkpoint:** Backend is deployed!

**Your Render URL will be:** `https://webhook-relay-backend.onrender.com`

**SAVE THIS URL!** You'll need it for Vercel.

### Step 5: Verify Backend

1. Visit: `https://your-service-name.onrender.com/health`
2. You should see:
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "..."
}
```

---

## PART 3: DEPLOY FRONTEND TO VERCEL

**Follow Steps 4.1 through 4.5 from FLYIO_DEPLOY_GUIDE.md**

The only difference is your `VITE_API_URL`:
- Use: `https://your-service-name.onrender.com` (your Render URL)

---

## PART 4: UPDATE BACKEND URLs

After deploying frontend to Vercel, update your Render environment variables:

1. **Go to:** https://dashboard.render.com
2. **Click on your webhook-relay-backend service**
3. **Click "Environment" in left sidebar**
4. **Update these variables:**
   - `CLIENT_URL` → `https://your-app.vercel.app`
   - `CORS_ORIGIN` → `https://your-app.vercel.app`
5. **Save Changes**
6. **Render will automatically redeploy**

---

## ⚠️ RENDER FREE TIER LIMITATIONS

**Important things to know:**

### 1. **App Sleeps After 15 Minutes**
- Your backend will "sleep" after 15 minutes of no requests
- **First request after sleep takes 30-60 seconds to "wake up"**
- This is **BAD for webhooks** - you might miss time-sensitive webhooks!

### 2. **750 Hours/Month Limit**
- Free tier gives you 750 hours per month
- If your app runs 24/7, that's only 31.25 days
- Multiple services share this quota

### 3. **Workarounds**
- Use a service like **UptimeRobot** to ping your app every 10 minutes
- This keeps it awake but uses more hours
- **Better solution: Use Fly.io instead!**

---

## 🎯 TESTING YOUR DEPLOYMENT

Follow the testing steps from FLYIO_DEPLOY_GUIDE.md Part 5.

---

## 🆘 TROUBLESHOOTING

### Backend not starting?
1. Check logs in Render dashboard
2. Verify all environment variables are set correctly
3. Make sure MongoDB and Redis URLs are correct
4. Check that `PORT` is set to `10000`

### Webhooks not being received?
1. Check if service is sleeping (common issue!)
2. Verify `API_URL` is set correctly in environment variables
3. Check logs for errors

### Frontend can't connect to backend?
1. Verify `VITE_API_URL` in Vercel is your Render URL
2. Check CORS settings in backend
3. Make sure backend is awake and responding

---

## 🚀 WHY WE RECOMMEND FLY.IO INSTEAD

| Feature | Fly.io Free | Render Free |
|---------|-------------|-------------|
| **VMs/Apps** | 3 VMs | 750 hrs/month |
| **Sleep?** | Never | After 15 min |
| **Cold Start** | No | 30-60 sec |
| **Good for Webhooks?** | ✅ Yes | ❌ No (misses webhooks) |
| **Build Speed** | Fast | Slow |
| **Global CDN** | ✅ Yes | Limited |
| **Free SSL** | ✅ Yes | ✅ Yes |
| **Custom Domains** | ✅ Yes | ✅ Yes |

**For a webhook service, Fly.io is significantly better because:**
- Your app never sleeps (critical for webhooks!)
- No cold starts (instant response)
- Better performance globally
- More suitable for real-time services

**Use Render only if:**
- You don't mind the 15-minute sleep timeout
- You'll set up an uptime monitor to keep it awake
- You're just testing/prototyping

**For production, switch to Fly.io using FLYIO_DEPLOY_GUIDE.md**

---

## 📚 NEXT STEPS

1. ✅ Test your deployment thoroughly
2. ⚠️ Set up UptimeRobot to keep backend awake (if using Render)
3. 🎯 Create your first webhook endpoint
4. 📊 Monitor your logs and analytics
5. 🚀 **Consider migrating to Fly.io for better reliability**

---

**Questions?** Check FLYIO_DEPLOY_GUIDE.md for a better deployment option!
