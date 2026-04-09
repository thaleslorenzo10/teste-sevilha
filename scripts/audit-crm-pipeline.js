'use strict';

/**
 * AUDITORIA (READ-ONLY) do pipeline Clube da Performance.
 * Classifica deals em: real (bate com Supabase) vs teste/lixo.
 * NÃO apaga nada — salva audit-report.json.
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
const GERALDO   = '68e6e08c6c2ac10017538422';

if (!TOKEN) { console.error('RD_CRM_TOKEN ausente'); process.exit(1); }

// Heurísticas de lead "teste"
const TEST_NAME_RE  = /\b(teste|test|e2e|debug|dummy|fake|staging|lorenzo\s*media)\b/i;
const TEST_EMAIL_RE = /@(example\.com|test\.|lorenzomedia|sevilhaperformance\.com\.br$)/i;

function isTestLead(name, email) {
  if (!email) return true;
  if (TEST_NAME_RE.test(name  || '')) return true;
  if (TEST_EMAIL_RE.test(email || '')) return true;
  return false;
}

async function fetchAllDeals() {
  const out = [];
  let page = 1;
  while (true) {
    const url = `${BASE}/deals?token=${TOKEN}&deal_pipeline_id=${PIPE_ID}&page=${page}&limit=200`;
    const r = await fetch(url);
    if (!r.ok) { console.error(`  erro ${r.status} página ${page}`); break; }
    const d = await r.json();
    const list = d.deals || [];
    out.push(...list);
    if (!d.has_more || list.length === 0) break;
    page++;
    if (page > 30) break;
  }
  return out;
}

async function main() {
  console.log('\n━━━━━━ Pipeline Clube da Performance ━━━━━━');
  console.log(`  id: ${PIPE_ID}`);
  console.log(`  Geraldo Tadeu: ${GERALDO}\n`);

  const deals = await fetchAllDeals();
  console.log(`  total de deals no pipeline: ${deals.length}`);

  // Enriquecer — para cada deal, buscar contatos via /deals/:id/contacts (canônico)
  const enriched = [];
  for (let i = 0; i < deals.length; i++) {
    const d = deals[i];
    const dealId = d._id || d.id;
    const cRes = await fetch(`${BASE}/deals/${dealId}/contacts?token=${TOKEN}`);
    const cData = cRes.ok ? await cRes.json() : {};
    const contacts = cData.contacts || [];
    const primary = contacts[0] || {};

    enriched.push({
      id:          dealId,
      name:        d.name || '',
      created_at:  d.created_at,
      stageId:     d.deal_stage?._id || d.deal_stage?.id || null,
      stageName:   d.deal_stage?.name || '',
      ownerId:     d.user?._id || d.user?.id || null,
      ownerName:   d.user?.name || d.user?.email || '',
      contactId:   primary._id || primary.id || null,
      contactName: primary.name || '',
      email:       primary.emails?.[0]?.email || null,
      phone:       primary.phones?.[0]?.phone || null,
    });

    if ((i + 1) % 10 === 0) process.stdout.write(`  enriqueceu ${i + 1}/${deals.length}\r`);
    await new Promise(r => setTimeout(r, 60));
  }
  console.log(`  enriqueceu ${enriched.length}/${deals.length}          `);

  console.log('\n━━━━━━ Supabase (fonte da verdade) ━━━━━━');
  const sRes = await fetch(
    `${SUPA_URL}/rest/v1/leads_sevilhaperfomance?select=*&order=created_at.desc&limit=1000`,
    { headers: { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}` } }
  );
  const allLeads = sRes.ok ? await sRes.json() : [];

  const realLeads = allLeads.filter(l => !isTestLead(l.nome, l.email));
  const testLeads = allLeads.filter(l =>  isTestLead(l.nome, l.email));

  console.log(`  total no Supabase: ${allLeads.length}`);
  console.log(`  reais:             ${realLeads.length}`);
  console.log(`  teste (excluídos): ${testLeads.length}`);

  // Deduplica por email no Supabase, mantendo a entrada MAIS RECENTE
  const byEmail = new Map();
  for (const l of realLeads) {
    const k = l.email.toLowerCase();
    if (!byEmail.has(k)) byEmail.set(k, l);
  }
  const realUnique = [...byEmail.values()];
  console.log(`  reais únicos:      ${realUnique.length}`);

  console.log('\n  Reais únicos (mantidos):');
  for (const l of realUnique) {
    console.log(`    ${l.nome}  <${l.email}>  ${l.telefone}`);
  }

  console.log('\n  Teste (serão ignorados):');
  for (const l of testLeads) console.log(`    ${l.nome}  <${l.email}>`);

  console.log('\n━━━━━━ Classificação de deals ━━━━━━');
  const realEmails = new Set(realUnique.map(l => l.email.toLowerCase()));

  // 1. Deals de TESTE/LIXO = não têm email OU email é teste OU não bate com lista real
  const toDelete = [];
  // 2. Deals REAIS = agrupados por email; fica o MAIS RECENTE de cada grupo
  const realGroups = new Map();

  for (const d of enriched) {
    const em = (d.email || '').toLowerCase();
    if (!em || !realEmails.has(em) || isTestLead(d.name, d.email)) {
      toDelete.push(d);
      continue;
    }
    if (!realGroups.has(em)) realGroups.set(em, []);
    realGroups.get(em).push(d);
  }

  const dealsToKeep = [];
  const dealsToDeleteDup = [];
  for (const [em, list] of realGroups) {
    list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    dealsToKeep.push(list[0]);             // mais recente fica
    dealsToDeleteDup.push(...list.slice(1)); // resto vira lixo
  }

  const allToDelete = [...toDelete, ...dealsToDeleteDup];

  console.log(`  deals no pipeline:   ${enriched.length}`);
  console.log(`  DEL (teste/lixo):    ${toDelete.length}`);
  console.log(`  DEL (duplicado):     ${dealsToDeleteDup.length}`);
  console.log(`  DEL total:           ${allToDelete.length}`);
  console.log(`  KEEP (reais únicos): ${dealsToKeep.length}`);

  // Leads reais do Supabase que NÃO têm deal correspondente → serão criados
  const keepEmails = new Set(dealsToKeep.map(d => d.email.toLowerCase()));
  const toCreate = realUnique.filter(l => !keepEmails.has(l.email.toLowerCase()));
  console.log(`  NEW  (criar do zero):${toCreate.length}`);

  // Reais mantidos que precisam update: telefone ausente, owner errado, etc.
  const toUpdate = dealsToKeep.filter(d => !d.phone || d.ownerId !== GERALDO);
  console.log(`  UPD (corrigir reais):${toUpdate.length}`);

  console.log('\n  ── DEALS A MANTER (e atribuir ao Geraldo) ──');
  for (const d of dealsToKeep) {
    const owner = d.ownerId === GERALDO ? 'Geraldo ✓' : `${d.ownerName || 'sem owner'} → Geraldo`;
    const phone = d.phone ? '✓' : '✗ SEM';
    console.log(`    KEEP ${d.id}  "${d.name.slice(0, 28)}"  <${d.email}>  fone=${phone}  owner=${owner}`);
  }

  console.log('\n  ── DEALS A APAGAR (teste + duplicados + lixo) ──');
  for (const d of allToDelete.slice(0, 80)) {
    console.log(`    DEL  ${d.id}  "${(d.name || '').slice(0, 30)}"  email=${d.email || '—'}`);
  }
  if (allToDelete.length > 80) console.log(`    ... e mais ${allToDelete.length - 80}`);

  console.log('\n  ── LEADS REAIS A CRIAR (sem deal) ──');
  for (const l of toCreate) console.log(`    NEW  ${l.nome}  <${l.email}>  ${l.telefone}`);

  fs.writeFileSync(
    path.join(__dirname, 'audit-report.json'),
    JSON.stringify({
      pipeline:      { id: PIPE_ID, name: 'Clube da Performance' },
      geraldo:       GERALDO,
      allDealsInPipeline: enriched,
      supabaseAll:   allLeads,
      realUnique,
      plan: {
        keep:    dealsToKeep,
        delete:  allToDelete,
        create:  toCreate,
        update:  toUpdate,
      },
    }, null, 2)
  );
  console.log('\n✓ audit-report.json salvo em scripts/');

  console.log('\n╔══════════════════ RESUMO ══════════════════╗');
  console.log(`  Deals no pipeline hoje:      ${enriched.length.toString().padStart(3)}`);
  console.log(`  A APAGAR:                    ${allToDelete.length.toString().padStart(3)}`);
  console.log(`  A MANTER (+atribuir):        ${dealsToKeep.length.toString().padStart(3)}`);
  console.log(`  A CRIAR (novos reais):       ${toCreate.length.toString().padStart(3)}`);
  console.log(`  RESULTADO FINAL esperado:    ${(dealsToKeep.length + toCreate.length).toString().padStart(3)} deals`);
  console.log('╚════════════════════════════════════════════╝');
}

main().catch(err => { console.error('ERRO:', err); process.exit(1); });
