'use strict';

/**
 * OPERAÇÃO DESTRUTIVA — usar com cuidado.
 *
 *  FASE 1: apaga TODOS os deals do pipeline Clube da Performance
 *  FASE 2: cria 15 deals reais (Supabase) com email/telefone/Geraldo como owner
 *  FASE 3: corrige typos de email no Supabase (hotail→hotmail, .vom→.com)
 *
 * Por segurança, o script só roda com `--commit`.
 *   Sem flag: dry-run (mostra o que faria).
 *   Com flag: executa de verdade.
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

const PIPE_ID   = '69d52f54c0b8000015d2e7b9';   // Clube da Performance
const STAGE_PRE = '69d52f54c0b8000015d2e7bb';   // Pré-inscritos
const GERALDO   = '68e6e08c6c2ac10017538422';
const SOURCE    = '68e5c150af14bb00013f8acb';   // Busca Paga | Facebook Ads
const CAMPAIGN  = '69d52f437e5d76001a90e080';   // [CP] Clube da Performance > CRM

// Custom fields
const CF = {
  utm_source:    '68e6668a5621790019a1ad6d',
  utm_campaign:  '68e6669152f4a7001f8d9f8f',
  utm_content:   '68e666990450fa001e3e70f5',
  utm_medium:    '68e666a608aace0019e118a1',
  cargo:         '68e6647cca456d0019525bae',
  colaboradores: '68e6647462dc7600149cef2c',
};

// Correções de typo
const EMAIL_FIXES = {
  'graca.contabil@hotail.com': 'graca.contabil@hotmail.com',
  'jcsilva10@gmail.vom':       'jcsilva10@gmail.com',
};

// Heurísticas de teste
const TEST_NAME_RE  = /\b(teste|test|e2e|debug|dummy|fake|staging|lorenzo\s*media)\b/i;
const TEST_EMAIL_RE = /@(example\.com|test\.|lorenzomedia|sevilhaperformance\.com\.br$)/i;
const isTest = (n, e) => !e || TEST_NAME_RE.test(n || '') || TEST_EMAIL_RE.test(e || '');

const COMMIT = process.argv.includes('--commit');
const sleep  = ms => new Promise(r => setTimeout(r, ms));

function normalizePhone(raw) {
  if (!raw) return '';
  const d = String(raw).replace(/\D+/g, '');
  if (!d) return '';
  if (d.startsWith('55') && d.length >= 12) return d;
  return '55' + d;
}

async function fetchAllPipelineDeals() {
  const out = [];
  let page = 1;
  while (true) {
    const url = `${BASE}/deals?token=${TOKEN}&deal_pipeline_id=${PIPE_ID}&page=${page}&limit=200`;
    const r = await fetch(url);
    if (!r.ok) { console.error(`  lista erro ${r.status}`); break; }
    const d = await r.json();
    const list = d.deals || [];
    out.push(...list);
    if (!d.has_more || list.length === 0) break;
    page++;
    if (page > 30) break;
  }
  return out;
}

async function deleteDeal(id) {
  const r = await fetch(`${BASE}/deals/${id}?token=${TOKEN}`, { method: 'DELETE' });
  return r.ok || r.status === 404;
}

async function findContactByEmail(email) {
  const r = await fetch(`${BASE}/contacts?token=${TOKEN}&email=${encodeURIComponent(email)}`);
  if (!r.ok) return null;
  const d = await r.json();
  return (d.contacts || [])[0] || null;
}

async function upsertContactAndDeal(lead) {
  const email = EMAIL_FIXES[lead.email.toLowerCase()] || lead.email;
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

  // 1. Já existe contato? (sim no nosso caso — migração antiga criou eles)
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
    if (!dRes.ok) return { ok: false, error: `deal ${dRes.status}` };
    const d = await dRes.json();
    const dealId = d._id || d.id;

    // Vincula deal ao contato (sobrescrevendo — já apagamos os antigos)
    await fetch(`${BASE}/contacts/${contactId}?token=${TOKEN}`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ contact: { deal_ids: [dealId] } }),
    });

    return { ok: true, dealId, contactId, path: 'existing' };
  }

  // 2. Contato novo — POST /deals com contacts inline
  const dRes = await fetch(`${BASE}/deals?token=${TOKEN}`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ deal: dealBody, contacts: [contactInline] }),
  });
  if (!dRes.ok) return { ok: false, error: `deal ${dRes.status} ${await dRes.text().catch(()=>'')}` };
  const d = await dRes.json();
  return { ok: true, dealId: d._id || d.id, path: 'new' };
}

async function fixSupabaseTypos() {
  const supaHeaders = {
    apikey:         SUPA_KEY,
    Authorization:  `Bearer ${SUPA_KEY}`,
    'Content-Type': 'application/json',
    Prefer:         'return=representation',
  };
  let fixed = 0;
  for (const [bad, good] of Object.entries(EMAIL_FIXES)) {
    const url = `${SUPA_URL}/rest/v1/leads_sevilhaperfomance?email=eq.${encodeURIComponent(bad)}`;
    if (!COMMIT) {
      console.log(`    [DRY] ${bad} → ${good}`);
      continue;
    }
    const r = await fetch(url, {
      method:  'PATCH',
      headers: supaHeaders,
      body:    JSON.stringify({ email: good }),
    });
    if (r.ok) {
      const rows = await r.json();
      console.log(`    ✓ ${bad} → ${good}  (${rows.length} linhas)`);
      fixed += rows.length;
    } else {
      console.error(`    ✗ ${bad}: ${r.status} ${await r.text()}`);
    }
  }
  return fixed;
}

async function main() {
  console.log(`\n━━━━━━ MODO: ${COMMIT ? '🔥 COMMIT (destrutivo)' : '🧪 DRY-RUN'} ━━━━━━\n`);

  // ── FASE 0: coleta reais do Supabase ──
  console.log('━━━ Coleta Supabase ━━━');
  const sRes = await fetch(
    `${SUPA_URL}/rest/v1/leads_sevilhaperfomance?select=*&order=created_at.desc&limit=1000`,
    { headers: { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}` } }
  );
  const allLeads = sRes.ok ? await sRes.json() : [];
  const realLeads = allLeads.filter(l => !isTest(l.nome, l.email));

  // Dedupe por email mantendo a entrada MAIS RECENTE
  const byEmail = new Map();
  for (const l of realLeads) {
    const k = (EMAIL_FIXES[l.email.toLowerCase()] || l.email).toLowerCase();
    const prev = byEmail.get(k);
    if (!prev || new Date(l.created_at) > new Date(prev.created_at)) {
      byEmail.set(k, l);
    }
  }
  const realUnique = [...byEmail.values()];
  console.log(`  leads reais únicos: ${realUnique.length}`);

  // ── FASE 1: lista + apaga deals ──
  console.log('\n━━━ FASE 1: Apagar deals do pipeline ━━━');
  const deals = await fetchAllPipelineDeals();
  console.log(`  ${deals.length} deals encontrados`);

  if (!COMMIT) {
    console.log('  [DRY-RUN] — nenhum deal será apagado');
  } else {
    let del = 0, fail = 0;
    for (const d of deals) {
      const id = d._id || d.id;
      const ok = await deleteDeal(id);
      if (ok) del++; else fail++;
      process.stdout.write(`    apagando ${del}/${deals.length}\r`);
      await sleep(120);
    }
    console.log(`\n  ✓ apagados: ${del}  |  falhas: ${fail}`);
  }

  // ── FASE 2: cria deals reais ──
  console.log('\n━━━ FASE 2: Criar deals reais com Geraldo Tadeu como owner ━━━');

  const results = [];
  for (const lead of realUnique) {
    const email  = EMAIL_FIXES[lead.email.toLowerCase()] || lead.email;
    const fixed  = email !== lead.email ? ' ⚠ typo corrigido' : '';
    process.stdout.write(`  ${lead.nome?.trim() || '—'}  <${email}>${fixed} ... `);

    if (!COMMIT) {
      console.log('[DRY]');
      continue;
    }

    const r = await upsertContactAndDeal(lead);
    if (r.ok) {
      console.log(`✓ deal ${r.dealId} (${r.path})`);
      results.push({ email, ...r });
    } else {
      console.log(`✗ ${r.error}`);
      results.push({ email, ...r });
    }
    await sleep(300);
  }

  // ── FASE 3: corrige typos no Supabase ──
  console.log('\n━━━ FASE 3: Corrigir typos no Supabase ━━━');
  const fixed = await fixSupabaseTypos();
  if (COMMIT) console.log(`  ✓ ${fixed} linhas corrigidas`);

  // ── Resumo ──
  console.log('\n╔══════════════ RESUMO ══════════════╗');
  console.log(`  Modo:                  ${COMMIT ? 'COMMIT' : 'DRY-RUN'}`);
  console.log(`  Deals apagados:        ${COMMIT ? deals.length : `(${deals.length} seriam)`}`);
  console.log(`  Deals criados:         ${COMMIT ? results.filter(r => r.ok).length : `(${realUnique.length} seriam)`}`);
  console.log(`  Leads reais únicos:    ${realUnique.length}`);
  console.log(`  Emails corrigidos:     ${COMMIT ? fixed : '(2 seriam)'}`);
  console.log('╚═════════════════════════════════════╝\n');

  if (!COMMIT) {
    console.log('⚠  Dry-run. Para executar de verdade:');
    console.log('    node scripts/reset-crm-pipeline.js --commit\n');
  }
}

main().catch(err => { console.error('\nERRO FATAL:', err); process.exit(1); });
