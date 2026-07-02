const Redis = require('ioredis');
const { redisUrl } = require('../config');

const redis = new Redis(redisUrl, { maxRetriesPerRequest: null, enableReadyCheck: false });
redis.on('error', (error) => console.error('Redis connection error', error.message));
module.exports = redis;
