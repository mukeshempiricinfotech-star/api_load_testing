const config = require('../config');

const enabled = Boolean(config.ga4MeasurementId && config.ga4ApiSecret);

function cleanText(value, maxLength = 100) {
  return String(value || 'unknown')
    .replace(/[^a-zA-Z0-9_.\/-]/g, '_')
    .slice(0, maxLength);
}

async function trackApiRequest({ method, route, statusCode, durationMs }) {
  if (!enabled) return false;

  const query = new URLSearchParams({
    measurement_id: config.ga4MeasurementId,
    api_secret: config.ga4ApiSecret,
  });
  const response = await fetch(`https://www.google-analytics.com/mp/collect?${query}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      client_id: config.ga4ClientId,
      events: [{
        name: 'api_request',
        params: {
          http_method: cleanText(method, 12),
          route: cleanText(route),
          status_code: Number(statusCode),
          duration_ms: Math.max(0, Math.round(Number(durationMs))),
          environment: cleanText(config.env, 40),
          engagement_time_msec: Math.max(1, Math.round(Number(durationMs))),
        },
      }],
    }),
    signal: AbortSignal.timeout(3000),
  });

  if (!response.ok) throw new Error(`GA4 Measurement Protocol returned ${response.status}`);
  return true;
}

module.exports = { cleanText, enabled, trackApiRequest };
