import http from 'k6/http';
import { check } from 'k6';
import { BASE_URL, jsonParams, parseJson, scenarioOptions, think } from './common.js';

export const options = scenarioOptions(33, 515, 1030);

export default function () {
  check(http.get(`${BASE_URL}/health`), {'health 200': (r) => r.status === 200});
  let response = http.get(`${BASE_URL}/api/products`, jsonParams());
  check(response, {'products 200': (r) => r.status === 200});
  const products = parseJson(response).data || [];
  const id = (__ENV.PRODUCT_ID || products[0]?.id);
  think(2, 5);
  response = http.get(`${BASE_URL}/api/products/search?q=${encodeURIComponent(__ENV.SEARCH_QUERY || 'shoe')}`, jsonParams());
  check(response, {'search 200': (r) => r.status === 200});
  think(2, 5);
  if (id) {
    response = http.get(`${BASE_URL}/api/products/${id}`, jsonParams());
    check(response, {'product detail 200': (r) => r.status === 200});
    think(2, 5);
    response = http.get(`${BASE_URL}/api/products/${id}/reviews`, jsonParams());
    check(response, {'reviews 200': (r) => r.status === 200});
  }
}
