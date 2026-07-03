const config = require('../config');

const tracer = require('dd-trace').init({
  enabled: process.env.DD_TRACE_ENABLED === 'true',
  env: config.env,
  service: config.serviceName,
  version: config.serviceVersion,
  logInjection: true,
  runtimeMetrics: true,
});

let metrics = null;

if (config.datadogMetricsEnabled) {
  const StatsD = require('hot-shots');
  metrics = new StatsD({
    host: process.env.DD_AGENT_HOST || '127.0.0.1',
    port: Number(process.env.DD_DOGSTATSD_PORT || 8125),
    prefix: 'api_load_testing.',
    globalTags: {
      env: config.env,
      service: config.serviceName,
      version: config.serviceVersion,
    },
    errorHandler(error) {
      console.error(JSON.stringify({ level: 'error', event: 'datadog_metrics_error', message: error.message }));
    },
  });
}

module.exports = { tracer, metrics };
