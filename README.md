# 🚀 Webhook Relay Service

A production-ready, scalable webhook relay service built with Node.js, React, and TypeScript. Receive, queue, and reliably deliver webhooks with advanced features like automatic retries, analytics, and comprehensive monitoring.

![Version](https://img.shields.io/badge/version-0.8.8-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-green.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

## ✨ Features

### Core Functionality
- 🔄 **Reliable Webhook Delivery** - Queue-based processing with automatic retries
- 🔐 **Secure API Keys** - Generate and manage API keys with one-time display
- 📊 **Real-time Analytics** - Comprehensive charts and insights
- 🎯 **Endpoint Management** - Create, configure, and test webhook endpoints
- 📝 **Webhook Logs** - Detailed delivery history with filtering and pagination
- ⚡ **Queue Processing** - Redis-backed Bull queue for high throughput
- 🔒 **HMAC Signatures** - Secure webhook verification
- 🔁 **Smart Retries** - Exponential backoff with configurable intervals

### Advanced Features
- 📈 **Analytics Dashboard** - Line, Area, Bar, and Pie charts
- ⚙️ **Settings Management** - Profile, security, and subscription settings
- 🎨 **Modern UI** - React with TypeScript, Tailwind CSS, and Heroicons
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile
- 🔔 **Toast Notifications** - Real-time user feedback
- 🚦 **Rate Limiting** - Protect against abuse
- 📊 **Quota Management** - Track usage with visual indicators
- 🔍 **Advanced Filtering** - Search and filter across all data

## 🏗️ Architecture

```
┌─────────────────┐
│   React SPA     │  Frontend (Port 5173)
│   (Vite)        │  - TypeScript + React 18
└────────┬────────┘  - Tailwind CSS + Heroicons
         │           - Recharts for analytics
         │
    ┌────▼────┐
    │  Nginx  │      Reverse Proxy (Production)
    └────┬────┘
         │
┌────────▼────────┐
│  Express API    │  Backend (Port 5000)
│  (Node.js)      │  - RESTful API
└────────┬────────┘  - JWT Authentication
         │           - Input Validation
         │
    ┌────▼────────────┐
    │  MongoDB Atlas  │  Database
    │  Redis Cloud    │  Queue & Cache
    └─────────────────┘
```

## 📋 Prerequisites

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **MongoDB** (Atlas or local)
- **Redis** (Cloud or local)

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/webhook-relay.git
cd webhook-relay
```

### 2. Backend Setup

```bash
cd backend
npm install

# Create .env file
cp .env.example .env

# Edit .env with your configuration
# Required: MONGODB_URI, REDIS_URL, JWT_SECRET

# Start backend server
npm run dev
```

Backend will run on `http://localhost:5000`

### 3. Frontend Setup

```bash
cd frontend
npm install

# Start frontend dev server
npm run dev
```

Frontend will run on `http://localhost:5173`

### 4. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000/api
- **Default Test User**: `test@example.com` / `Test@123456`

## 🔧 Configuration

### Backend Environment Variables

```env
# Server
NODE_ENV=development
PORT=5000

# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/webhookrelay

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d

# Webhook
WEBHOOK_TIMEOUT=30000
MAX_RETRIES=3
RETRY_INTERVALS=60000,300000,900000

# Rate Limiting
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100
```

### Frontend Environment Variables

```env
VITE_API_URL=http://localhost:5000
```

## 📚 API Documentation

### Authentication

#### Register User
```bash
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123",
  "fullName": "John Doe"
}
```

#### Login
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123"
}
```

### Endpoints Management

#### Create Endpoint
```bash
POST /api/endpoints
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "My Webhook Endpoint",
  "destination": "https://myapp.com/webhook",
  "retryConfig": {
    "maxRetries": 3,
    "retryIntervals": [60000, 300000, 900000]
  }
}
```

#### Send Webhook
```bash
POST /webhook/:endpointId
X-API-Key: rty_live_xxxxxxxxxxxxxxxx
Content-Type: application/json

{
  "event": "user.created",
  "data": {
    "userId": "123",
    "email": "newuser@example.com"
  }
}
```

### API Keys

#### Generate API Key
```bash
POST /api/keys
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Production API Key"
}
```

### Analytics

#### Get Dashboard Stats
```bash
GET /api/analytics/stats
Authorization: Bearer <token>
```

#### Get Webhook Volume
```bash
GET /api/analytics/volume?days=30
Authorization: Bearer <token>
```

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test

# With coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

### Test Results
- ✅ 21/21 tests passing (100%)
- ✅ 50 concurrent webhooks stress test
- ✅ HMAC signature verification
- ✅ Retry logic with exponential backoff

## 📊 Project Structure

```
webhook-relay/
├── backend/
│   ├── src/
│   │   ├── config/          # Configuration files
│   │   ├── controllers/     # Request handlers
│   │   ├── middleware/      # Express middleware
│   │   ├── models/          # MongoDB models
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   ├── utils/           # Utilities
│   │   └── server.js        # Entry point
│   ├── tests/               # Test files
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── contexts/        # React contexts
│   │   ├── pages/           # Page components
│   │   ├── services/        # API services
│   │   └── App.tsx          # Root component
│   └── package.json
├── CHANGELOG.md             # Version history
└── README.md                # This file
```

## 🎨 Technology Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose ODM)
- **Cache/Queue**: Redis + Bull
- **Authentication**: JWT (jsonwebtoken)
- **Validation**: Joi
- **Testing**: Jest + Supertest
- **Logging**: Winston
- **HTTP Client**: Axios

### Frontend
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite 7
- **Styling**: Tailwind CSS 3.4
- **Icons**: Heroicons 2
- **Charts**: Recharts 3
- **Routing**: React Router 6
- **HTTP**: Axios
- **Notifications**: React Hot Toast
- **Date**: date-fns 4

## 🔒 Security Features

- ✅ JWT-based authentication
- ✅ Password hashing with bcrypt
- ✅ HMAC signature verification
- ✅ Rate limiting (100 requests/15 minutes)
- ✅ Input validation with Joi
- ✅ CORS protection
- ✅ Helmet security headers
- ✅ MongoDB injection prevention
- ✅ XSS protection
- ✅ API key masking in UI

## 📈 Performance

- ⚡ Redis-backed queue processing
- ⚡ Parallel API calls in frontend
- ⚡ Optimized database indexes
- ⚡ Connection pooling
- ⚡ Response caching
- ⚡ Lazy loading components
- ⚡ Code splitting with Vite

## 🚀 Deployment

### Backend Deployment (Production)

```bash
cd backend

# Install dependencies
npm ci --production

# Build if needed
npm run build

# Set environment to production
export NODE_ENV=production

# Start with PM2
pm2 start src/server.js --name webhook-relay-api
pm2 save
```

### Frontend Deployment

```bash
cd frontend

# Build for production
npm run build

# Output will be in dist/
# Serve with nginx, Apache, or any static host
```

### Docker Deployment (Optional)

```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# View logs
docker-compose logs -f
```

## 📝 Environment-Specific Configurations

### Development
- Hot reloading enabled
- Detailed error messages
- Debug logging
- CORS open for localhost

### Production
- Minified bundles
- Error tracking (Sentry recommended)
- Production logging
- CORS restricted to domain
- HTTPS required
- Rate limiting enforced

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Built with ❤️ by Richytech.inc
- Inspired by modern webhook delivery services
- Icons by Heroicons
- Charts by Recharts

## 📞 Support

- **Email**: support@richytech.inc
- **Documentation**: [Link to docs]
- **Issues**: [GitHub Issues](https://github.com/yourusername/webhook-relay/issues)

## 🗺️ Roadmap

- [x] Core webhook relay functionality
- [x] Authentication & authorization
- [x] Dashboard with analytics
- [x] Endpoint management
- [x] API key management
- [x] Advanced analytics charts
- [x] Settings & profile management
- [ ] Email notifications
- [ ] Webhook transformations
- [ ] Custom domains
- [ ] Admin panel
- [ ] Two-factor authentication
- [ ] Billing integration
- [ ] Webhook replay
- [ ] GraphQL API

---

**Version**: 0.8.8  
**Last Updated**: October 26, 2025  
**Status**: Production Ready ✅
