# 🚀 QUICK START: Database Setup for Webhook Relay

## Current Status: ⏸️ PAUSED - Waiting for Database Setup

---

## 📝 **What You Need:**

1. **MongoDB Atlas** connection string
2. **Redis Cloud** connection string

---

## 🎯 **FASTEST PATH TO TESTING** (Choose One):

### **Option A: Full Setup (15-20 minutes)**
Set up both MongoDB Atlas and Redis Cloud following the `CLOUD_SETUP_GUIDE.md`

### **Option B: Quick Test (5 minutes)** ⭐ RECOMMENDED FOR NOW
1. Set up **MongoDB Atlas only** (5 min)
2. Skip Redis for now (we'll add it before testing webhooks)
3. Comment out Redis in the code temporarily

### **Option C: Local Setup**
Install MongoDB and Redis locally on your machine

---

## 🏃 **LET'S DO OPTION B (QUICKEST):**

### Step 1: MongoDB Atlas Setup (5 minutes)

**1.1. Create Account:**
- Go to: https://www.mongodb.com/cloud/atlas/register
- Click "Sign up with Google" or use email
- Verify your email if needed

**1.2. Create FREE Cluster:**
- Click "Create" or "Build a Database"
- Select **"M0 FREE"** tier (should be selected by default)
- Cloud Provider: **AWS**
- Region: Pick **Europe (Ireland)** or **Frankfurt** (closest to Ghana)
- Cluster Name: `webhook-relay-dev`
- Click **"Create Cluster"** (takes 3-5 minutes to provision)

**1.3. Create Database User:**
While cluster is creating:
- Left sidebar: Click **"Database Access"**
- Click **"Add New Database User"**
- Authentication: **Password**
- Username: `webhook_admin`
- Click **"Autogenerate Secure Password"** - **COPY THIS PASSWORD!**
- Built-in Role: **"Atlas admin"**
- Click **"Add User"**

**1.4. Allow Network Access:**
- Left sidebar: Click **"Network Access"**
- Click **"Add IP Address"**
- Click **"Allow Access from Anywhere"**
- Confirm: `0.0.0.0/0`
- Click **"Confirm"**

**1.5. Get Connection String:**
- Left sidebar: Click **"Database"**
- Wait until cluster status is **"Active"** (green)
- Click **"Connect"** button
- Choose **"Connect your application"**
- Driver: **Node.js**
- Version: **5.5 or later**
- Copy the connection string (it looks like):
  ```
  mongodb+srv://webhook_admin:<password>@webhook-relay-dev.xxxxx.mongodb.net/?retryWrites=true&w=majority
  ```

**1.6. Modify Connection String:**
- Replace `<password>` with the password you copied
- Add `/webhook-relay` before the `?`:
  ```
  mongodb+srv://webhook_admin:YOUR_PASSWORD@webhook-relay-dev.xxxxx.mongodb.net/webhook-relay?retryWrites=true&w=majority
  ```

---

### Step 2: Update .env File

Open: `backend/.env`

Replace this line:
```env
MONGODB_URI=mongodb://localhost:27017/webhook-relay
```

With your MongoDB Atlas connection string:
```env
MONGODB_URI=mongodb+srv://webhook_admin:YOUR_PASSWORD@webhook-relay-dev.xxxxx.mongodb.net/webhook-relay?retryWrites=true&w=majority
```

**For Redis**, temporarily use this (local Redis, won't connect but won't crash):
```env
REDIS_URL=redis://localhost:6379
```

---

### Step 3: Test MongoDB Connection

Run this command in PowerShell:

```powershell
cd "c:\Users\asabr\OneDrive\Desktop\Freelance\Webhook Relay\backend"
npm run test:db
```

**Expected Output:**
```
✅ MongoDB: Connected successfully!
❌ Redis: Connection failed! (This is OK for now)
```

If MongoDB shows ✅, you're ready to test authentication!

---

### Step 4: Start the Server

```powershell
npm start
```

**Expected Output:**
```
✓ MongoDB connected successfully
[Redis might show error - OK for now]
✓ Server running on port 5000
```

---

### Step 5: Test Authentication API

Open a new PowerShell window and run:

```powershell
# Test 1: Health Check
Invoke-RestMethod -Uri "http://localhost:5000/health"

# Test 2: Register a User
$body = @{
    email = "test@example.com"
    password = "password123"
    fullName = "Test User"
    company = "Test Company"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/register" -Method Post -Body $body -ContentType "application/json"
$response

# Save the token
$token = $response.token
Write-Host "✅ Token saved: $token"

# Test 3: Get Current User (Protected Route)
$headers = @{ Authorization = "Bearer $token" }
Invoke-RestMethod -Uri "http://localhost:5000/api/auth/me" -Method Get -Headers $headers
```

---

## ✅ **SUCCESS CRITERIA:**

If you see:
- ✅ User registered successfully
- ✅ JWT token received
- ✅ User profile retrieved with `/api/auth/me`

**Then authentication is working!** 🎉

---

## 🆘 **TROUBLESHOOTING:**

### MongoDB won't connect:
- Check your password doesn't have special characters (use alphanumeric)
- Make sure IP whitelist has `0.0.0.0/0`
- Wait 5 minutes for cluster to fully activate

### "User already exists" error:
- This means it worked! The user was created previously
- Try a different email address

### Server won't start:
- Make sure you saved the `.env` file
- Check for typos in connection string
- Make sure port 5000 isn't in use

---

## 📞 **READY FOR NEXT STEPS?**

Once authentication works:
1. ✅ Tell me "authentication works"
2. I'll help set up Redis Cloud (3 minutes)
3. We'll continue building the webhook system

---

## ⏭️ **SKIP REDIS FOR NOW?**

If you want to keep testing without Redis:
- I can modify the code to make Redis optional
- You can set up Redis later when we test the queue
- Let me know and I'll make this change

---

**Current Step:** Waiting for you to set up MongoDB Atlas and test authentication 🎯
