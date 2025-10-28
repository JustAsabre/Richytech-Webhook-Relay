/**
 * Redis Configuration
 * Redis client setup for caching and Bull queue
 */

const redis = require('redis');
const logger = require('../utils/logger');

// Create Redis client
const redisClient = redis.createClient({
  url: process.env.REDIS_URL,
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        logger.error('Redis reconnection failed after 10 attempts');
        return new Error('Max reconnection attempts reached');
      }
      const delay = Math.min(retries * 100, 3000);
      logger.warn(`Redis reconnecting in ${delay}ms...`);
      return delay;
    },
  },
});

// Error handling
redisClient.on('error', (err) => {
  logger.error(`Redis Client Error: ${err.message}`);
});

redisClient.on('connect', () => {
  logger.info('Redis client connecting...');
});

redisClient.on('ready', () => {
  logger.info('Redis client connected and ready');
});

redisClient.on('reconnecting', () => {
  logger.warn('Redis client reconnecting...');
});

redisClient.on('end', () => {
  logger.warn('Redis client disconnected');
});

/**
 * Connect to Redis
 */
const connectRedis = async () => {
  try {
    await redisClient.connect();
    logger.info('Redis connection established');
    return redisClient;
  } catch (error) {
    logger.error(`Error connecting to Redis: ${error.message}`);
    logger.warn('⚠️  Redis is optional for authentication testing. Continuing without Redis...');
    logger.warn('⚠️  You will need Redis for webhook queue processing.');
    return null;
  }
};

/**
 * Graceful shutdown
 */
process.on('SIGINT', async () => {
  await redisClient.quit();
  logger.info('Redis connection closed through app termination');
});

module.exports = {
  redisClient,
  connectRedis,
};
