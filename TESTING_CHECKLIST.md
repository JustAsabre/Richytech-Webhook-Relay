# ✅ DATABASE SETUP & TESTING CHECKLIST

## 📋 Step-by-Step Guide

### ☐ Step 1: MongoDB Atlas Setup (5 minutes)
- [ ] Go to https://www.mongodb.com/cloud/atlas/register
- [ ] Create account or login
- [ ] Create FREE M0 cluster (name: `webhook-relay-dev`)
- [ ] Create database user:
  - Username: `webhook_admin`
  - Password: (autogenerate and save it!)
- [ ] Add IP whitelist: `0.0.0.0/0` (allow from anywhere)
- [ ] Wait for cluster to be "Active" (green status)
- [ ] Get connection string
- [ ] Replace `<password>` with your password
- [ ] Add `/webhook-relay` before the `?`

**Your connection string should look like:**
```
mongodb+srv://webhook_admin:YOUR_PASSWORD@webhook-relay-dev.xxxxx.mongodb.net/webhook-relay?retryWrites=true&w=majority
```

---

### ☐ Step 2: Update .env File
- [ ] Open `backend/.env`
- [ ] Update `MONGODB_URI` with your connection string
- [ ] Save the file

---

### ☐ Step 3: Test Database Connection
Run in PowerShell:
```powershell
cd "c:\Users\asabr\OneDrive\Desktop\Freelance\Webhook Relay\backend"
npm run test:db
```

**Expected:**
- ✅ MongoDB: Connected successfully!
- ❌ Redis: Connection failed (OK - we'll add this later)

---

### ☐ Step 4: Create Admin User
Run in PowerShell:
```powershell
npm run seed
```

**Expected:**
```
✅ Admin user created successfully!
Email: admin@richytech.inc
Password: Admin@123456
```

**Save these credentials!**

---

### ☐ Step 5: Start Server
Run in PowerShell:
```powershell
npm start
```

**Expected output:**
```
✓ MongoDB connected successfully
⚠️ Redis not connected (OK for authentication testing)
✓ Server running on port 5000
🚀 Richytech Webhook Relay Server Started
```

**If server starts successfully, continue to Step 6!**

---

### ☐ Step 6: Test Health Endpoint
Open **NEW** PowerShell window:
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/health"
```

**Expected:**
```
success    : True
message    : Server is running
timestamp  : 2025-10-25T...
environment: development
```

✅ If you see this, the server is working!

---

### ☐ Step 7: Test User Registration
```powershell
$body = @{
    email = "test@example.com"
    password = "password123"
    fullName = "Test User"
    company = "Test Company"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/register" -Method Post -Body $body -ContentType "application/json"
$response
```

**Expected output:**
```
success : True
message : Registration successful
token   : eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
data    : @{user=...}
```

✅ **If you see a token, registration works!**

**Save the token:**
```powershell
$token = $response.token
```

---

### ☐ Step 8: Test Login
```powershell
$loginBody = @{
    email = "test@example.com"
    password = "password123"
} | ConvertTo-Json

$loginResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
$token = $loginResponse.token
Write-Host "Token: $token"
```

✅ **If you get a new token, login works!**

---

### ☐ Step 9: Test Protected Route (Get Current User)
```powershell
$headers = @{
    Authorization = "Bearer $token"
}

Invoke-RestMethod -Uri "http://localhost:5000/api/auth/me" -Method Get -Headers $headers
```

**Expected output:**
```
success : True
data    : @{user=@{_id=...; email=test@example.com; fullName=Test User; ...}}
```

✅ **If you see your user data, authentication is fully working!**

---

### ☐ Step 10: Test Admin Login
```powershell
$adminBody = @{
    email = "admin@richytech.inc"
    password = "Admin@123456"
} | ConvertTo-Json

$adminResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method Post -Body $adminBody -ContentType "application/json"
$adminToken = $adminResponse.token
Write-Host "Admin Token: $adminToken"
```

✅ **If admin login works, you're ready for manual client onboarding!**

---

## 🎉 SUCCESS CHECKLIST

If all these work:
- ✅ MongoDB connected
- ✅ Server starts
- ✅ Health check responds
- ✅ User registration works
- ✅ Login works
- ✅ Protected routes work (with JWT)
- ✅ Admin login works

**Then authentication system is 100% functional!**

---

## 🆘 Common Issues & Solutions

### Issue: "User already exists"
**Solution:** User was already created. Try:
- Use a different email, OR
- Delete the user from MongoDB and try again

### Issue: "Invalid token"
**Solution:** 
- Make sure you saved the token from registration/login
- Token format: `Bearer eyJhbGciOiJIUzI1...`

### Issue: MongoDB connection timeout
**Solution:**
- Check password (no special characters)
- Check IP whitelist (0.0.0.0/0)
- Wait 5 minutes for cluster activation

### Issue: Port 5000 already in use
**Solution:**
```powershell
# Stop the process using port 5000
Get-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess | Stop-Process -Force

# Or change PORT in .env file
```

---

## 📊 Verify in MongoDB Compass (Optional)

1. Download MongoDB Compass: https://www.mongodb.com/products/compass
2. Connect using your connection string
3. Database: `webhook-relay`
4. Collection: `users`
5. You should see 2 users:
   - test@example.com (role: client)
   - admin@richytech.inc (role: admin)

---

## ✅ NEXT STEPS

Once all tests pass, reply with:
**"Authentication works!"**

Then I'll:
1. Help you set up Redis Cloud (3 minutes)
2. Continue building the webhook system
3. Test the complete flow

---

**Current Status:** ⏸️ Waiting for database setup and authentication testing

**Estimated Time:** 10-15 minutes total
