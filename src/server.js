require('./observability/datadog');
const app = require('./app');
const config = require('./config');
const db = require('./database');
const redis = require('./lib/redis');
const server = app.listen(config.port, () => console.log(`API listening on :${config.port}`));
async function shutdown() { server.close(async () => { await Promise.allSettled([db.close(), redis.quit()]); process.exit(0); }); }
process.on('SIGTERM', shutdown); process.on('SIGINT', shutdown);
