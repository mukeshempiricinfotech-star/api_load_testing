const test = require('node:test');
const assert = require('node:assert/strict');
const { cleanText } = require('../src/observability/ga4');
const { resolvedRoute } = require('../src/middleware/observability');

test('GA4 event values are sanitized and bounded', () => {
  assert.equal(cleanText('GET'), 'GET');
  assert.equal(cleanText('user@example.test?q=secret'), 'user_example.test_q_secret');
  assert.equal(cleanText('x'.repeat(120)).length, 100);
});

test('metrics use Express route templates instead of IDs and query strings', () => {
  assert.equal(resolvedRoute({ baseUrl: '/api/products', route: { path: '/:id' } }), '/api/products/:id');
  assert.equal(resolvedRoute({ originalUrl: '/missing?token=secret' }), 'unmatched');
});
