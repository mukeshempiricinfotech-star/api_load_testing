import { sleep } from 'k6';

export const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
export const TEST_TYPE = (__ENV.TEST_TYPE || 'smoke').toLowerCase();
export const PASSWORD = __ENV.PASSWORD || 'load-test-password';
export const EMAIL = __ENV.EMAIL || 'buyer@example.test';

const multiplier = (x, factor) => Math.max(1, Math.ceil(x * factor));
export function scenarioOptions(peakRate, preAllocatedVUs, maxVUs) {
  const base = {executor: 'ramping-arrival-rate', timeUnit: '1s', startRate: 1, preAllocatedVUs, maxVUs};
  const scenarios = {
    smoke: {...base, stages: [{target: 1, duration: '10s'}, {target: 1, duration: '50s'}]},
    load: {...base, stages: [{target: peakRate, duration: '10m'}, {target: peakRate, duration: '30m'}, {target: 1, duration: '5m'}]},
    stress: {...base, stages: [{target: peakRate, duration: '5m'}, {target: peakRate, duration: '10m'}, {target: multiplier(peakRate, 1.5), duration: '10m'}, {target: multiplier(peakRate, 2), duration: '10m'}, {target: 1, duration: '5m'}]},
    spike: {...base, stages: [{target: peakRate, duration: '2m'}, {target: multiplier(peakRate, 2), duration: '30s'}, {target: multiplier(peakRate, 2), duration: '5m'}, {target: 1, duration: '2m'}]},
    soak: {...base, stages: [{target: multiplier(peakRate, 0.6), duration: '10m'}, {target: multiplier(peakRate, 0.6), duration: '2h'}, {target: 1, duration: '10m'}]},
    breakpoint: {...base, stages: [0.5, 1, 1.5, 2, 3, 4].map((factor) => ({target: multiplier(peakRate, factor), duration: '5m'})).concat([{target: 1, duration: '2m'}])},
  };
  if (!scenarios[TEST_TYPE]) throw new Error(`TEST_TYPE must be one of ${Object.keys(scenarios).join(', ')}`);
  return {scenarios: {journey: scenarios[TEST_TYPE]}, thresholds: {http_req_failed: ['rate<0.01'], http_req_duration: ['p(95)<1100'], checks: ['rate>0.99']}};
}

export function jsonParams(token) {
  const headers = {'Content-Type': 'application/json'};
  if (token) headers.Authorization = `Bearer ${token}`;
  return {headers};
}

export function parseJson(response, fallback = {}) {
  try { return response.json(); } catch (_) { return fallback; }
}

export function think(minSeconds, maxSeconds) {
  sleep(minSeconds + Math.random() * (maxSeconds - minSeconds));
}
