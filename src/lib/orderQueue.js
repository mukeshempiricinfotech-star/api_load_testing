const { Queue } = require('bullmq');
const redis = require('./redis');
module.exports = new Queue('order-confirmations', { connection: redis });
