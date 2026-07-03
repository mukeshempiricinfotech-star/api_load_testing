const config = require('../config');
const { tracer, metrics } = require('../observability/datadog');
const { trackApiRequest } = require('../observability/ga4');

function resolvedRoute(req) {
  if (!req.route || !req.route.path) return 'unmatched';
  return `${req.baseUrl || ''}${req.route.path}`;
}

module.exports = function observabilityMiddleware(req, res, next) {
  const startedAt = process.hrtime.bigint();
  const span = tracer.scope().active();
  const traceId = span ? span.context().toTraceId() : undefined;
  const spanId = span ? span.context().toSpanId() : undefined;

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
    const route = resolvedRoute(req);
    const tags = [`method:${req.method}`, `route:${route}`, `status_code:${res.statusCode}`];

    if (metrics) {
      metrics.increment('http.requests', 1, tags);
      metrics.histogram('http.request.duration_ms', durationMs, tags);
      if (res.statusCode >= 500) metrics.increment('http.errors', 1, tags);
    }

    const log = {
      timestamp: new Date().toISOString(),
      level: res.statusCode >= 500 ? 'error' : 'info',
      event: 'http_request_completed',
      service: config.serviceName,
      env: config.env,
      method: req.method,
      route,
      status_code: res.statusCode,
      duration_ms: Math.round(durationMs * 100) / 100,
    };
    if (traceId) log['dd.trace_id'] = traceId;
    if (spanId) log['dd.span_id'] = spanId;
    process.stdout.write(`${JSON.stringify(log)}\n`);

    trackApiRequest({ method: req.method, route, statusCode: res.statusCode, durationMs })
      .catch((error) => console.error(JSON.stringify({
        level: 'warn',
        event: 'ga4_delivery_error',
        message: error.message,
      })));
  });

  next();
};

module.exports.resolvedRoute = resolvedRoute;
