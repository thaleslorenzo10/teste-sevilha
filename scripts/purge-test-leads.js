'use strict';

/**
 * Apaga leads de teste da tabela leads_sevilhaperfomance no Supabase.
 *
 * Heurística "teste":
 *   - email em domínio claramente fake (example.com, test., @sevilhaperformance.com.br)
 *   - nome contém teste/test/e2e/debug/dummy/fake/staging/lorenzo media
 *   - email começa com tplorenzo (testes internos do próprio Thales)
 *   - email/telefone vazios
 *
 * Modo dry-run por padrão. Use --commit pra efetivar.
 */

const fs   = require('fs');
const path = require('path');

try {
  fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8')
    .split('\n').forEach(line => {
      const m = line.match(/^([A-Z_]+)=["']?([^"'\n]*)["']?$/);
      if (m) process.env[m[1]] = m[2];
    });
} catch (e) {}

const SUPA_URL  = process.env.SUPABASE_URL;
const SUPA_KEY  = process.env.SUPABASE_SERVICE_KEY;
const COMMIT    = process.argv.includes('--commit');

const TEST_NAME_RE  = /\b(teste|test|e2e|debug|dummy|fake|staging|lorenzo\s*media)\b/i;
const TEST_EMAIL_RE = /@(example\.com|test\.|lorenzomedia|sevilhaperformance\.com\.br$)/i;
const THALES_TEST_RE = /^tplorenzo/i;   // testes do Thales (emails pessoais de teste)

function classify(lead) {
  const nome  = (lead.nome  || '').trim();
  const email = (lead.email || '').trim();

  if (!email)                   return { test: true, reason: 'sem email' };
  if (TEST_EMAIL_RE.test(email)) return { test: true, reason: 'email fake domain' };
  if (TEST_NAME_RE.test(nome))   return { test: true, reason: 'nome com palavra de teste' };
  if (THALES_TEST_RE.test(email))return { test: true, reason: 'email tplorenzo* (teste interno)' };
  return { test: false };
}

async function supaFetch(pathAndQuery, init = {}) {
  const r = await fetch(SUPA_URL + '/rest/v1/' + pathAndQuery, {
    ...init,
    headers: {
      apikey:         SUPA_KEY,
      Authorization:  `Bearer ${SUPA_KEY}`,
      'Content-Type': 'application/json',
      Prefer:         'return=representation',
      ...(init.headers || {}),
    },
  });
  if (!r.ok) throw new Error(`${init.method || 'GET'} ${pathAndQuery} → ${r.status} ${await r.text()}`);
  return r.json();
}

async function main() {
  console.log(`━━━ Modo: ${COMMIT ? '\x1b[31mCOMMIT (apaga de verdade)\x1b[0m' : '\x1b[33mDRY RUN (só mostra)\x1b[0m'} ━━━\n`);

  const all = await supaFetch('leads_sevilhaperfomance?select=*&order=created_at.desc&limit=2000');
  console.log(`Total de leads no Supabase: ${all.length}\n`);

  const tests = [];
  const reals = [];
  for (const l of all) {
    const c = classify(l);
    if (c.test) tests.push({ ...l, _reason: c.reason });
    else        reals.push(l);
  }

  console.log(`\x1b[32m✓ Leads reais (mantidos):      ${reals.length}\x1b[0m`);
  console.log(`\x1b[31m✗ Leads de teste (a apagar):   ${tests.length}\x1b[0m\n`);

  if (reals.length > 0) {
    console.log('━━━ Reais que serão MANTIDOS ━━━');
    for (const l of reals) {
      console.log(`  ${l.created_at.substring(0,10)} | ${(l.nome || '—').substring(0,30).padEnd(30)} | ${l.email}`);
    }
    console.log();
  }

  if (tests.length > 0) {
    console.log('━━━ Testes que serão APAGADOS ━━━');
    for (const l of tests) {
      console.log(`  ${l.id.substring(0,8)}… | ${l.created_at.substring(0,10)} | ${(l.nome || '—').substring(0,25).padEnd(25)} | ${(l.email || '—').substring(0,35).padEnd(35)} | ${l._reason}`);
    }
    console.log();
  }

  if (!COMMIT) {
    console.log(`\x1b[33m⚠ DRY RUN — nada foi apagado.\x1b[0m`);
    console.log(`Pra efetivar: node scripts/purge-test-leads.js --commit\n`);
    return;
  }

  if (tests.length === 0) {
    console.log('Nada pra apagar.');
    return;
  }

  console.log(`━━━ Apagando ${tests.length} leads ━━━`);
  const ids = tests.map(t => t.id);
  const idList = ids.map(id => `"${id}"`).join(',');
  const deleted = await supaFetch(
    `leads_sevilhaperfomance?id=in.(${idList})`,
    { method: 'DELETE' }
  );
  console.log(`✓ Apagados: ${deleted.length}/${tests.length}\n`);

  // Verificação pós-delete
  const after = await supaFetch('leads_sevilhaperfomance?select=id,email,nome&order=created_at.desc&limit=2000');
  console.log(`Verificação pós-delete: ${after.length} leads restantes no Supabase`);

  const stillTest = after.filter(l => classify(l).test);
  if (stillTest.length > 0) {
    console.log(`\x1b[31m✗ ATENÇÃO: ${stillTest.length} teste(s) ainda presente(s):\x1b[0m`);
    for (const l of stillTest) console.log(`  ${l.id} ${l.email}`);
    process.exit(1);
  }
  console.log(`\x1b[32m✓ Nenhum teste restante.\x1b[0m`);
}

main().catch(err => { console.error('ERRO:', err); process.exit(1); });
