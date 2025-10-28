# Product Requirements Document (PRD)
## Richytech.inc Webhook Relay Service

**Version:** 1.0.0  
**Date:** October 25, 2025  
**Status:** In Development  
**Target Market:** Ghana (Initial), International (Phase 2)

---

## 1. EXECUTIVE SUMMARY

### Product Vision
Build a production-ready, enterprise-grade webhook relay service that provides reliable webhook receiving, forwarding, transformation, and monitoring capabilities for businesses in Ghana and beyond.

### Business Objectives
- Launch MVP within development timeline
- Enable businesses to reliably manage webhooks without infrastructure overhead
- Generate revenue through tiered subscription model
- Scale to international markets in Phase 2

---

## 2. TECHNOLOGY STACK

### Backend
- **Runtime:** Node.js 18+ LTS
- **Framework:** Express.js
- **Language:** JavaScript (with JSDoc for type safety)
- **API Style:** RESTful API

### Frontend
- **Framework:** React 18+
- **Build Tool:** Vite
- **State Management:** React Context API + Hooks
- **UI Library:** Tailwind CSS + shadcn/ui components
- **HTTP Client:** Axios

### Database & Caching
- **Primary Database:** MongoDB Atlas (Free tier M0)
- **Cache/Queue:** Redis Cloud (Free tier 30MB)
- **ODM:** Mongoose

### Infrastructure
- **Hosting:** Render.com (Free tier initially)
- **File Storage:** MongoDB GridFS (for logs)
- **Email Service:** SendGrid (Free tier - 100 emails/day)
- **Payment:** Paystack (Ghana)

### Security
- API Key authentication
- HMAC webhook signature verification
- Rate limiting (express-rate-limit)
- Helmet.js for security headers
- Input validation (Joi/express-validator)
- MongoDB injection prevention

### Monitoring & Logging
- Winston (structured logging)
- Morgan (HTTP request logging)
- Custom health check endpoints
- Error tracking (basic error logs)

---

## 3. CORE FEATURES (MVP - TIER 1 & 2)

### 3.1 Webhook Receiving & Forwarding (PRIORITY #1)
**User Story:** As a client, I want to receive webhooks at a unique URL and have them automatically forwarded to my destination endpoint.

**Acceptance Criteria:**
- Client gets unique webhook URL: `https://api.richytech.inc/webhook/{client_id}/{endpoint_id}`
- Service accepts POST requests with any JSON payload
- Service forwards webhook to client's configured destination URL
- Supports custom headers in forwarded requests
- Returns appropriate HTTP status codes (200, 400, 500)
- Handles concurrent webhooks efficiently

**Technical Specifications:**
```javascript
// Webhook Flow:
1. Receive webhook at /webhook/:clientId/:endpointId
2. Validate client exists and is active
3. Log incoming webhook to database
4. Queue webhook for processing (Redis Bull queue)
5. Worker processes queue → forwards to destination
6. Log response status and update webhook record
7. Trigger retry logic if failed
```

### 3.2 Retry Logic with Exponential Backoff (PRIORITY #2)
**User Story:** As a client, I want failed webhooks to be automatically retried so I don't lose data.

**Acceptance Criteria:**
- Failed webhooks automatically retry up to 5 times
- Exponential backoff: 1min, 5min, 15min, 1hr, 6hr
- Stop retrying after 5 failed attempts
- Mark webhook as "failed" after max retries
- Allow manual retry from dashboard
- Log each retry attempt

**Technical Specifications:**
```javascript
// Retry Schedule:
Attempt 1: Immediate
Attempt 2: +1 minute
Attempt 3: +5 minutes  
Attempt 4: +15 minutes
Attempt 5: +1 hour
Attempt 6: +6 hours (final)
```

### 3.3 Webhook Logging & Analytics (PRIORITY #3)
**User Story:** As a client, I want to see all webhooks sent to my endpoints with full details.

**Acceptance Criteria:**
- Log every incoming webhook (headers, payload, timestamp)
- Log every forwarding attempt (status, response, duration)
- Store logs for 30 days (Starter tier)
- Provide webhook statistics (success rate, avg response time)
- Search/filter webhooks by date, status, endpoint
- Export webhook logs (JSON/CSV)

**Data Model:**
```javascript
WebhookLog {
  _id: ObjectId,
  clientId: ObjectId,
  endpointId: ObjectId,
  incomingPayload: Object,
  incomingHeaders: Object,
  receivedAt: Date,
  attempts: [{
    attemptNumber: Number,
    attemptedAt: Date,
    responseStatus: Number,
    responseBody: String,
    responseTime: Number,
    success: Boolean
  }],
  status: 'success' | 'pending' | 'failed',
  retryCount: Number,
  lastAttemptAt: Date
}
```

### 3.4 API Documentation (PRIORITY #4)
**User Story:** As a developer, I need clear documentation to integrate with the webhook relay service.

**Deliverables:**
- Swagger/OpenAPI 3.0 specification
- Interactive API explorer (Swagger UI)
- Code examples (Node.js, Python, PHP, cURL)
- Authentication guide
- Webhook signature verification guide
- Error code reference
- Postman collection

**Documentation Sections:**
1. Getting Started
2. Authentication (API Keys)
3. Creating Webhook Endpoints
4. Receiving Webhooks
5. Webhook Signatures (HMAC)
6. Retry Logic
7. Rate Limits
8. Error Handling
9. Code Examples
10. FAQs

### 3.5 Client Dashboard (PRIORITY #5)
**User Story:** As a client, I need a web dashboard to manage my webhooks and view analytics.

**Pages:**
1. **Login/Register** - Email/password authentication
2. **Dashboard Home** - Overview stats (total webhooks, success rate, recent activity)
3. **Endpoints** - Manage webhook endpoints (create, edit, delete, get URLs)
4. **Webhook Logs** - View all webhooks with filtering
5. **Analytics** - Charts and graphs (daily volume, success rates)
6. **API Keys** - Generate and revoke API keys
7. **Settings** - Profile, notifications, billing
8. **Documentation** - Link to API docs

**Key Features:**
- Real-time webhook updates (polling every 5s)
- Manual retry button for failed webhooks
- Copy webhook URL to clipboard
- Test webhook endpoint tool
- Success/failure rate charts
- Export logs functionality

### 3.6 Email Notifications (PRIORITY #6)
**User Story:** As a client, I want email alerts when webhooks fail so I can take action.

**Notification Types:**
1. **Webhook Failure Alert** - Sent after max retries exhausted
2. **Weekly Summary** - Total webhooks, success rate, failures
3. **Account Notifications** - Password reset, new API key, etc.

**SendGrid Templates:**
- Transactional emails (failures, alerts)
- Marketing emails (weekly summaries)
- Free tier: 100 emails/day (sufficient for MVP)

---

## 4. TIER 3 FEATURES (Monetization Phase)

### 4.1 Payment Integration - Paystack (PRIORITY #7)
**Implementation:**
- Paystack Standard integration
- Support: Mobile Money (MTN, Vodafone, AirtelTigo), Cards, Bank Transfer
- Webhook verification for payment confirmations
- Subscription management (create, upgrade, downgrade, cancel)
- Failed payment handling

### 4.2 Multi-Tier Subscription Management (PRIORITY #8)
**Tiers:**
```
FREE TIER:
- 1,000 webhooks/month
- 3-day log retention
- 2 endpoints
- Basic support (email)
- Manual retry only

STARTER: GH₵ 50/month
- 10,000 webhooks/month
- 30-day log retention
- 10 endpoints
- Email support (24hr response)
- Automatic retries
- Email notifications

BUSINESS: GH₵ 150/month
- 50,000 webhooks/month
- 90-day log retention
- 50 endpoints
- Priority email support (4hr response)
- Advanced analytics
- Custom retry logic
- Webhook filtering

ENTERPRISE: Custom pricing
- Unlimited webhooks
- Unlimited retention
- Unlimited endpoints
- Dedicated support
- SLA guarantees (99.9% uptime)
- Custom integrations
- Webhook transformation
```

**Quota Enforcement:**
- Track monthly webhook count per client
- Block webhooks when quota exceeded
- Send warning emails at 80%, 90%, 100%
- Auto-upgrade prompts

---

## 5. TIER 4 FEATURES (Growth Phase)

### 5.1 Advanced Filtering/Transformation (PRIORITY #9)
- JSONPath filtering
- Payload transformation (map, filter, enrich)
- Conditional forwarding rules
- Custom JavaScript transformations (sandboxed)

### 5.2 Custom Domain Support (PRIORITY #10)
- CNAME configuration
- SSL certificate automation (Let's Encrypt)
- Enterprise feature only

---

## 6. DATA MODELS

### 6.1 User Schema
```javascript
{
  _id: ObjectId,
  email: String (unique, required),
  password: String (hashed, required),
  fullName: String,
  company: String,
  phone: String,
  role: 'client' | 'admin',
  subscriptionTier: 'free' | 'starter' | 'business' | 'enterprise',
  subscriptionStatus: 'active' | 'cancelled' | 'past_due',
  subscriptionEndsAt: Date,
  paystackCustomerCode: String,
  webhookQuota: Number,
  webhookUsage: Number,
  resetDate: Date,
  emailVerified: Boolean,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### 6.2 API Key Schema
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  key: String (hashed, unique),
  name: String,
  lastUsedAt: Date,
  isActive: Boolean,
  createdAt: Date
}
```

### 6.3 Webhook Endpoint Schema
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  name: String,
  description: String,
  destinationUrl: String (required),
  secret: String (for HMAC signature),
  customHeaders: Object,
  isActive: Boolean,
  retryConfig: {
    maxRetries: Number,
    retryIntervals: [Number]
  },
  createdAt: Date,
  updatedAt: Date
}
```

### 6.4 Webhook Log Schema
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  endpointId: ObjectId (ref: Endpoint),
  incomingPayload: Object,
  incomingHeaders: Object,
  receivedAt: Date,
  attempts: [{
    attemptNumber: Number,
    attemptedAt: Date,
    requestHeaders: Object,
    responseStatus: Number,
    responseBody: String,
    responseTime: Number,
    errorMessage: String,
    success: Boolean
  }],
  status: String, // 'success', 'pending', 'failed'
  retryCount: Number,
  lastAttemptAt: Date,
  expiresAt: Date // TTL index for auto-deletion
}
```

### 6.5 Subscription Schema
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  tier: String,
  status: String,
  paystackSubscriptionCode: String,
  amount: Number,
  currency: String,
  startDate: Date,
  nextBillingDate: Date,
  cancelledAt: Date,
  createdAt: Date
}
```

---

## 7. API ENDPOINTS

### 7.1 Authentication
- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password
- `GET /api/auth/verify-email/:token` - Verify email

### 7.2 Webhook Endpoints
- `GET /api/endpoints` - List all endpoints
- `POST /api/endpoints` - Create endpoint
- `GET /api/endpoints/:id` - Get endpoint details
- `PUT /api/endpoints/:id` - Update endpoint
- `DELETE /api/endpoints/:id` - Delete endpoint
- `POST /api/endpoints/:id/test` - Test endpoint

### 7.3 Webhooks (Receiving)
- `POST /webhook/:userId/:endpointId` - Receive webhook
- `GET /api/webhooks` - List webhook logs
- `GET /api/webhooks/:id` - Get webhook details
- `POST /api/webhooks/:id/retry` - Manual retry

### 7.4 API Keys
- `GET /api/keys` - List API keys
- `POST /api/keys` - Generate new key
- `DELETE /api/keys/:id` - Revoke key

### 7.5 Analytics
- `GET /api/analytics/overview` - Dashboard stats
- `GET /api/analytics/webhooks` - Webhook volume over time
- `GET /api/analytics/success-rate` - Success rate metrics

### 7.6 Subscriptions
- `GET /api/subscriptions/plans` - List available plans
- `POST /api/subscriptions/initialize` - Initialize Paystack payment
- `POST /api/subscriptions/verify` - Verify payment
- `POST /api/subscriptions/cancel` - Cancel subscription
- `POST /api/webhooks/paystack` - Paystack webhook handler

### 7.7 Admin (Manual Onboarding)
- `POST /api/admin/users` - Create user manually
- `PUT /api/admin/users/:id/subscription` - Set subscription
- `GET /api/admin/users` - List all users
- `PUT /api/admin/users/:id/quota` - Adjust quota

---

## 8. SECURITY IMPLEMENTATION

### 8.1 Authentication & Authorization
- JWT tokens (httpOnly cookies + localStorage)
- API key validation (Bearer token)
- Role-based access control (client, admin)
- Password hashing (bcrypt, 10 rounds)

### 8.2 Webhook Security
- HMAC signature generation (SHA256)
- Signature verification on client side
- Timestamp validation (prevent replay attacks)
- IP whitelisting (Enterprise feature)

### 8.3 Rate Limiting
```javascript
// Per endpoint limits:
Free: 10 req/min per endpoint
Starter: 50 req/min per endpoint
Business: 200 req/min per endpoint
Enterprise: 1000 req/min per endpoint
```

### 8.4 Input Validation
- Sanitize all inputs
- Validate email, URL, JSON formats
- Prevent NoSQL injection
- XSS protection (Helmet.js)
- CORS configuration

---

## 9. DEPLOYMENT STRATEGY

### 9.1 Environment Setup
```
Development: Local machine
Staging: Render.com (separate service)
Production: Render.com
```

### 9.2 Environment Variables
```
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb+srv://...
REDIS_URL=redis://...
JWT_SECRET=...
API_KEY_SECRET=...
WEBHOOK_SIGNING_SECRET=...
PAYSTACK_SECRET_KEY=...
PAYSTACK_PUBLIC_KEY=...
SENDGRID_API_KEY=...
SENDGRID_FROM_EMAIL=...
CLIENT_URL=https://app.richytech.inc
API_URL=https://api.richytech.inc
```

### 9.3 Deployment Checklist
- [ ] All tests passing
- [ ] Environment variables configured
- [ ] MongoDB Atlas production cluster
- [ ] Redis Cloud instance connected
- [ ] SSL certificate active
- [ ] API documentation published
- [ ] Monitoring enabled
- [ ] Error alerts configured
- [ ] Backup strategy tested
- [ ] Load tested (1000 concurrent webhooks)
- [ ] Security audit completed

---

## 10. PHASE 2 - FUTURE ITERATIONS

### 10.1 Advanced Features
- Webhook transformation/filtering
- Custom domain support
- GraphQL API
- Webhook scheduling (delayed delivery)
- Webhook batching
- Multi-region support
- Advanced analytics (cohort analysis)

### 10.2 Integrations
- Zapier integration
- Slack notifications
- Discord webhooks
- SMS alerts (Twilio)
- PagerDuty integration

### 10.3 International Expansion
- Multi-currency support
- Flutterwave integration
- Stripe integration (global)
- GDPR compliance features
- Multi-language support

---

## 11. SUCCESS METRICS

### MVP Success Criteria
- [ ] 10 paying customers within first month
- [ ] 99% webhook delivery success rate
- [ ] < 500ms average processing time
- [ ] Zero data loss
- [ ] < 24hr support response time

### KPIs to Track
- Monthly recurring revenue (MRR)
- Customer acquisition cost (CAC)
- Churn rate
- Average webhooks per customer
- System uptime %
- API response time (p95, p99)

---

## 12. DEVELOPMENT TIMELINE

### Week 1: Foundation
- [ ] Project setup (backend + frontend)
- [ ] Database models
- [ ] Authentication system
- [ ] API key generation

### Week 2: Core Functionality
- [ ] Webhook receiving endpoint
- [ ] Webhook forwarding logic
- [ ] Redis queue setup
- [ ] Retry logic implementation

### Week 3: Logging & Dashboard
- [ ] Webhook logging system
- [ ] React dashboard (basic pages)
- [ ] Endpoint management UI
- [ ] Webhook log viewer

### Week 4: Polish & Launch Prep
- [ ] API documentation (Swagger)
- [ ] Email notifications
- [ ] Testing & bug fixes
- [ ] Deployment to Render
- [ ] Admin panel for manual onboarding

### Week 5: Monetization
- [ ] Paystack integration
- [ ] Subscription management
- [ ] Quota enforcement
- [ ] Payment webhooks

---

## 13. SUPPORT & MAINTENANCE

### Documentation Requirements
- API documentation (Swagger)
- Integration guide (with code examples)
- Video tutorials (Loom)
- FAQ section
- Troubleshooting guide

### Support Channels
- Email: support@richytech.inc
- Dashboard chat widget (future)
- Status page (future)

### Legal Documents
- Terms of Service
- Privacy Policy
- SLA Agreement
- Data Processing Agreement (DPA)

---

## 14. BRANDING

**Company Name:** Richytech.inc  
**Service Name:** Webhook Relay (or "Richytech Webhook Relay")  
**Tagline:** "Reliable Webhook Delivery, Simplified"

**Color Scheme (Professional & Modern):**
- Primary: #2563eb (Blue 600) - Trust, technology
- Secondary: #10b981 (Green 500) - Success, reliability
- Accent: #f59e0b (Amber 500) - Attention, alerts
- Dark: #1e293b (Slate 800) - Text, backgrounds
- Light: #f8fafc (Slate 50) - Backgrounds

**Logo:** User has logo (to be integrated)

---

## 15. RISK MITIGATION

### Technical Risks
- **MongoDB Atlas quota:** Monitor usage, upgrade plan when needed
- **Redis memory limit:** Implement queue cleanup, use TTL
- **Render free tier limits:** Budget for paid tier ($7/month)
- **SendGrid email limit:** Batch emails, use triggers wisely

### Business Risks
- **Low adoption:** Focus on marketing, Ghana tech communities
- **High churn:** Excellent support, reliable service
- **Payment failures:** Clear communication, grace period

---

**Document Owner:** Development Team  
**Last Updated:** October 25, 2025  
**Next Review:** Post-MVP Launch

---

## APPENDIX A: Manual Client Onboarding Process

### Steps to Manually Onboard a Client:
1. Access admin panel: `/admin/users`
2. Click "Create New Client"
3. Enter client details:
   - Email
   - Full name
   - Company name
   - Phone number
   - Initial subscription tier
4. System generates:
   - Password (send via email)
   - API key (provide to client)
   - Welcome email
5. Set custom quota if needed
6. Client receives:
   - Login credentials
   - API key
   - Getting started guide
   - Support contact

### Admin API Example:
```bash
POST /api/admin/users
Authorization: Bearer {admin_token}

{
  "email": "client@example.com",
  "fullName": "John Doe",
  "company": "ABC Corp",
  "phone": "+233 24 123 4567",
  "subscriptionTier": "starter",
  "webhookQuota": 10000
}
```

Response includes temporary password and API key to send to client.

---

**END OF PRD**
