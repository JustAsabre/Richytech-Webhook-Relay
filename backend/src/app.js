/**
 * Express Application Setup
 * Configures middleware, routes, and error handling
 */

require('dotenv').config();
require('express-async-errors'); // Automatically catch async errors

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const mongoSanitize = require('express-mongo-sanitize');

const logger = require('./utils/logger');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');

// Create Express app
const app = express();

// Trust proxy - Required for Fly.io, Vercel, and other reverse proxies
app.set('trust proxy', 1);

// Security middleware
app.use(helmet()); // Security headers
app.use(mongoSanitize()); // Prevent NoSQL injection

// CORS configuration
const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000'
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps, curl, Postman)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);

// Body parser middleware
app.use(express.json({ limit: '10mb' })); // Parse JSON payloads
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Parse URL-encoded payloads

// HTTP request logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', { stream: logger.stream }));
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// API rate limiter (apply to all API routes)
app.use('/api', apiLimiter);

// Routes
const authRoutes = require('./routes/auth');
const apiKeyRoutes = require('./routes/apiKeys');
const endpointRoutes = require('./routes/endpoints');
const webhookRoutes = require('./routes/webhooks');
const webhookReceiverRoutes = require('./routes/webhookReceiver');
const analyticsRoutes = require('./routes/analytics');

app.use('/api/auth', authRoutes);
app.use('/api/keys', apiKeyRoutes);
app.use('/api/endpoints', endpointRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/webhook', webhookReceiverRoutes); // Public webhook receiver (no /api prefix)

// 404 handler (must be after all routes)
app.use(notFound);

// Global error handler (must be last)
app.use(errorHandler);

module.exports = app;
