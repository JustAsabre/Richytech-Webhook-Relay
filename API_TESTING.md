# API Testing Guide
## Test authentication endpoints with cURL or Postman

## Prerequisites
- Server running on http://localhost:5000
- MongoDB and Redis connected

---

## 1. Health Check

```bash
curl http://localhost:5000/health
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2025-10-25T...",
  "environment": "development"
}
```

---

## 2. User Registration

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"test@example.com\",\"password\":\"password123\",\"fullName\":\"Test User\",\"company\":\"Test Company\"}"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Registration successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "data": {
    "user": {
      "_id": "...",
      "email": "test@example.com",
      "fullName": "Test User",
      "company": "Test Company",
      "role": "client",
      "subscriptionTier": "free",
      "webhookQuota": 1000,
      "webhookUsage": 0,
      "isActive": true,
      "emailVerified": false
    }
  }
}
```

---

## 3. User Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"test@example.com\",\"password\":\"password123\"}"
```

**Save the token from response!**

---

## 4. Get Current User (Protected Route)

```bash
curl http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 5. Update Profile

```bash
curl -X PUT http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d "{\"fullName\":\"Updated Name\",\"company\":\"New Company\"}"
```

---

## 6. Change Password

```bash
curl -X PUT http://localhost:5000/api/auth/change-password \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d "{\"currentPassword\":\"password123\",\"newPassword\":\"newpassword123\"}"
```

---

## 7. Logout

```bash
curl -X POST http://localhost:5000/api/auth/logout \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 8. Test Error Handling

### Invalid Email
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"invalid-email\",\"password\":\"password123\",\"fullName\":\"Test\"}"
```

**Expected:** 400 Bad Request with validation error

### Short Password
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"test2@example.com\",\"password\":\"123\",\"fullName\":\"Test\"}"
```

**Expected:** 400 Bad Request - Password must be at least 8 characters

### Duplicate Email
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"test@example.com\",\"password\":\"password123\",\"fullName\":\"Test\"}"
```

**Expected:** 409 Conflict - User already exists

### Wrong Password
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"test@example.com\",\"password\":\"wrongpassword\"}"
```

**Expected:** 401 Unauthorized - Invalid email or password

---

## 9. Test Rate Limiting

Run the login endpoint 6 times rapidly:

```bash
for i in {1..6}; do
  curl -X POST http://localhost:5000/api/auth/login \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"test@example.com\",\"password\":\"password123\"}"
  echo "\nAttempt $i"
done
```

**Expected:** After 5 attempts, you should get 429 Too Many Requests

---

## PowerShell Versions (Windows)

### Register
```powershell
$body = @{
    email = "test@example.com"
    password = "password123"
    fullName = "Test User"
    company = "Test Company"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/auth/register" -Method Post -Body $body -ContentType "application/json"
```

### Login
```powershell
$body = @{
    email = "test@example.com"
    password = "password123"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method Post -Body $body -ContentType "application/json"
$token = $response.token
Write-Host "Token: $token"
```

### Get Current User
```powershell
$headers = @{
    Authorization = "Bearer $token"
}

Invoke-RestMethod -Uri "http://localhost:5000/api/auth/me" -Method Get -Headers $headers
```

---

## Next Steps

After authentication works:
1. Test API key generation
2. Test endpoint creation
3. Test webhook receiving
4. Test webhook forwarding

---

## Useful MongoDB Commands (if needed)

```javascript
// Connect to MongoDB (mongo shell or Compass)
use webhook-relay

// View all users
db.users.find().pretty()

// Delete a test user
db.users.deleteOne({ email: "test@example.com" })

// View collections
show collections

// Count users
db.users.countDocuments()
```
