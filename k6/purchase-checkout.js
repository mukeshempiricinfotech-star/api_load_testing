import http from 'k6/http';
import { check } from 'k6';
import { BASE_URL, EMAIL, PASSWORD, jsonParams, parseJson, scenarioOptions, think } from './common.js';

export const options = scenarioOptions(29, 905, 1810);

export default function () {
  let response = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify({email: EMAIL, password: PASSWORD}), jsonParams());
  const auth = parseJson(response); const token = auth.tokens?.accessToken; const refreshToken = auth.tokens?.refreshToken;
  check(response, {'login 200': (r) => r.status === 200 && !!token}); think(1, 3);
  response = http.get(`${BASE_URL}/api/products/search?q=${encodeURIComponent(__ENV.SEARCH_QUERY || 'shoe')}`, jsonParams());
  let products = parseJson(response).data || [];
  if (!products.length) products = parseJson(http.get(`${BASE_URL}/api/products`, jsonParams())).data || [];
  const id = __ENV.PRODUCT_ID || products[0]?.id; check(response, {'search 200': (r) => r.status === 200}); think(1, 3);
  if (!id) return;
  check(http.get(`${BASE_URL}/api/products/${id}`, jsonParams()), {'detail 200': (r) => r.status === 200}); think(1, 3);
  response = http.post(`${BASE_URL}/api/cart/items`, JSON.stringify({productId: id, quantity: 1}), jsonParams(token)); check(response, {'add item 201': (r) => r.status === 201}); think(1, 3);
  check(http.get(`${BASE_URL}/api/cart`, jsonParams(token)), {'cart 200': (r) => r.status === 200}); think(1, 3);
  response = http.post(`${BASE_URL}/api/orders`, JSON.stringify({items: [{productId: id, quantity: 1}], shippingAddress: {name: 'Load User', line1: '1 Performance Way', city: 'Bengaluru', region: 'KA', postalCode: '560001', country: 'IN'}}), jsonParams(token));
  const orderId = parseJson(response).data?.id; check(response, {'order 201': (r) => r.status === 201}); think(1, 3);
  if (orderId) { response = http.post(`${BASE_URL}/api/checkout/payment`, JSON.stringify({orderId, paymentMethodId: __ENV.PAYMENT_METHOD_ID || 'pm_card_visa'}), jsonParams(token)); check(response, {'payment accepted': (r) => r.status === 200}); }
  think(1, 3); check(http.get(`${BASE_URL}/api/orders`, jsonParams(token)), {'orders 200': (r) => r.status === 200}); think(1, 3);
  check(http.post(`${BASE_URL}/api/auth/logout`, JSON.stringify({email: EMAIL, password: PASSWORD, refreshToken}), jsonParams()), {'logout 200': (r) => r.status === 200});
}
