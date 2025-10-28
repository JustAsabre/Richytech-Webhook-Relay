# QUICK DEPLOYMENT GUIDE
## Get Your Webhook Relay Service Live in 30 Minutes

**Created:** October 26, 2025  
**Status:** Production Ready ✅  
**Recommended Path:** Heroku + Vercel (Easiest)

---

## 🎯 FASTEST PATH TO PRODUCTION

### Option 1: Heroku + Vercel (Recommended for Beginners)
**Time:** ~30 minutes  
**Cost:** Free tier available  
**Difficulty:** ⭐ Easy

### Option 2: Railway + Vercel  
**Time:** ~20 minutes  
**Cost:** Free tier available  
**Difficulty:** ⭐ Easy

### Option 3: DigitalOcean VPS
**Time:** ~60 minutes  
**Cost:** $5/month  
**Difficulty:** ⭐⭐⭐ Advanced

---

## 📋 PREREQUISITES (Do This First!)

### 1. Create MongoDB Atlas Account (FREE)
1. Go to https://cloud.mongodb.com
2. Sign up for free account
3. Create a new cluster (M0 Free tier)
4. Click "Connect" → "Connect your application"
5. Copy connection string (looks like: `mongodb+srv://username:password@cluster.mongodb.net/`)
6. **Save this** - you'll need it!

### 2. Create Redis Cloud Account (FREE)
1. Go to https://redis.com/try-free
2. Sign up for free account  
3. Create a new database (30MB free)
4. Copy connection URL (looks like: `redis://default:password@host:port`)
5. **Save this** - you'll need it!

### 3. Generate Production Secrets
Run this in your terminal:
```bash
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
node -e "console.log('HMAC_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
```
**Save both secrets** - you'll need them!

---

## 🚀 DEPLOYMENT: HEROKU + VERCEL (RECOMMENDED)

### Part A: Deploy Backend to Heroku

#### Step 1: Install Heroku CLI
```bash
# Windows (download installer)
https://devcenter.heroku.com/articles/heroku-cli

# Mac
brew tap heroku/brew && brew install heroku

# Linux
curl https://cli-assets.heroku.com/install.sh | sh
```

#### Step 2: Login to Heroku
```bash
heroku login
```

#### Step 3: Create Heroku App
```bash
cd backend
heroku create your-webhook-relay-api
```

#### Step 4: Add MongoDB and Redis
```bash
# If using MongoDB Atlas (recommended - free tier)
# Just set MONGODB_URI in next step

# If using Heroku Redis (paid add-on)
heroku addons:create heroku-redis:mini
```

#### Step 5: Set Environment Variables
```bash
# Required variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your_generated_jwt_secret_here
heroku config:set HMAC_SECRET=your_generated_hmac_secret_here
heroku config:set MONGODB_URI=your_mongodb_atlas_connection_string
heroku config:set REDIS_URL=your_redis_cloud_url
heroku config:set CLIENT_URL=https://your-app-name.vercel.app
heroku config:set CORS_ORIGIN=https://your-app-name.vercel.app
heroku config:set WEBHOOK_BASE_URL=https://your-webhook-relay-api.herokuapp.com
heroku config:set JWT_EXPIRES_IN=7d
heroku config:set DEFAULT_QUOTA_LIMIT=1000
```

#### Step 6: Deploy
```bash
git push heroku main

# If on different branch
git push heroku your-branch:main
```

#### Step 7: Verify Deployment
```bash
heroku open
heroku logs --tail
```

Visit: `https://your-webhook-relay-api.herokuapp.com/health`  
Should see: `{"success":true,"message":"Server is running"}`

---

### Part B: Deploy Frontend to Vercel

#### Step 1: Install Vercel CLI
```bash
npm install -g vercel
```

#### Step 2: Login to Vercel
```bash
vercel login
```

#### Step 3: Configure Frontend Environment
Create `frontend/.env.production`:
```env
VITE_API_URL=https://your-webhook-relay-api.herokuapp.com
VITE_APP_ENV=production
```

#### Step 4: Build Frontend
```bash
cd frontend
npm run build
```

#### Step 5: Deploy to Vercel
```bash
# Deploy to production
vercel --prod

# Follow the prompts:
# - Set up and deploy? Yes
# - Which scope? Your account
# - Link to existing project? No
# - Project name? webhook-relay-frontend
# - Directory? ./
# - Override settings? No
```

#### Step 6: Set Environment Variables in Vercel Dashboard
1. Go to https://vercel.com/dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add:
   - `VITE_API_URL` = `https://your-webhook-relay-api.herokuapp.com`
   - `VITE_APP_ENV` = `production`

#### Step 7: Update Backend with Frontend URL
```bash
cd ../backend
heroku config:set CLIENT_URL=https://your-app-name.vercel.app
heroku config:set CORS_ORIGIN=https://your-app-name.vercel.app
```

#### Step 8: Verify Deployment
Visit your Vercel URL (e.g., `https://webhook-relay-frontend.vercel.app`)  
You should see the login page!

---

## 🔄 ALTERNATIVE: RAILWAY + VERCEL

### Deploy Backend to Railway

#### Step 1: Create Railway Account
Go to https://railway.app and sign up with GitHub

#### Step 2: Create New Project
1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Connect your repository
4. Select `backend` folder as root

#### Step 3: Add Services
1. Add MongoDB: Click "+ New" → Database → MongoDB
2. Add Redis: Click "+ New" → Database → Redis
3. Railway will auto-generate connection strings

#### Step 4: Set Environment Variables
In Railway dashboard → Your Service → Variables:
```env
NODE_ENV=production
JWT_SECRET=your_generated_jwt_secret
HMAC_SECRET=your_generated_hmac_secret
MONGODB_URI=${{MongoDB.MONGO_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
CLIENT_URL=https://your-app.vercel.app
CORS_ORIGIN=https://your-app.vercel.app
WEBHOOK_BASE_URL=${{RAILWAY_STATIC_URL}}
PORT=5000
```

#### Step 5: Deploy
Railway will auto-deploy on Git push!

Railway generates a URL: `https://your-service.up.railway.app`

#### Step 6: Deploy Frontend to Vercel
Follow same steps as Heroku + Vercel above, but use Railway URL as VITE_API_URL

---

## ✅ POST-DEPLOYMENT VERIFICATION

### 1. Check Backend Health
```bash
curl https://your-backend-domain.com/health
```
Should return: `{"success":true,...}`

### 2. Test Registration
```bash
curl -X POST https://your-backend-domain.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123",
    "fullName": "Test User"
  }'
```

### 3. Test Frontend
1. Visit your frontend URL
2. Try to register a new account
3. Login with the account
4. Check dashboard loads
5. Create a test endpoint
6. Verify webhook URL generated

### 4. Monitor Logs
```bash
# Heroku
heroku logs --tail

# Railway  
# View in Railway dashboard

# Vercel
vercel logs
```

---

## 🔒 SECURITY CHECKLIST

Before going live, ensure:

- [ ] JWT_SECRET is strong and random (64+ characters)
- [ ] HMAC_SECRET is strong and random (64+ characters)
- [ ] MongoDB has authentication enabled
- [ ] Redis has authentication enabled
- [ ] CORS_ORIGIN is set to your frontend domain only
- [ ] Environment variables are set (not in code)
- [ ] SSL/HTTPS enabled (automatic on Heroku/Vercel)
- [ ] `.env` files are in `.gitignore`
- [ ] No secrets committed to Git

---

## 📊 MONITORING SETUP (Optional but Recommended)

### Set up Sentry for Error Tracking

1. Create account at https://sentry.io
2. Create new project
3. Copy DSN
4. Add to backend environment:
```bash
heroku config:set SENTRY_DSN=your_sentry_dsn
```

5. Add to frontend `.env.production`:
```env
VITE_SENTRY_DSN=your_sentry_dsn
```

---

## 🐛 TROUBLESHOOTING

### Backend won't start
- Check logs: `heroku logs --tail`
- Verify MongoDB connection string is correct
- Verify Redis URL is correct
- Check all environment variables are set

### Frontend can't connect to backend
- Verify VITE_API_URL is correct in frontend
- Verify CORS_ORIGIN is set in backend
- Check backend is running: visit `/health` endpoint
- Check browser console for errors

### Database connection fails
- Verify MongoDB connection string format
- Check IP whitelist in MongoDB Atlas (allow all: `0.0.0.0/0`)
- Verify username/password are correct
- Check network access settings

### Redis connection fails
- Verify Redis URL format: `redis://default:password@host:port`
- For Redis Cloud, ensure SSL/TLS if required
- Check Redis dashboard for connection limits

---

## 💰 COST ESTIMATES

### Free Tier (Perfect for Starting)
- **Heroku**: Free (dyno sleeps after 30 mins of inactivity)
- **Vercel**: Free (unlimited bandwidth, 100GB/month)
- **MongoDB Atlas**: Free (512MB storage)
- **Redis Cloud**: Free (30MB storage)
- **Total**: $0/month ✅

### Hobby Tier (For Real Traffic)
- **Heroku**: $7/month (hobby dyno, always on)
- **Vercel**: Free (enough for most apps)
- **MongoDB Atlas**: Free (enough for most apps)
- **Redis Cloud**: Free (enough for most apps)
- **Total**: ~$7/month

### Production Tier (For Serious Use)
- **Heroku**: $25-50/month (standard dyno + add-ons)
- **Vercel**: Free-$20/month
- **MongoDB Atlas**: $9-57/month (M10-M30 cluster)
- **Redis Cloud**: $7-50/month (250MB-1GB)
- **Total**: ~$50-150/month

---

## 📞 NEED HELP?

- Check `DEPLOYMENT.md` for detailed instructions
- Review `PRODUCTION_CHECKLIST.md` for complete checklist
- Check `TROUBLESHOOTING.md` for common issues
- Visit GitHub Issues for support

---

## 🎉 SUCCESS!

If you see your app live, congratulations! 🎊

Your Webhook Relay Service is now:
- ✅ Live on the internet
- ✅ Accessible via HTTPS
- ✅ Connected to production database
- ✅ Ready to handle webhooks
- ✅ Scalable and reliable

**Next Steps:**
1. Share with users
2. Monitor logs for errors
3. Set up monitoring (Sentry)
4. Plan your first marketing push
5. Celebrate! 🚀

---

Built with ❤️ by Richytech.inc
