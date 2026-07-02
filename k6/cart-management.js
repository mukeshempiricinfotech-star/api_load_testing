import http from 'k6/http';
import { check } from 'k6';
import { BASE_URL, EMAIL, PASSWORD, jsonParams, parseJson, scenarioOptions, think } from './common.js';

export const options = scenarioOptions(10, 208, 416);

export default function () {
  let response = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify({email: EMAIL, password: PASSWORD}), jsonParams());
  const auth = parseJson(response); const token = auth.tokens?.accessToken; const refreshToken = auth.tokens?.refreshToken;
  check(response, {'login 200': (r) => r.status === 200 && !!token});
  think(1, 3);
  response = http.get(`${BASE_URL}/api/products`, jsonParams());
  const id = __ENV.PRODUCT_ID || (parseJson(response).data || [])[0]?.id;
  check(response, {'products 200': (r) => r.status === 200});
  think(1, 3);
  if (id) {
    check(http.get(`${BASE_URL}/api/products/${id}`, jsonParams()), {'detail 200': (r) => r.status === 200});
    think(1, 3);
    check(http.get(`${BASE_URL}/api/cart`, jsonParams(token)), {'cart 200': (r) => r.status === 200});
    think(1, 3);
    response = http.post(`${BASE_URL}/api/cart/items`, JSON.stringify({productId: id, quantity: 1}), jsonParams(token));
    const itemId = parseJson(response).data?.id;
    check(response, {'add item 201': (r) => r.status === 201});
    think(1, 3);
    if (itemId) check(http.del(`${BASE_URL}/api/cart/items/${itemId}`, null, jsonParams(token)), {'delete item 204': (r) => r.status === 204});
  }
  think(1, 3);
  check(http.post(`${BASE_URL}/api/auth/logout`, JSON.stringify({email: EMAIL, password: PASSWORD, refreshToken}), jsonParams()), {'logout 200': (r) => r.status === 200});
}
