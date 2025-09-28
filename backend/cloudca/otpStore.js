const crypto = require('crypto');

const inMemory = new Map();

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function hashCode(code) {
  return crypto.createHash('sha256').update(code).digest('hex');
}

function createSession(userId, method = 'email', ttlSeconds = parseInt(process.env.OTP_EXPIRY_SECONDS || '300')) {
  const id = crypto.randomUUID();
  const code = generateCode();
  const codeHash = hashCode(code);
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
  inMemory.set(id, { userId, method, codeHash, expiresAt, verifiedAt: null });
  return { id, code, expiresAt };
}

function verifySession(id, code) {
  const s = inMemory.get(id);
  if (!s) return { ok: false, reason: 'not_found' };
  if (s.expiresAt < new Date()) return { ok: false, reason: 'expired' };
  if (s.verifiedAt) return { ok: false, reason: 'already_verified' };
  if (s.codeHash !== hashCode(code)) return { ok: false, reason: 'invalid_code' };
  s.verifiedAt = new Date();
  inMemory.set(id, s);
  return { ok: true, session: { id, userId: s.userId, method: s.method, verifiedAt: s.verifiedAt } };
}

function isVerified(id) {
  const s = inMemory.get(id);
  if (!s) return false;
  return !!s.verifiedAt && s.expiresAt >= new Date();
}

function getSession(id) {
  const s = inMemory.get(id);
  if (!s) return null;
  return { id, ...s };
}

module.exports = {
  createSession,
  verifySession,
  isVerified,
  getSession,
};


