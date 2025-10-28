/**
 * Server Entry Point
 * Starts the Express server and connects to database
 */

require('dotenv').config();

const app = require('./src/app');
const connectDB = require('./src/config/database');
const { connectRedis } = require('./src/config/redis');
const logger = require('./src/utils/logger');

const PORT = process.env.PORT || 5000;

// Start webhook worker (processes queued webhooks)
require('./src/services/webhookWorker');

// Connect to database and start server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    logger.info('✓ MongoDB connected successfully');

    // Connect to Redis (optional for now)
    const redisConnected = await connectRedis();
    if (redisConnected) {
      logger.info('✓ Redis connected successfully');
    } else {
      logger.warn('⚠️  Redis not connected (OK for authentication testing)');
    }

    // Start Express server
    const server = app.listen(PORT, () => {
      logger.info(`✓ Server running on port ${PORT}`);
      logger.info(`✓ Environment: ${process.env.NODE_ENV}`);
      logger.info(`✓ Health check: http://localhost:${PORT}/health`);
      logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      logger.info('🚀 Richytech Webhook Relay Server Started');
      logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal) => {
      logger.info(`\n${signal} received. Starting graceful shutdown...`);
      
      server.close(async () => {
        logger.info('✓ HTTP server closed');
        
        try {
          const mongoose = require('mongoose');
          await mongoose.connection.close();
          logger.info('✓ MongoDB connection closed');
          
          const { redisClient } = require('./src/config/redis');
          await redisClient.quit();
          logger.info('✓ Redis connection closed');
          
          logger.info('✓ Graceful shutdown completed');
          process.exit(0);
        } catch (error) {
          logger.error('Error during shutdown:', error);
          process.exit(1);
        }
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      gracefulShutdown('UNCAUGHT_EXCEPTION');
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      gracefulShutdown('UNHANDLED_REJECTION');
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();
