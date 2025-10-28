# DEVELOPMENT PLAN
## Richytech.inc Webhook Relay Service

**Created:** October 25, 2025  
**Developer:** Senior Full Stack Engineer  
**Approach:** MVP-First, Iterative Development

---

## CODING PLAN - PHASE 1 (MVP)

### STEP 1: PROJECT INITIALIZATION (Backend)
**Time Estimate:** 30 minutes

#### Actions:
1. Initialize Node.js project
   ```
   - package.json with dependencies
   - .env.example file
   - .gitignore file
   - Folder structure setup
   ```

2. Install Core Dependencies:
   ```json
   {
     "express": "^4.18.2",
     "mongoose": "^8.0.0",
     "redis": "^4.6.0",
     "bull": "^4.11.0",
     "bcryptjs": "^2.4.3",
     "jsonwebtoken": "^9.0.2",
     "joi": "^17.11.0",
     "helmet": "^7.1.0",
     "cors": "^2.8.5",
     "dotenv": "^16.3.1",
     "winston": "^3.11.0",
     "morgan": "^1.10.0",
     "express-rate-limit": "^7.1.5",
     "express-async-errors": "^3.1.1",
     "crypto": "built-in"
   }
   ```

3. Folder Structure:
   ```
   backend/
   ├── src/
   │   ├── config/          # Configuration files
   │   │   ├── database.js
   │   │   ├── redis.js
   │   │   └── constants.js
   │   ├── models/          # Mongoose models
   │   │   ├── User.js
   │   │   ├── ApiKey.js
   │   │   ├── Endpoint.js
   │   │   ├── WebhookLog.js
   │   │   └── Subscription.js
   │   ├── controllers/     # Route controllers
   │   │   ├── authController.js
   │   │   ├── endpointController.js
   │   │   ├── webhookController.js
   │   │   ├── apiKeyController.js
   │   │   ├── analyticsController.js
   │   │   └── adminController.js
   │   ├── middleware/      # Custom middleware
   │   │   ├── auth.js
   │   │   ├── validateApiKey.js
   │   │   ├── errorHandler.js
   │   │   ├── rateLimiter.js
   │   │   └── validator.js
   │   ├── routes/          # Express routes
   │   │   ├── auth.js
   │   │   ├── endpoints.js
   │   │   ├── webhooks.js
   │   │   ├── apiKeys.js
   │   │   ├── analytics.js
   │   │   └── admin.js
   │   ├── services/        # Business logic
   │   │   ├── webhookService.js
   │   │   ├── retryService.js
   │   │   ├── emailService.js
   │   │   ├── paymentService.js
   │   │   └── cryptoService.js
   │   ├── workers/         # Background workers
   │   │   └── webhookWorker.js
   │   ├── utils/           # Utility functions
   │   │   ├── logger.js
   │   │   ├── validators.js
   │   │   └── helpers.js
   │   └── app.js           # Express app setup
   ├── .env.example
   ├── .gitignore
   ├── package.json
   └── server.js            # Entry point
   ```

#### Verification:
- [ ] Project initializes without errors
- [ ] All dependencies install successfully
- [ ] Folder structure created correctly

---

### STEP 2: DATABASE MODELS & CONFIGURATION
**Time Estimate:** 1 hour

#### Actions:
1. Setup MongoDB connection (config/database.js)
2. Setup Redis connection (config/redis.js)
3. Create Mongoose models:
   - User.js (with indexes on email, subscriptionTier)
   - ApiKey.js (with index on key)
   - Endpoint.js (with indexes on userId, isActive)
   - WebhookLog.js (with TTL index on expiresAt)
   - Subscription.js
4. Add model validation and hooks
5. Create initial seed data script (for admin user)

#### Verification:
- [ ] MongoDB connects successfully
- [ ] Redis connects successfully
- [ ] All models defined with proper schemas
- [ ] Indexes created
- [ ] Seed script creates admin user

---

### STEP 3: AUTHENTICATION SYSTEM
**Time Estimate:** 2 hours

#### Actions:
1. Implement JWT token generation/verification
2. Create auth middleware (middleware/auth.js)
3. Create auth controller:
   - POST /api/auth/register
   - POST /api/auth/login
   - POST /api/auth/logout
   - POST /api/auth/forgot-password (basic)
4. Implement password hashing (bcrypt)
5. Create auth routes
6. Add input validation (Joi)
7. Add rate limiting for auth endpoints

#### Verification:
- [ ] User can register with valid email/password
- [ ] User can login and receive JWT
- [ ] Invalid credentials rejected
- [ ] Passwords properly hashed
- [ ] JWT verification works
- [ ] Rate limiting prevents brute force

---

### STEP 4: API KEY MANAGEMENT
**Time Estimate:** 1.5 hours

#### Actions:
1. Create API key generation service (cryptoService.js)
2. Implement API key validation middleware
3. Create API key controller:
   - GET /api/keys (list keys)
   - POST /api/keys (generate new)
   - DELETE /api/keys/:id (revoke)
4. Hash API keys before storage
5. Track last used timestamp

#### Verification:
- [ ] API keys generated securely (32+ characters)
- [ ] Keys properly hashed in database
- [ ] Middleware validates API keys
- [ ] Invalid keys rejected
- [ ] Keys can be revoked

---

### STEP 5: WEBHOOK ENDPOINT MANAGEMENT
**Time Estimate:** 2 hours

#### Actions:
1. Create endpoint controller:
   - GET /api/endpoints (list all)
   - POST /api/endpoints (create)
   - GET /api/endpoints/:id (get details)
   - PUT /api/endpoints/:id (update)
   - DELETE /api/endpoints/:id (delete)
2. Generate webhook URLs with format: /webhook/:userId/:endpointId
3. Generate HMAC secret for each endpoint
4. Implement endpoint validation (URL format, etc.)
5. Enforce quota limits (max endpoints per tier)

#### Verification:
- [ ] User can create webhook endpoints
- [ ] Each endpoint gets unique URL
- [ ] HMAC secret generated automatically
- [ ] Validation prevents invalid URLs
- [ ] Quota limits enforced
- [ ] User can update/delete endpoints

---

### STEP 6: WEBHOOK RECEIVING & FORWARDING (PRIORITY #1)
**Time Estimate:** 3 hours

#### Actions:
1. Create webhook receiving endpoint:
   - POST /webhook/:userId/:endpointId
2. Implement webhook validation:
   - Verify user exists and is active
   - Verify endpoint exists and is active
   - Check quota limits
3. Log incoming webhook to database
4. Setup Bull queue for processing
5. Create webhook worker (webhookWorker.js):
   - Forward webhook to destination URL
   - Include custom headers
   - Generate HMAC signature
   - Timeout handling (30 seconds)
6. Log response and update webhook record
7. Handle errors gracefully

#### Verification:
- [ ] Webhook received at unique URL
- [ ] Payload logged to database
- [ ] Webhook queued for processing
- [ ] Worker forwards to destination
- [ ] HMAC signature included in headers
- [ ] Response logged correctly
- [ ] Errors handled without crashes

---

### STEP 7: RETRY LOGIC WITH EXPONENTIAL BACKOFF (PRIORITY #2)
**Time Estimate:** 2 hours

#### Actions:
1. Implement retry service (retryService.js)
2. Define retry schedule:
   - Attempt 1: Immediate
   - Attempt 2: +1 minute
   - Attempt 3: +5 minutes
   - Attempt 4: +15 minutes
   - Attempt 5: +1 hour
   - Attempt 6: +6 hours
3. Update webhook worker to use retry logic
4. Track retry attempts in webhook log
5. Mark webhook as 'failed' after max retries
6. Implement manual retry endpoint:
   - POST /api/webhooks/:id/retry

#### Verification:
- [ ] Failed webhooks automatically retry
- [ ] Retry intervals match schedule
- [ ] Each attempt logged separately
- [ ] Webhooks marked failed after 6 attempts
- [ ] Manual retry works from API
- [ ] No duplicate processing

---

### STEP 8: WEBHOOK LOGGING & ANALYTICS (PRIORITY #3)
**Time Estimate:** 2.5 hours

#### Actions:
1. Create webhook log viewer endpoints:
   - GET /api/webhooks (list with pagination)
   - GET /api/webhooks/:id (get details)
2. Implement filtering:
   - By date range
   - By status (success, pending, failed)
   - By endpoint
3. Create analytics endpoints:
   - GET /api/analytics/overview
   - GET /api/analytics/webhooks (volume over time)
   - GET /api/analytics/success-rate
4. Implement TTL for log cleanup (based on tier)
5. Add export functionality (JSON format)

#### Verification:
- [ ] All webhooks visible in logs
- [ ] Pagination works correctly
- [ ] Filtering returns accurate results
- [ ] Analytics calculations correct
- [ ] Old logs auto-delete based on tier
- [ ] Export downloads valid JSON

---

### STEP 9: RATE LIMITING & SECURITY
**Time Estimate:** 1.5 hours

#### Actions:
1. Implement rate limiting middleware:
   - Per endpoint limits based on tier
   - Global API limits
   - Auth endpoint limits (stricter)
2. Add Helmet.js security headers
3. Implement CORS configuration
4. Add input sanitization
5. Prevent NoSQL injection
6. Add request logging (Morgan)
7. Setup Winston logger for errors

#### Verification:
- [ ] Rate limits enforced correctly
- [ ] Security headers present
- [ ] CORS allows frontend origin
- [ ] Malicious inputs rejected
- [ ] All requests logged
- [ ] Errors logged to file

---

### STEP 10: ERROR HANDLING & VALIDATION
**Time Estimate:** 1 hour

#### Actions:
1. Create global error handler middleware
2. Define custom error classes:
   - ValidationError
   - AuthenticationError
   - QuotaExceededError
   - NotFoundError
3. Implement Joi validation schemas for all endpoints
4. Add proper HTTP status codes
5. Format error responses consistently:
   ```json
   {
     "success": false,
     "error": {
       "code": "VALIDATION_ERROR",
       "message": "Invalid email format",
       "details": [...]
     }
   }
   ```

#### Verification:
- [ ] All errors caught and handled
- [ ] Validation errors return 400
- [ ] Auth errors return 401
- [ ] Not found returns 404
- [ ] Server errors return 500
- [ ] Error format consistent

---

### STEP 11: FRONTEND PROJECT INITIALIZATION
**Time Estimate:** 45 minutes

#### Actions:
1. Create React app with Vite:
   ```bash
   npm create vite@latest frontend -- --template react
   ```
2. Install dependencies:
   ```json
   {
     "react": "^18.2.0",
     "react-dom": "^18.2.0",
     "react-router-dom": "^6.20.0",
     "axios": "^1.6.2",
     "tailwindcss": "^3.3.5",
     "@headlessui/react": "^1.7.17",
     "@heroicons/react": "^2.0.18",
     "recharts": "^2.10.0",
     "react-hot-toast": "^2.4.1",
     "date-fns": "^2.30.0"
   }
   ```
3. Setup Tailwind CSS
4. Create folder structure:
   ```
   frontend/
   ├── src/
   │   ├── components/      # Reusable components
   │   │   ├── common/      # Buttons, inputs, etc.
   │   │   ├── layout/      # Header, sidebar, etc.
   │   │   └── dashboard/   # Dashboard-specific
   │   ├── pages/           # Page components
   │   │   ├── Login.jsx
   │   │   ├── Register.jsx
   │   │   ├── Dashboard.jsx
   │   │   ├── Endpoints.jsx
   │   │   ├── WebhookLogs.jsx
   │   │   ├── Analytics.jsx
   │   │   ├── ApiKeys.jsx
   │   │   └── Settings.jsx
   │   ├── services/        # API calls
   │   │   ├── api.js
   │   │   ├── authService.js
   │   │   ├── endpointService.js
   │   │   └── webhookService.js
   │   ├── context/         # React Context
   │   │   └── AuthContext.jsx
   │   ├── hooks/           # Custom hooks
   │   │   └── useAuth.js
   │   ├── utils/           # Utilities
   │   │   └── helpers.js
   │   ├── App.jsx
   │   └── main.jsx
   ├── public/
   ├── index.html
   ├── package.json
   └── tailwind.config.js
   ```

#### Verification:
- [ ] Vite dev server runs
- [ ] Tailwind CSS working
- [ ] Routing configured
- [ ] Folder structure created

---

### STEP 12: AUTHENTICATION UI
**Time Estimate:** 2 hours

#### Actions:
1. Create Login page
2. Create Register page
3. Implement AuthContext (JWT storage)
4. Create ProtectedRoute component
5. Setup axios interceptors for auth token
6. Create auth service (API calls)
7. Add form validation
8. Add loading states and error handling

#### Verification:
- [ ] User can register via UI
- [ ] User can login via UI
- [ ] JWT stored in localStorage
- [ ] Protected routes redirect to login
- [ ] Axios includes auth header
- [ ] Form validation works
- [ ] Error messages displayed

---

### STEP 13: DASHBOARD HOME PAGE
**Time Estimate:** 2 hours

#### Actions:
1. Create Dashboard layout (sidebar + main)
2. Create stats cards:
   - Total webhooks (today, this month)
   - Success rate
   - Active endpoints
   - Quota usage
3. Create recent webhooks table
4. Add loading skeletons
5. Fetch data from analytics API
6. Style with Tailwind CSS

#### Verification:
- [ ] Dashboard displays stats
- [ ] Recent webhooks shown
- [ ] Data refreshes on load
- [ ] Responsive design
- [ ] Loading states work

---

### STEP 14: ENDPOINTS MANAGEMENT UI
**Time Estimate:** 2.5 hours

#### Actions:
1. Create Endpoints page
2. Create endpoint list table
3. Create "New Endpoint" modal/form
4. Implement create endpoint functionality
5. Add edit endpoint modal
6. Add delete confirmation
7. Display webhook URL with copy button
8. Show endpoint status (active/inactive toggle)
9. Add test endpoint feature

#### Verification:
- [ ] Endpoints listed correctly
- [ ] User can create new endpoint
- [ ] User can edit endpoint
- [ ] User can delete endpoint
- [ ] Copy URL button works
- [ ] Test endpoint sends test webhook

---

### STEP 15: WEBHOOK LOGS VIEWER UI
**Time Estimate:** 2.5 hours

#### Actions:
1. Create WebhookLogs page
2. Create logs table with columns:
   - Timestamp
   - Endpoint name
   - Status (badge)
   - Response time
   - Retry count
   - Actions
3. Implement pagination
4. Add filtering:
   - Date range picker
   - Status filter
   - Endpoint filter
5. Create webhook detail modal:
   - Full payload
   - All attempts
   - Response details
6. Add manual retry button
7. Add export button

#### Verification:
- [ ] All webhooks displayed
- [ ] Pagination works
- [ ] Filters work correctly
- [ ] Detail modal shows full info
- [ ] Manual retry works
- [ ] Export downloads file

---

### STEP 16: API KEYS MANAGEMENT UI
**Time Estimate:** 1.5 hours

#### Actions:
1. Create ApiKeys page
2. List existing API keys (masked)
3. Show last used timestamp
4. Create "Generate New Key" button
5. Display new key in modal (one-time view)
6. Add revoke key functionality
7. Add key naming feature

#### Verification:
- [ ] API keys listed
- [ ] User can generate new key
- [ ] New key shown once (copy button)
- [ ] User can revoke keys
- [ ] Revoked keys disappear

---

### STEP 17: ANALYTICS PAGE
**Time Estimate:** 2 hours

#### Actions:
1. Create Analytics page
2. Add date range selector
3. Create charts using Recharts:
   - Webhook volume over time (line chart)
   - Success vs failed (pie chart)
   - Response time distribution (bar chart)
   - Endpoints usage (bar chart)
4. Add summary cards
5. Fetch data from analytics API
6. Add loading states

#### Verification:
- [ ] Charts render correctly
- [ ] Date range filter works
- [ ] Data visualized accurately
- [ ] Responsive on mobile

---

### STEP 18: SETTINGS PAGE
**Time Estimate:** 1 hour

#### Actions:
1. Create Settings page
2. Add profile section (update name, email)
3. Add change password section
4. Add notification preferences
5. Show current subscription tier
6. Add API calls for updates

#### Verification:
- [ ] User can update profile
- [ ] Password change works
- [ ] Current tier displayed
- [ ] Updates saved to backend

---

### STEP 19: API DOCUMENTATION (PRIORITY #4)
**Time Estimate:** 2 hours

#### Actions:
1. Install Swagger dependencies:
   ```
   npm i swagger-jsdoc swagger-ui-express
   ```
2. Create swagger.js configuration
3. Add JSDoc comments to all routes
4. Define Swagger schemas for models
5. Add authentication to Swagger UI
6. Create /api-docs endpoint
7. Write integration guide with code examples:
   - Node.js example
   - Python example
   - PHP example
   - cURL examples
8. Document HMAC signature verification

#### Verification:
- [ ] Swagger UI accessible at /api-docs
- [ ] All endpoints documented
- [ ] Try-it-out feature works
- [ ] Code examples accurate
- [ ] HMAC guide clear

---

### STEP 20: EMAIL NOTIFICATIONS (PRIORITY #6)
**Time Estimate:** 2 hours

#### Actions:
1. Install SendGrid:
   ```
   npm i @sendgrid/mail
   ```
2. Create emailService.js
3. Create email templates:
   - Welcome email
   - Webhook failure alert
   - Weekly summary
   - Password reset
4. Implement email sending functions
5. Add email triggers:
   - After registration
   - After max retries failed
   - Weekly summary (cron job)
6. Setup cron job for weekly emails

#### Verification:
- [ ] Welcome email sent on registration
- [ ] Failure alerts sent correctly
- [ ] Weekly summary sent (test manually)
- [ ] Emails render properly
- [ ] No errors in SendGrid

---

### STEP 21: ADMIN PANEL (Manual Onboarding)
**Time Estimate:** 2 hours

#### Actions:
1. Create admin middleware (check role === 'admin')
2. Create admin controller:
   - POST /api/admin/users (create client)
   - GET /api/admin/users (list all)
   - PUT /api/admin/users/:id/subscription
   - PUT /api/admin/users/:id/quota
3. Create admin routes
4. Create admin UI pages:
   - User list
   - Create user form
   - Edit user modal
5. Generate temporary password for new users
6. Send credentials via email

#### Verification:
- [ ] Admin can create users
- [ ] Admin can set subscription tier
- [ ] Admin can adjust quota
- [ ] User receives credentials email
- [ ] Non-admin users blocked from admin routes

---

### STEP 22: TESTING & BUG FIXES
**Time Estimate:** 3 hours

#### Actions:
1. Test all API endpoints with Postman
2. Test webhook receiving and forwarding
3. Test retry logic with failing endpoint
4. Test quota enforcement
5. Test rate limiting
6. Test authentication flows
7. Test frontend forms and validation
8. Test responsive design on mobile
9. Fix any bugs found
10. Test error scenarios

#### Verification:
- [ ] All endpoints return expected responses
- [ ] Webhooks forward successfully
- [ ] Retries work as expected
- [ ] Quota blocks when exceeded
- [ ] Rate limits enforced
- [ ] Auth flows secure
- [ ] UI works on mobile
- [ ] No console errors

---

### STEP 23: DEPLOYMENT PREPARATION
**Time Estimate:** 2 hours

#### Actions:
1. Create production environment variables
2. Setup MongoDB Atlas production cluster
3. Setup Redis Cloud instance
4. Create Render.com account
5. Configure Render web service:
   - Link GitHub repo
   - Set environment variables
   - Configure build command
   - Configure start command
6. Configure Render static site (frontend):
   - Build command: npm run build
   - Publish directory: dist
7. Test production build locally
8. Create deployment documentation

#### Verification:
- [ ] MongoDB Atlas cluster created
- [ ] Redis Cloud instance created
- [ ] Environment variables set on Render
- [ ] Production build successful
- [ ] No hardcoded secrets in code

---

### STEP 24: DEPLOYMENT TO RENDER
**Time Estimate:** 1 hour

#### Actions:
1. Push code to GitHub
2. Deploy backend to Render
3. Deploy frontend to Render
4. Verify MongoDB connection
5. Verify Redis connection
6. Test API endpoints in production
7. Test webhook receiving in production
8. Configure custom domain (if available)
9. Test SSL certificate
10. Monitor logs for errors

#### Verification:
- [ ] Backend deployed successfully
- [ ] Frontend deployed successfully
- [ ] API accessible via HTTPS
- [ ] Database connections working
- [ ] Webhooks processing correctly
- [ ] No deployment errors
- [ ] SSL active

---

### STEP 25: FINAL TESTING & LAUNCH
**Time Estimate:** 2 hours

#### Actions:
1. Create test client account
2. Generate API key
3. Create webhook endpoint
4. Send test webhooks
5. Verify forwarding
6. Test retry with failed endpoint
7. Verify email notifications
8. Test manual onboarding as admin
9. Load test with 100 concurrent webhooks
10. Create launch checklist and verify all items

#### Verification:
- [ ] End-to-end flow works perfectly
- [ ] Performance acceptable under load
- [ ] All features functional
- [ ] Documentation complete
- [ ] Ready for first clients

---

## PHASE 2: MONETIZATION (Post-MVP)

### STEP 26: PAYSTACK INTEGRATION
**Time Estimate:** 4 hours

#### Actions:
1. Install Paystack SDK
2. Create payment service
3. Implement endpoints:
   - POST /api/subscriptions/initialize
   - POST /api/subscriptions/verify
   - POST /api/webhooks/paystack
4. Create subscription plans in Paystack dashboard
5. Implement payment UI in frontend
6. Handle payment success/failure
7. Update user subscription on payment
8. Implement quota enforcement

#### Verification:
- [ ] Payment initialization works
- [ ] Payment verification works
- [ ] Webhook confirms payment
- [ ] Subscription activated
- [ ] Quota updated correctly

---

### STEP 27: SUBSCRIPTION MANAGEMENT
**Time Estimate:** 3 hours

#### Actions:
1. Create subscription upgrade/downgrade logic
2. Implement cancellation
3. Handle failed payments
4. Send payment reminder emails
5. Add billing history page
6. Add invoice generation
7. Implement grace period for failed payments

#### Verification:
- [ ] Users can upgrade/downgrade
- [ ] Cancellation works correctly
- [ ] Failed payments handled
- [ ] Invoices generated
- [ ] Grace period enforced

---

## TOTAL ESTIMATED TIME: 48-52 hours (6-7 working days)

---

## DAILY PROGRESS TRACKING

### Day 1: Foundation
- [ ] Steps 1-4 (Project setup, models, auth, API keys)

### Day 2: Core Webhook Functionality
- [ ] Steps 5-7 (Endpoints, webhook receiving, retry logic)

### Day 3: Logging & Security
- [ ] Steps 8-10 (Logging, analytics, security, error handling)

### Day 4: Frontend Foundation
- [ ] Steps 11-14 (Frontend setup, auth UI, dashboard, endpoints UI)

### Day 5: Frontend Features
- [ ] Steps 15-18 (Logs viewer, API keys, analytics, settings)

### Day 6: Documentation & Polish
- [ ] Steps 19-21 (API docs, email, admin panel)

### Day 7: Testing & Deployment
- [ ] Steps 22-25 (Testing, deployment, launch)

---

## PHASE 2 TIMELINE (Monetization)

### Week 2:
- [ ] Steps 26-27 (Paystack integration, subscription management)

---

**Status:** Ready to begin coding  
**Next Action:** Execute Step 1 - Project Initialization

