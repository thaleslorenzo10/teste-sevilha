'use strict';

/**
 * End-to-end test: chama a função real de api/leads.js com um lead simulado
 * e verifica que o deal aparece no RD CRM com email+telefone vinculados.
 *
 * Testa tanto o caso "lead novo" quanto o caso "lead repetido".
 *
 * Uso:
 *   node scripts/test-api-leads-e2e.js
 *   DELETE_AFTER=1 node scripts/test-api-leads-e2e.js
 */

const fs = require('fs');
const path = require('path');

// Carrega variáveis do .env.local
try {
  const envFile = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8');
  envFile.split('\n').forEach(line => {
    const m = line.match(/^([A-Z_]+)=["']?([^"'\n]*)["']?$/);
    if (m) process.env[m[1]] = m[2];
  });
} catch (e) {}

const handler = require('../api/leads.js');
const TOKEN = process.env.RD_CRM_TOKEN;
const BASE = 'https://crm.rdstation.com/api/v1';

// Mock de request/response compatível com Vercel Serverless
function mockReqRes(body) {
  const req = {
    method: 'POST',
    headers: {
      'x-forwarded-for': '203.0.113.42',
      'user-agent':      'Mozilla/5.0 (Test)',
      referer:           'https://sevilha.example.com/pre-inscricao-3/',
    },
    socket: { remoteAddress: '203.0.113.42' },
    body,
  };
  const res = {
    statusCode: 200,
    headers:    {},
    setHeader(k, v) { this.headers[k] = v; },
    status(code)   { this.statusCode = code; return this; },
    json(data)     { this.body = data; return this; },
    end()          { return this; },
  };
  return { req, res };
}

async function findContactByEmail(email) {
  const r = await fetch(`${BASE}/contacts?token=${TOKEN}&email=${encodeURIComponent(email)}`);
  if (!r.ok) return null;
  const d = await r.json();
  return (d.contacts || [])[0] || null;
}

async function getDealWithContacts(dealId) {
  const r = await fetch(`${BASE}/deals/${dealId}/contacts?token=${TOKEN}`);
  if (!r.ok) return { contacts: [] };
  const d = await r.json();
  return { contacts: d.contacts || d || [] };
}

async function getContactDeals(contactId) {
  const r = await fetch(`${BASE}/contacts/${contactId}?token=${TOKEN}`);
  if (!r.ok) return [];
  const c = await r.json();
  return (c.deal_ids || []).map(d => typeof d === 'string' ? d : (d._id || d.id)).filter(Boolean);
}

async function cleanup(email) {
  const c = await findContactByEmail(email);
  if (!c) return;
  const contactId = c._id || c.id;
  // Deleta todos os deals vinculados a esse contato
  const dealIds = await getContactDeals(contactId);
  for (const dealId of dealIds) {
    await fetch(`${BASE}/deals/${dealId}?token=${TOKEN}`, { method: 'DELETE' });
  }
  await fetch(`${BASE}/contacts/${contactId}?token=${TOKEN}`, { method: 'DELETE' });
}

async function runCase(label, leadData) {
  console.log(`\n━━━ ${label} ━━━`);
  console.log(`  email: ${leadData.email}`);
  console.log(`  telefone: ${leadData.telefone}`);

  const { req, res } = mockReqRes(leadData);
  await handler(req, res);

  console.log(`  handler retornou: status=${res.statusCode}`, res.body);

  // Aguarda consistência
  await new Promise(r => setTimeout(r, 2500));

  // Verifica o contato
  const contact = await findContactByEmail(leadData.email);
  if (!contact) {
    console.log(`  ❌ contato não encontrado no CRM`);
    return { ok: false };
  }

  const contactId = contact._id || contact.id;
  console.log(`  ✓ contato encontrado — id=${contactId}`);
  console.log(`    name:   ${contact.name}`);
  console.log(`    emails: ${JSON.stringify(contact.emails?.map(e => e.email))}`);
  console.log(`    phones: ${JSON.stringify(contact.phones?.map(p => p.phone))}`);

  const dealIds = await getContactDeals(contactId);
  console.log(`  ✓ deal_ids vinculados: ${dealIds.length}`);

  if (dealIds.length === 0) {
    console.log(`  ❌ nenhum deal vinculado a este contato`);
    return { ok: false, contactId };
  }

  // Verifica o deal mais recente
  const latestDealId = dealIds[dealIds.length - 1];
  const { contacts } = await getDealWithContacts(latestDealId);
  console.log(`  ✓ GET /deals/${latestDealId}/contacts → ${contacts.length} contato(s)`);

  const contactOnDeal = contacts.find(c => (c._id || c.id) === contactId);
  if (!contactOnDeal) {
    console.log(`  ❌ deal existe mas contato não aparece na lista`);
    return { ok: false, contactId };
  }

  const emailOnDeal = contactOnDeal.emails?.[0]?.email;
  const phoneOnDeal = contactOnDeal.phones?.[0]?.phone;

  console.log(`  ✓ contato vinculado ao deal:`);
  console.log(`      name:  ${contactOnDeal.name}`);
  console.log(`      email: ${emailOnDeal}`);
  console.log(`      phone: ${phoneOnDeal}`);

  const hasEmail = emailOnDeal === leadData.email;
  const hasPhone = !!phoneOnDeal;

  console.log(`\n  email correto: ${hasEmail ? '✅' : '❌'}`);
  console.log(`  telefone presente: ${hasPhone ? '✅' : '❌'}`);

  return { ok: hasEmail && hasPhone, contactId, dealId: latestDealId };
}

async function main() {
  const ts = Date.now();

  // Caso 1: Lead totalmente novo
  const lead1 = {
    nome:     'Thales E2E Test',
    email:    `e2e+${ts}@example.com`,
    telefone: '(21) 99684-2535',
    utm_source:   'Facebook_Feed',
    utm_medium:   'cpc',
    utm_campaign: '[CP] E2E Test',
    utm_content:  'AD01',
    pagina:       '/pre-inscricao-3',
    cargo:        'Dono/Sócio',
    colaboradores: 'De 5 a 9',
    fbp:          'fb.1.1775000000000.123456789',
    external_id:  `ext_${ts}`,
    event_id:     `ev_${ts}_e2e`,
  };

  const r1 = await runCase('CASO 1: Lead novo', lead1);
  await cleanup(lead1.email);

  // Caso 2: Mesmo email, segunda submissão
  const lead2 = {
    nome:     'Thales E2E Repetido',
    email:    `repeat+${ts}@example.com`,
    telefone: '(11) 98765-4321',
    utm_source:   'Google',
    utm_campaign: '[CP] E2E Repeat',
    pagina:       '/pre-inscricao-3',
    cargo:        'Cargo Gerencial',
    colaboradores: 'De 10 a 19',
    event_id:     `ev_${ts}_first`,
  };

  console.log('\n\n━━━ Primeira submissão (cria contato) ━━━');
  const { req: rq1, res: rs1 } = mockReqRes(lead2);
  await handler(rq1, rs1);
  console.log(`  primeira submissão: status=${rs1.statusCode}`);

  await new Promise(r => setTimeout(r, 3000));

  // Segunda submissão com mesmo email — deve cair no caminho "existente"
  const lead2b = { ...lead2, event_id: `ev_${ts}_second`, telefone: '(21) 91111-2222' };
  const r2 = await runCase('CASO 2: Lead repetido (email existente)', lead2b);
  await cleanup(lead2.email);

  // ═════ RESUMO ═════
  console.log('\n\n╔══════════════ RESUMO E2E ══════════════╗');
  console.log(`  Caso 1 (novo):      ${r1.ok ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  Caso 2 (existente): ${r2.ok ? '✅ PASS' : '❌ FAIL'}`);
  console.log('╚═════════════════════════════════════════╝');

  process.exit(r1.ok && r2.ok ? 0 : 1);
}

main().catch(err => {
  console.error('ERRO FATAL:', err);
  process.exit(1);
});
