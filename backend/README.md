# Richytech Webhook Relay - Backend API

Production-ready webhook relay service built with Node.js, Express, MongoDB, and Redis.

## Features

- 🚀 Webhook receiving and forwarding
- 🔄 Automatic retry with exponential backoff
- 📊 Comprehensive webhook logging and analytics
- 🔐 Secure API key authentication
- 🔒 HMAC signature verification
- 📈 Multi-tier subscription management
- 💳 Paystack payment integration
- 📧 Email notifications via SendGrid
- 📚 Complete API documentation (Swagger)
- 🛡️ Enterprise-grade security

## Quick Start

### Prerequisites

- Node.js 18+ LTS
- MongoDB (local or Atlas)
- Redis (local or Redis Cloud)
- SendGrid account (free tier)
- Paystack account (for payments)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file from `.env.example`:
   ```bash
   cp .env.example .env
   ```

4. Update environment variables in `.env`

5. Start MongoDB and Redis (if running locally)

6. Run the application:
   ```bash
   # Development mode with auto-reload
   npm run dev

   # Production mode
   npm start

   # Start webhook worker (in separate terminal)
   npm run worker
   ```

7. Create admin user (first time only):
   ```bash
   npm run seed
   ```

## API Documentation

Once the server is running, visit:
- Swagger UI: `http://localhost:5000/api-docs`
- Health check: `http://localhost:5000/health`

## Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration files
│   ├── models/          # Mongoose models
│   ├── controllers/     # Route controllers
│   ├── middleware/      # Custom middleware
│   ├── routes/          # Express routes
│   ├── services/        # Business logic
│   ├── workers/         # Background workers
│   ├── utils/           # Utility functions
│   └── app.js           # Express app setup
├── logs/                # Application logs
├── .env                 # Environment variables
├── .env.example         # Environment template
├── package.json         # Dependencies
└── server.js            # Entry point
```

## Environment Variables

See `.env.example` for all required environment variables.

Critical variables:
- `MONGODB_URI` - MongoDB connection string
- `REDIS_URL` - Redis connection string
- `JWT_SECRET` - Secret for JWT tokens
- `API_KEY_SECRET` - Secret for API key hashing
- `SENDGRID_API_KEY` - SendGrid API key
- `PAYSTACK_SECRET_KEY` - Paystack secret key

## Deployment

### Render.com (Recommended)

1. Push code to GitHub
2. Create new Web Service on Render
3. Connect your GitHub repository
4. Configure:
   - Build Command: `npm install`
   - Start Command: `npm start`
5. Add environment variables
6. Deploy

### Worker Process

Deploy a separate worker service on Render:
- Start Command: `npm run worker`
- Use same environment variables

## Security Features

- JWT authentication
- API key hashing (bcrypt)
- HMAC webhook signatures
- Rate limiting
- Input validation and sanitization
- NoSQL injection prevention
- Security headers (Helmet.js)
- CORS protection

## Support

For issues or questions:
- Email: support@richytech.inc
- Documentation: [API Docs](http://localhost:5000/api-docs)

## License

MIT License - Richytech.inc

---

Built with ❤️ by Richytech.inc
