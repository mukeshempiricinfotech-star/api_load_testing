const path = require('node:path');
require('dotenv').config({ path: path.join(process.cwd(), '.env') });

function required(name, fallback) {
  const value = process.env[name] || fallback;
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

module.exports = {
  env: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 3000),
  databaseUrl: required('DATABASE_URL', 'postgres://postgres:postgres@localhost:5432/api_load_testing'),
  redisUrl: required('REDIS_URL', 'redis://localhost:6379'),
  jwtAccessSecret: required('JWT_ACCESS_SECRET', 'dev-only-access-secret-change-me'),
  jwtRefreshSecret: required('JWT_REFRESH_SECRET', 'dev-only-refresh-secret-change-me'),
  jwtAccessTtl: process.env.JWT_ACCESS_TTL || '15m',
  jwtRefreshTtl: process.env.JWT_REFRESH_TTL || '7d',
  stripeSecretKey: required('STRIPE_SECRET_KEY', 'sk_test_replace_me'),
  stripeCurrency: process.env.STRIPE_CURRENCY || 'usd',
  serviceName: process.env.DD_SERVICE || 'api-load-testing',
  serviceVersion: process.env.DD_VERSION || '1.0.0',
  datadogMetricsEnabled: process.env.DD_METRICS_ENABLED === 'true',
  ga4MeasurementId: process.env.GA_MEASUREMENT_ID || '',
  ga4ApiSecret: process.env.GA_API_SECRET || '',
  ga4ClientId: process.env.GA_CLIENT_ID || 'api-load-testing.1',
};
