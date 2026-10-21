import fs from 'node:fs/promises';
import path from 'node:path';
import { Pool } from 'pg';
import { defaultConfig, sanitizeUtm } from './validation.js';

const filePath = process.env.DATA_PATH || path.join(process.cwd(), '.data', 'state.json');
const usesPostgres = Boolean(process.env.DATABASE_URL);
let pool = null;
let local = { config: defaultConfig, events: [] };
let pendingWrite = Promise.resolve();

export async function initStore() {
  if (usesPostgres) {
    pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: true } : undefined });
    await pool.query(`CREATE TABLE IF NOT EXISTS site_config (id integer PRIMARY KEY CHECK (id = 1), data jsonb NOT NULL)`);
    await pool.query(`CREATE TABLE IF NOT EXISTS site_events (
      id bigserial PRIMARY KEY, kind varchar(25) NOT NULL, recorded_at timestamptz NOT NULL DEFAULT NOW(),
      utm_source varchar(100) NOT NULL DEFAULT '', utm_medium varchar(100) NOT NULL DEFAULT '',
      utm_campaign varchar(100) NOT NULL DEFAULT '', utm_content varchar(100) NOT NULL DEFAULT ''
    )`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_events_date ON site_events (recorded_at)`);
    await pool.query('INSERT INTO site_config (id, data) VALUES (1, $1) ON CONFLICT (id) DO NOTHING', [JSON.stringify(defaultConfig)]);
  } else {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    try {
      const data = JSON.parse(await fs.readFile(filePath, 'utf8'));
      local = { config: { ...defaultConfig, ...(data.config || {}) }, events: Array.isArray(data.events) ? data.events : [] };
    } catch (e) { if (e.code !== 'ENOENT') throw e; await persist(); }
    console.warn('Storage local em uso. Em produção, configure DATABASE_URL para não perder dados em reinicializações.');
  }
}

function persist() {
  const snapshot = JSON.stringify(local);
  pendingWrite = pendingWrite.then(async () => {
    const temp = filePath + '.tmp';
    await fs.writeFile(temp, snapshot, 'utf8');
    await fs.rename(temp, filePath);
  });
  return pendingWrite;
}

export async function getConfig() {
  if (!pool) return { ...local.config };
  const r = await pool.query('SELECT data FROM site_config WHERE id=1');
  return { ...defaultConfig, ...(r.rows[0]?.data || {}) };
}

export async function saveConfig(config) {
  if (pool) await pool.query('UPDATE site_config SET data=$1 WHERE id=1', [JSON.stringify(config)]);
  else { local.config = config; await persist(); }
}

export async function recordEvent(kind, input) {
  if (!['page_view', 'whatsapp_click'].includes(kind)) return;
  const utm = sanitizeUtm(input);
  if (pool) {
    await pool.query(`INSERT INTO site_events (kind, utm_source, utm_medium, utm_campaign, utm_content)
      VALUES ($1,$2,$3,$4,$5)`, [kind, utm.utm_source, utm.utm_medium, utm.utm_campaign, utm.utm_content]);
  } else {
    local.events.push({ kind, ...utm, recorded_at: new Date().toISOString() });
    const cutoff = Date.now() - 90 * 86400000;
    local.events = local.events.filter(e => new Date(e.recorded_at).getTime() > cutoff);
    await persist();
  }
}

export async function dashboard(days = 7) {
  const from = new Date(Date.now() - (days - 1) * 86400000);
  from.setUTCHours(0, 0, 0, 0);
  let rows;
  if (pool) {
    const result = await pool.query(`SELECT kind, recorded_at, utm_source, utm_campaign FROM site_events
      WHERE recorded_at >= $1 ORDER BY recorded_at ASC LIMIT 200000`, [from.toISOString()]);
    rows = result.rows;
  } else rows = local.events.filter(e => new Date(e.recorded_at) >= from);
  const counts = { page_view: 0, whatsapp_click: 0 };
  const byDay = new Map();
  const bySource = new Map();
  const byCampaign = new Map();
  for (let d = 0; d < days; d++) {
    const dt = new Date(from.getTime() + d * 86400000).toISOString().slice(0, 10);
    byDay.set(dt, { date: dt, page_view: 0, whatsapp_click: 0 });
  }
  for (const row of rows) {
    if (!(row.kind in counts)) continue;
    counts[row.kind]++;
    const day = new Date(row.recorded_at).toISOString().slice(0, 10);
    if (byDay.has(day)) byDay.get(day)[row.kind]++;
    const source = row.utm_source || 'Direto / não identificado';
    const campaign = row.utm_campaign || 'Sem campanha';
    for (const [map, key] of [[bySource, source], [byCampaign, campaign]]) {
      if (!map.has(key)) map.set(key, { label: key, page_view: 0, whatsapp_click: 0 });
      map.get(key)[row.kind]++;
    }
  }
  const sorted = map => [...map.values()].sort((a, b) => b.whatsapp_click - a.whatsapp_click || b.page_view - a.page_view).slice(0, 12);
  return { days, pageViews: counts.page_view, clicks: counts.whatsapp_click, ctr: counts.page_view ? +(counts.whatsapp_click / counts.page_view * 100).toFixed(1) : 0, daily: [...byDay.values()], sources: sorted(bySource), campaigns: sorted(byCampaign) };
}

export async function pruneOldEvents() {
  if (pool) await pool.query("DELETE FROM site_events WHERE recorded_at < NOW() - INTERVAL '90 days'");
}
