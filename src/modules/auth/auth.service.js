const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../../database');
const redis = require('../../lib/redis');
const config = require('../../config');
const { conflict, unauthorized } = require('../../lib/errors');

const userView = (user) => ({ id: user.id, email: user.email, firstName: user.first_name, lastName: user.last_name });
function pair(user) {
  const subject = String(user.id);
  return {
    accessToken: jwt.sign({ sub: subject, email: user.email, type: 'access' }, config.jwtAccessSecret, { expiresIn: config.jwtAccessTtl, algorithm: 'HS256' }),
    refreshToken: jwt.sign({ sub: subject, email: user.email, type: 'refresh' }, config.jwtRefreshSecret, { expiresIn: config.jwtRefreshTtl, algorithm: 'HS256' }),
    tokenType: 'Bearer', expiresIn: 900,
  };
}
async function storeRefreshToken(user, tokens) {
  const decoded = jwt.decode(tokens.refreshToken);
  await redis.set(`refresh:${user.id}:${decoded.jti || decoded.iat}`, tokens.refreshToken, 'EX', Math.max(1, decoded.exp - decoded.iat));
}
async function authenticate(email, password) {
  const { rows: [user] } = await db.query('SELECT * FROM users WHERE lower(email) = lower($1)', [email]);
  if (!user || !await bcrypt.compare(password, user.password_hash)) throw unauthorized('Email or password is incorrect');
  return user;
}

exports.register = async ({ email, password, firstName, lastName }) => {
  const existing = await db.query('SELECT 1 FROM users WHERE lower(email) = lower($1)', [email]);
  if (existing.rowCount) throw conflict('An account already exists for this email');
  const passwordHash = await bcrypt.hash(password, 12);
  const { rows: [user] } = await db.query('INSERT INTO users (email,password_hash,first_name,last_name) VALUES ($1,$2,$3,$4) RETURNING *', [email, passwordHash, firstName, lastName]);
  const tokens = pair(user); await storeRefreshToken(user, tokens); return { user: userView(user), tokens };
};
exports.login = async ({ email, password }) => { const user = await authenticate(email, password); const tokens = pair(user); await storeRefreshToken(user, tokens); return { user: userView(user), tokens }; };
exports.refresh = async ({ email, password, refreshToken }) => {
  const user = await authenticate(email, password);
  let decoded; try { decoded = jwt.verify(refreshToken, config.jwtRefreshSecret, { algorithms: ['HS256'] }); } catch { throw unauthorized('Refresh token is invalid or expired'); }
  if (decoded.sub !== String(user.id)) throw unauthorized('Refresh token does not belong to this user');
  const cached = await redis.get(`refresh:${user.id}:${decoded.jti || decoded.iat}`); if (cached !== refreshToken) throw unauthorized('Refresh token has been revoked');
  await redis.del(`refresh:${user.id}:${decoded.jti || decoded.iat}`); const tokens = pair(user); await storeRefreshToken(user, tokens); return { user: userView(user), tokens };
};
exports.logout = async ({ email, password, refreshToken }) => {
  const user = await authenticate(email, password);
  try { const decoded = jwt.verify(refreshToken, config.jwtRefreshSecret, { algorithms: ['HS256'] }); await redis.del(`refresh:${user.id}:${decoded.jti || decoded.iat}`); } catch { /* Make logout idempotent. */ }
  return { user: userView(user), tokens: { accessToken: null, refreshToken: null, tokenType: 'Bearer', expiresIn: 0 }, loggedOut: true };
};
