import http from 'k6/http';
import { check } from 'k6';
import { BASE_URL, PASSWORD, jsonParams, parseJson, scenarioOptions, think } from './common.js';

export const options = scenarioOptions(22, 201, 402);

export default function () {
  const email = `perf-${__VU}-${__ITER}-${Date.now()}@example.test`;
  let response = http.post(`${BASE_URL}/api/auth/register`, JSON.stringify({email, password: PASSWORD, firstName: 'Load', lastName: 'User'}), jsonParams());
  check(response, {'register 201': (r) => r.status === 201});
  think(1, 3);
  response = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify({email, password: PASSWORD}), jsonParams());
  check(response, {'login 200': (r) => r.status === 200});
  let token = parseJson(response).tokens?.refreshToken;
  think(1, 3);
  response = http.post(`${BASE_URL}/api/auth/refresh`, JSON.stringify({email, password: PASSWORD, refreshToken: token}), jsonParams());
  check(response, {'refresh 200': (r) => r.status === 200});
  token = parseJson(response).tokens?.refreshToken || token;
  think(1, 3);
  response = http.post(`${BASE_URL}/api/auth/logout`, JSON.stringify({email, password: PASSWORD, refreshToken: token}), jsonParams());
  check(response, {'logout 200': (r) => r.status === 200});
}
