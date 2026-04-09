'use strict';

const fs = require('fs'), path = require('path');
fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8')
  .split('\n').forEach(l => { const m = l.match(/^([A-Z_]+)=["']?([^"'\n]*)["']?$/); if (m) process.env[m[1]] = m[2]; });
const TOKEN = process.env.RD_CRM_TOKEN;
const BASE = 'https://crm.rdstation.com/api/v1';
const TEST_ID = '69d79c81b717dc0019e4a19f'; // Guido antigo (ainda vivo)

const strategies = [
  {
    label: 'DELETE /deals/:id?token=',
    req:   () => fetch(`${BASE}/deals/${TEST_ID}?token=${TOKEN}`, { method: 'DELETE' }),
  },
  {
    label: 'DELETE /deals/:id (Authorization: Bearer)',
    req:   () => fetch(`${BASE}/deals/${TEST_ID}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${TOKEN}` },
    }),
  },
  {
    label: 'DELETE /deals/:id (Authorization: Token)',
    req:   () => fetch(`${BASE}/deals/${TEST_ID}`, {
      method: 'DELETE',
      headers: { Authorization: `Token token=${TOKEN}` },
    }),
  },
  {
    label: 'DELETE /deals/:id (header Content-Type: app/json + token query)',
    req:   () => fetch(`${BASE}/deals/${TEST_ID}?token=${TOKEN}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    }),
  },
  {
    label: 'POST /deals/:id/delete?token=',
    req:   () => fetch(`${BASE}/deals/${TEST_ID}/delete?token=${TOKEN}`, { method: 'POST' }),
  },
  {
    label: 'DELETE /crm/v1/deals/:id',
    req:   () => fetch(`https://crm.rdstation.com/crm/v1/deals/${TEST_ID}?token=${TOKEN}`, { method: 'DELETE' }),
  },
  {
    label: 'DELETE /api/crm/v1/deals/:id',
    req:   () => fetch(`https://crm.rdstation.com/api/crm/v1/deals/${TEST_ID}?token=${TOKEN}`, { method: 'DELETE' }),
  },
  {
    label: 'PUT /deals/:id  { deal: { deleted: true } }',
    req:   () => fetch(`${BASE}/deals/${TEST_ID}?token=${TOKEN}`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ deal: { deleted: true } }),
    }),
  },
  {
    label: 'PUT /deals/:id  { deal: { hold: "trashed" } }',
    req:   () => fetch(`${BASE}/deals/${TEST_ID}?token=${TOKEN}`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ deal: { hold: 'trashed' } }),
    }),
  },
];

async function exists(id) {
  const r = await fetch(`${BASE}/deals/${id}?token=${TOKEN}`);
  if (!r.ok) return false;
  try {
    const d = await r.json();
    return !!(d._id || d.id);
  } catch {
    return false;
  }
}

(async () => {
  const alive = await exists(TEST_ID);
  if (!alive) { console.log('deal alvo já não existe; pare.'); process.exit(0); }
  console.log(`deal alvo ${TEST_ID} vivo — testando estratégias\n`);

  for (const s of strategies) {
    process.stdout.write(`  ${s.label.padEnd(55)} `);
    try {
      const r = await s.req();
      const ct = r.headers.get('content-type') || '';
      const isJson = /json/.test(ct);
      const body = isJson ? await r.json().catch(() => null) : (await r.text()).slice(0, 120);
      await new Promise(x => setTimeout(x, 600));
      const stillAlive = await exists(TEST_ID);
      console.log(`${r.status}  ${stillAlive ? 'AINDA VIVO' : '✓ APAGADO'}  ${isJson ? JSON.stringify(body).slice(0, 80) : '[html]'}`);
      if (!stillAlive) { console.log('\n🎯 ESTRATÉGIA VENCEDORA:', s.label); process.exit(0); }
    } catch (e) {
      console.log(`ERRO ${e.message}`);
    }
  }
  console.log('\nnenhuma funcionou');
})();
