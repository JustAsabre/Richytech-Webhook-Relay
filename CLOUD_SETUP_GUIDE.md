# Quick Setup Guide - Cloud Databases (Free Tier)

## 1. MongoDB Atlas Setup (Free - M0 Cluster)

### Step 1: Create Account
1. Go to https://www.mongodb.com/cloud/atlas/register
2. Sign up with email or Google
3. Choose "Free" tier (M0 Cluster)

### Step 2: Create Cluster
1. Click "Build a Database"
2. Select "M0 Free" tier
3. Choose cloud provider: **AWS**
4. Choose region: **Closest to Ghana** (e.g., Europe Frankfurt or Ireland)
5. Cluster name: `webhook-relay-dev`
6. Click "Create"

### Step 3: Create Database User
1. Go to "Database Access" in left sidebar
2. Click "Add New Database User"
3. Authentication Method: Password
4. Username: `webhook_admin`
5. Password: **Generate a secure password** (save it!)
6. Database User Privileges: "Atlas admin"
7. Click "Add User"

### Step 4: Allow Network Access
1. Go to "Network Access" in left sidebar
2. Click "Add IP Address"
3. Click "Allow Access from Anywhere" (for development)
   - IP Address: `0.0.0.0/0`
   - Comment: "Development access"
4. Click "Confirm"

### Step 5: Get Connection String
1. Go to "Database" in left sidebar
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Driver: Node.js
5. Version: 5.5 or later
6. Copy the connection string:
   ```
   mongodb+srv://webhook_admin:<password>@webhook-relay-dev.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
7. Replace `<password>` with your actual password
8. Add database name before `?`: 
   ```
   mongodb+srv://webhook_admin:YOUR_PASSWORD@webhook-relay-dev.xxxxx.mongodb.net/webhook-relay?retryWrites=true&w=majority
   ```

### Step 6: Update .env File
```env
MONGODB_URI=mongodb+srv://webhook_admin:YOUR_PASSWORD@webhook-relay-dev.xxxxx.mongodb.net/webhook-relay?retryWrites=true&w=majority
```

---

## 2. Redis Cloud Setup (Free - 30MB)

### Step 1: Create Account
1. Go to https://redis.com/try-free/
2. Sign up with email or Google
3. Choose "Free" plan (30MB, 30 connections)

### Step 2: Create Database
1. After login, you'll see "Create database"
2. Click "New subscription"
3. Choose:
   - Cloud Provider: **AWS**
   - Region: **Closest to you** (or Europe)
   - Type: **Free** (30MB)
4. Click "Create subscription"

### Step 3: Create Database
1. Click "New database"
2. Database name: `webhook-relay-dev`
3. Click "Activate database"

### Step 4: Get Connection Details
1. Click on your database name
2. You'll see:
   - Public endpoint: `redis-xxxxx.xxx.redislabs.com:12345`
   - Default user password: (click "eye" icon to view)
3. Connection string format:
   ```
   redis://default:YOUR_PASSWORD@redis-xxxxx.xxx.redislabs.com:12345
   ```

### Step 5: Update .env File
```env
REDIS_URL=redis://default:YOUR_PASSWORD@redis-xxxxx.xxx.redislabs.com:12345
```

---

## 3. Test Connection

After updating `.env` file:

```bash
cd backend
npm start
```

You should see:
```
✓ MongoDB connected successfully
✓ Redis connected successfully
✓ Server running on port 5000
```

---

## 4. Alternative: Local Development (If you want to install locally)

### MongoDB Local
```bash
# Windows (using Chocolatey)
choco install mongodb

# Or download from: https://www.mongodb.com/try/download/community
# Start MongoDB:
mongod
```

### Redis Local
```bash
# Windows (using Chocolatey)
choco install redis-64

# Or use WSL:
wsl
sudo apt update
sudo apt install redis-server
redis-server
```

---

## 5. Next Steps

Once connected:
1. Server should start successfully
2. Test health endpoint: http://localhost:5000/health
3. Test authentication (I'll provide test commands)

---

**Note:** The free tiers are sufficient for development and initial production use:
- MongoDB Atlas Free: 512 MB storage, shared CPU/RAM
- Redis Cloud Free: 30 MB storage, 30 connections

When ready to scale, you can upgrade without changing code.
