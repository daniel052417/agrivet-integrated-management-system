const redis = require('redis');
const logger = require('./logger');

// Redis configuration
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  retryDelayOnFailover: 100,
  enableReadyCheck: false,
  maxRetriesPerRequest: null,
};

// Create Redis client
const client = redis.createClient(redisConfig);

// Handle Redis connection events
client.on('connect', () => {
  logger.info('Redis client connected');
});

client.on('ready', () => {
  logger.info('Redis client ready');
});

client.on('error', (err) => {
  logger.error('Redis client error:', err);
});

client.on('end', () => {
  logger.info('Redis client disconnected');
});

// Connect to Redis
client.connect().catch((err) => {
  logger.error('Failed to connect to Redis:', err);
});

// Cache helper functions
const cache = {
  // Set cache with TTL
  set: async (key, value, ttl = 3600) => {
    try {
      const serializedValue = JSON.stringify(value);
      await client.setEx(key, ttl, serializedValue);
      logger.debug(`Cache set: ${key}`);
    } catch (error) {
      logger.error('Cache set error:', error);
    }
  },

  // Get cache
  get: async (key) => {
    try {
      const value = await client.get(key);
      if (value) {
        logger.debug(`Cache hit: ${key}`);
        return JSON.parse(value);
      }
      logger.debug(`Cache miss: ${key}`);
      return null;
    } catch (error) {
      logger.error('Cache get error:', error);
      return null;
    }
  },

  // Delete cache
  del: async (key) => {
    try {
      await client.del(key);
      logger.debug(`Cache deleted: ${key}`);
    } catch (error) {
      logger.error('Cache delete error:', error);
    }
  },

  // Delete multiple keys
  delPattern: async (pattern) => {
    try {
      const keys = await client.keys(pattern);
      if (keys.length > 0) {
        await client.del(keys);
        logger.debug(`Cache deleted pattern: ${pattern}, keys: ${keys.length}`);
      }
    } catch (error) {
      logger.error('Cache delete pattern error:', error);
    }
  },

  // Check if key exists
  exists: async (key) => {
    try {
      const result = await client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Cache exists error:', error);
      return false;
    }
  },

  // Set hash field
  hset: async (key, field, value) => {
    try {
      await client.hSet(key, field, JSON.stringify(value));
      logger.debug(`Cache hash set: ${key}.${field}`);
    } catch (error) {
      logger.error('Cache hash set error:', error);
    }
  },

  // Get hash field
  hget: async (key, field) => {
    try {
      const value = await client.hGet(key, field);
      if (value) {
        logger.debug(`Cache hash hit: ${key}.${field}`);
        return JSON.parse(value);
      }
      logger.debug(`Cache hash miss: ${key}.${field}`);
      return null;
    } catch (error) {
      logger.error('Cache hash get error:', error);
      return null;
    }
  },

  // Get all hash fields
  hgetall: async (key) => {
    try {
      const hash = await client.hGetAll(key);
      const result = {};
      for (const [field, value] of Object.entries(hash)) {
        result[field] = JSON.parse(value);
      }
      return result;
    } catch (error) {
      logger.error('Cache hash get all error:', error);
      return {};
    }
  },

  // Delete hash field
  hdel: async (key, field) => {
    try {
      await client.hDel(key, field);
      logger.debug(`Cache hash deleted: ${key}.${field}`);
    } catch (error) {
      logger.error('Cache hash delete error:', error);
    }
  }
};

module.exports = {
  client,
  cache
};












