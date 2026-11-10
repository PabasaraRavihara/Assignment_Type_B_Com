const crypto = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET || 'ashadi_jewellers_jwt_secret_key_2026_super_secure_vault_999';

// Base64URL encoding & decoding compliant with RFC 7515
const base64url = (str) => {
  return Buffer.from(str).toString('base64url');
};

const base64urlDecode = (str) => {
  return Buffer.from(str, 'base64url').toString('utf8');
};

/**
 * Sign a payload into a standard JWT string
 * @param {Object} payload 
 * @param {number} expiresInSeconds - Default 24 hours (86400s)
 * @returns {string} token
 */
const signToken = (payload, expiresInSeconds = 86400) => {
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const now = Math.floor(Date.now() / 1000);
  const fullPayload = base64url(JSON.stringify({
    ...payload,
    iat: now,
    exp: now + expiresInSeconds
  }));

  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${header}.${fullPayload}`)
    .digest('base64url');

  return `${header}.${fullPayload}.${signature}`;
};

/**
 * Verify a JWT string and return decoded payload if valid and not expired
 * @param {string} token 
 * @returns {Object|null}
 */
const verifyToken = (token) => {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [headerB64, payloadB64, sigB64] = parts;

  // Verify signature using timing-safe comparison
  const expectedSig = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${headerB64}.${payloadB64}`)
    .digest('base64url');

  try {
    const sigBuf = Buffer.from(sigB64);
    const expectedBuf = Buffer.from(expectedSig);
    if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
      return null;
    }

    const payload = JSON.parse(base64urlDecode(payloadB64));
    const now = Math.floor(Date.now() / 1000);

    // Check expiration
    if (payload.exp && payload.exp < now) {
      return null;
    }

    return payload;
  } catch (err) {
    return null;
  }
};

/**
 * Hash password using PBKDF2 with SHA-512 and random salt
 * @param {string} password 
 * @returns {{ salt: string, hash: string }}
 */
const hashPassword = (password) => {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return { salt, hash };
};

/**
 * Verify password against salt and stored hash using timing-safe comparison
 * @param {string} password 
 * @param {string} salt 
 * @param {string} storedHash 
 * @returns {boolean}
 */
const verifyPassword = (password, salt, storedHash) => {
  if (!password || !salt || !storedHash) return false;
  try {
    const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
    const hashBuf = Buffer.from(hash, 'hex');
    const storedBuf = Buffer.from(storedHash, 'hex');
    if (hashBuf.length !== storedBuf.length) return false;
    return crypto.timingSafeEqual(hashBuf, storedBuf);
  } catch (err) {
    return false;
  }
};

module.exports = {
  signToken,
  verifyToken,
  hashPassword,
  verifyPassword
};
