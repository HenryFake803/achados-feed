import express from 'express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'node:path';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { initStore, getConfig, saveConfig, recordEvent, dashboard, pruneOldEvents } from './store.js';
import { validateConfig, sanitizeUtm } from './validation.js';
import { renderMetadata } from './meta.js';
import { hasSession, credentialsReady, checkCredentials, setSession, clearSession, requireAdmin, requireSameOrigin } from './auth.js';

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', process.env.NODE_ENV === 'production' ? 1 : false);
app.use(helmet({ contentSecurityPolicy: {
  useDefaults: true,
  directives: { 'script-src': ["'self'", 'https://connect.facebook.net'], 'connect-src': ["'self'", 'https://www.facebook.com', 'https://connect.facebook.net'], 'img-src': ["'self'", 'data:', 'https://www.facebook.com'], 'style-src': ["'self'", "'unsafe-inline'"], 'font-src': ["'self'", 'data:'], 'frame-src': ["'self'", 'https://www.facebook.com'] }
}}));
app.use(express.json({ limit: '16kb' }));
app.use(cookieParser());
const loginLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 8, standardHeaders: 'draft-7', legacyHeaders: false, message: {error: 'Muitas tentativas. Tente novamente mais tarde.'} });
const eventsLimit = rateLimit({ windowMs: 60 * 1000, limit: 120, standardHeaders: 'draft-7', legacyHeaders: false });
app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.get('/api/public/config', async (_req, res, next) => {
  try {
    const config = await getConfig();
    // Invitation is resolved by /go; public visitors do not need an admin-managed raw destination.
    const {whatsappLink: _whatsappLink, privacyEmail, ...publicData} = config;
    res.set('Cache-Control', 'no-store');
    res.json({...publicData, privacyEmail});
  } catch (e) { next(e); }
});
app.post('/api/events', eventsLimit, requireSameOrigin, async (req, res, next) => {
  try {
    if (req.body?.kind !== 'page_view') return res.status(400).json({ error: 'Evento inválido.' });
    await recordEvent('page_view', req.body || {});
    res.status(204).end();
  } catch (e) { next(e); }
});
app.get('/go', eventsLimit, async (req, res, next) => {
  try {
    const {whatsappLink} = await getConfig();
    await recordEvent('whatsapp_click', sanitizeUtm(req.query));
    res.set('Cache-Control', 'no-store');
    res.redirect(302, whatsappLink);
  } catch (e) { next(e); }
});
app.get('/api/admin/me', (req, res) => res.json({ authenticated: hasSession(req), configured: credentialsReady() }));
app.post('/api/admin/login', loginLimit, requireSameOrigin, (req, res) => {
  if (!credentialsReady()) return res.status(503).json({error: 'Defina ADMIN_PASSWORD e SESSION_SECRET no servidor antes de usar o painel.'});
  if (!checkCredentials(req.body?.username, req.body?.password)) return res.status(401).json({error:'Usuário ou senha incorretos.'});
  setSession(res); res.json({ok: true});
});
app.post('/api/admin/logout', requireSameOrigin, (_req, res) => { clearSession(res); res.json({ok: true}); });
app.get('/api/admin/config', requireAdmin, async (_req, res, next) => {
  try { res.json(await getConfig()); } catch (e) { next(e); }
});
app.put('/api/admin/config', requireSameOrigin, requireAdmin, async (req, res, next) => {
  try {
    const current = await getConfig();
    const nextConfig = validateConfig(req.body, current);
    await saveConfig(nextConfig);
    res.json({ok: true, config: nextConfig});
  } catch (e) { if (['Dados inválidos.', 'Insira um link de convite válido do WhatsApp.', 'O Pixel deve conter apenas números (ou ficar vazio).', 'Estado do aviso inválido.', 'E-mail de privacidade inválido.', 'Preencha os campos principais.', 'Ordem de ofertas inválida.', 'Seleção de ofertas inválida.', 'Rotação automática inválida.'].includes(e.message) || e.message.startsWith('Campo inválido:')) return res.status(400).json({error:e.message}); next(e); }
});
app.get('/api/admin/stats', requireAdmin, async (req, res, next) => {
  try { const days = req.query.days === '30' ? 30 : 7; res.json(await dashboard(days)); } catch (e) { next(e); }
});
app.use('/api', (_req, res) => res.status(404).json({error:'Rota não encontrada.'}));
const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../dist');
app.use(express.static(dist, { maxAge: '1d', index: false }));
app.get('*', async (req, res, next) => {
  try {
    if (req.path.startsWith('/admin')) res.set('X-Robots-Tag', 'noindex, nofollow');
    res.set('Cache-Control', 'no-store');
    const html = await fs.readFile(path.join(dist, 'index.html'), 'utf8');
    const config = await getConfig();
    res.type('html').send(renderMetadata(html, config));
  } catch (e) { next(e); }
});
app.use((err, _req, res, _next) => { console.error(err); res.status(500).json({error:'Erro interno. Tente novamente.'}); });

if (process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL && !process.env.DATA_PATH) {
  console.error('Produção exige DATABASE_URL (PostgreSQL) ou DATA_PATH em armazenamento persistente.');
  process.exit(1);
}
await initStore();
await pruneOldEvents();
const port = Number(process.env.PORT) || 3000;
app.listen(port, '0.0.0.0', () => console.log(`Clube de Ofertas em http://localhost:${port} | Admin: ${credentialsReady() ? 'configurado' : 'desativado (configure .env)'}`));
