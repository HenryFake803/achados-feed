import crypto from 'node:crypto';
const cookieName = 'clube_admin_session';
const durationMs = 8 * 60 * 60 * 1000;
const secret = process.env.SESSION_SECRET || '';

function sig(value) { return crypto.createHmac('sha256', secret).update(value).digest('base64url'); }
function constantEqual(a, b) {
  const x = Buffer.from(a); const y = Buffer.from(b);
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}
export function credentialsReady() {
  return (process.env.ADMIN_PASSWORD || '').length >= 12 && secret.length >= 32;
}
export function checkCredentials(username, password) {
  return credentialsReady() && typeof username === 'string' && typeof password === 'string'
    && constantEqual(username, process.env.ADMIN_USERNAME || 'admin')
    && constantEqual(password, process.env.ADMIN_PASSWORD);
}
export function setSession(res) {
  const payload = `${Date.now() + durationMs}`;
  res.cookie(cookieName, `${payload}.${sig(payload)}`, {
    httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production',
    maxAge: durationMs, path: '/'
  });
}
export function clearSession(res) { res.clearCookie(cookieName, { httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production', path: '/' }); }
export function hasSession(req) {
  if (!credentialsReady()) return false;
  const raw = req.cookies?.[cookieName];
  if (!raw || typeof raw !== 'string') return false;
  const [expires, signature] = raw.split('.');
  return /^\d{13}$/.test(expires || '') && Number(expires) > Date.now() && constantEqual(sig(expires), signature || '');
}
export function requireAdmin(req, res, next) {
  if (!hasSession(req)) return res.status(401).json({ error: 'Sessão não autorizada.' });
  next();
}
export function requireSameOrigin(req, res, next) {
  const origin = req.get('origin');
  const host = req.get('host');
  if (origin) {
    try { if (new URL(origin).host !== host) return res.status(403).json({error: 'Origem não permitida.'}); }
    catch { return res.status(403).json({error:'Origem inválida.'}); }
  }
  next();
}
