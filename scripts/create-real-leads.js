'use strict';

/**
 * Cria os 15 deals reais (Supabase) no pipeline Clube da Performance.
 * Assume que o pipeline já está vazio.
 *
 * - busca leads reais no Supabase
 * - deduplica por email (mantém o mais recente)
 * - para cada lead: upsert contato + cria deal + vincula
 * - owner = Geraldo Tadeu
 * - stage = Pré-inscritos
 */

const fs   = require('fs');
const path = require('path');

try {
  fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8')
    .split('\n')
    .forEach(line => {
      const m = line.match(/^([A-Z_]+)=["']?([^"'\n]*)["']?$/);
      if (m) process.env[m[1]] = m[2];
    });
} catch (e) {}

const TOKEN     = process.env.RD_CRM_TOKEN;
const BASE      = 'https://crm.rdstation.com/api/v1';
const SUPA_URL  = process.env.SUPABASE_URL;
const SUPA_KEY  = process.env.SUPABASE_SERVICE_KEY;

const STAGE_PRE = '69d52f54c0b8000015d2e7bb';   // Pré-inscritos
const GERALDO   = '68e6e08c6c2ac10017538422';
const SOURCE    = '68e5c150af14bb00013f8acb';   // Busca Paga | Facebook Ads
const CAMPAIGN  = '69d52f437e5d76001a90e080';   // [CP] Clube da Performance > CRM

const CF = {
  utm_source:    '68e6668a5621790019a1ad6d',
  utm_campaign:  '68e6669152f4a7001f8d9f8f',
  utm_content:   '68e666990450fa001e3e70f5',
  utm_medium:    '68e666a608aace0019e118a1',
  cargo:         '68e6647cca456d0019525bae',
  colaboradores: '68e6647462dc7600149cef2c',
};

const TEST_NAME_RE  = /\b(teste|test|e2e|debug|dummy|fake|staging|lorenzo\s*media)\b/i;
const TEST_EMAIL_RE = /@(example\.com|test\.|lorenzomedia|sevilhaperformance\.com\.br$)/i;
const isTest = (n, e) => !e || TEST_NAME_RE.test(n || '') || TEST_EMAIL_RE.test(e || '');

const sleep = ms => new Promise(r => setTimeout(r, ms));

function normalizePhone(raw) {
  if (!raw) return '';
  const d = String(raw).replace(/\D+/g, '');
  if (!d) return '';
  if (d.startsWith('55') && d.length >= 12) return d;
  return '55' + d;
}

async function findContactByEmail(email) {
  const r = await fetch(`${BASE}/contacts?token=${TOKEN}&email=${encodeURIComponent(email)}`);
  if (!r.ok) return null;
  const d = await r.json();
  return (d.contacts || [])[0] || null;
}

async function createDealForLead(lead) {
  const email = lead.email;
  const phone = normalizePhone(lead.telefone);

  const contactInline = {
    name:   lead.nome?.trim() || email,
    emails: [{ email }],
    phones: phone ? [{ phone, type: 'cellphone' }] : [],
  };

  const dealBody = {
    name:           lead.nome?.trim() || email,
    deal_stage_id:  STAGE_PRE,
    deal_source_id: SOURCE,
    campaign_id:    CAMPAIGN,
    user_id:        GERALDO,
    deal_custom_fields: [
      { custom_field_id: CF.utm_source,    value: lead.utm_source    || '' },
      { custom_field_id: CF.utm_campaign,  value: lead.utm_campaign  || '' },
      { custom_field_id: CF.utm_content,   value: lead.utm_content   || '' },
      { custom_field_id: CF.utm_medium,    value: lead.utm_medium    || '' },
      { custom_field_id: CF.cargo,         value: lead.cargo         || '' },
      { custom_field_id: CF.colaboradores, value: lead.colaboradores || '' },
    ].filter(f => f.value),
  };

  // Contato já existe (migração anterior criou todos) — fluxo "existente"
  const existing = await findContactByEmail(email);

  if (existing) {
    const contactId = existing._id || existing.id;

    // Atualiza dados do contato (nome, telefone)
    await fetch(`${BASE}/contacts/${contactId}?token=${TOKEN}`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ contact: contactInline }),
    });

    // Cria deal bare
    const dRes = await fetch(`${BASE}/deals?token=${TOKEN}`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ deal: dealBody }),
    });
    if (!dRes.ok) {
      return { ok: false, error: `deal ${dRes.status} ${await dRes.text().catch(()=>'')}` };
    }
    const d = await dRes.json();
    const dealId = d._id || d.id;

    // Sobrescreve deal_ids (os antigos foram apagados manualmente)
    await fetch(`${BASE}/contacts/${contactId}?token=${TOKEN}`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ contact: { deal_ids: [dealId] } }),
    });

    return { ok: true, dealId, contactId, path: 'existing' };
  }

  // Contato novo — POST /deals com contacts inline
  const dRes = await fetch(`${BASE}/deals?token=${TOKEN}`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ deal: dealBody, contacts: [contactInline] }),
  });
  if (!dRes.ok) {
    return { ok: false, error: `deal ${dRes.status} ${await dRes.text().catch(()=>'')}` };
  }
  const d = await dRes.json();
  return { ok: true, dealId: d._id || d.id, path: 'new' };
}

async function main() {
  console.log('━━━ Coleta Supabase ━━━');
  const sRes = await fetch(
    `${SUPA_URL}/rest/v1/leads_sevilhaperfomance?select=*&order=created_at.desc&limit=1000`,
    { headers: { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}` } }
  );
  const allLeads = sRes.ok ? await sRes.json() : [];
  const realLeads = allLeads.filter(l => !isTest(l.nome, l.email));

  const byEmail = new Map();
  for (const l of realLeads) {
    const k = l.email.toLowerCase();
    const prev = byEmail.get(k);
    if (!prev || new Date(l.created_at) > new Date(prev.created_at)) byEmail.set(k, l);
  }
  const realUnique = [...byEmail.values()];
  console.log(`  reais únicos: ${realUnique.length}\n`);

  console.log('━━━ Criando deals ━━━');
  const results = [];
  for (const lead of realUnique) {
    process.stdout.write(`  ${(lead.nome?.trim() || '—').padEnd(40)} <${lead.email.padEnd(45)}> `);
    const r = await createDealForLead(lead);
    if (r.ok) {
      console.log(`✓ ${r.dealId} (${r.path})`);
    } else {
      console.log(`✗ ${r.error}`);
    }
    results.push({ email: lead.email, ...r });
    await sleep(300);
  }

  const ok   = results.filter(r => r.ok).length;
  const fail = results.filter(r => !r.ok).length;

  console.log('\n╔══════════════ RESUMO ══════════════╗');
  console.log(`  Leads reais únicos:    ${realUnique.length}`);
  console.log(`  Criados com sucesso:   ${ok}`);
  console.log(`  Falhas:                ${fail}`);
  console.log('╚═════════════════════════════════════╝');

  if (fail > 0) {
    console.log('\nFalhas:');
    for (const r of results.filter(x => !x.ok)) console.log(`  ${r.email}: ${r.error}`);
    process.exit(1);
  }
}

main().catch(err => { console.error('ERRO:', err); process.exit(1); });
