'use strict';

/**
 * Verificação READ-ONLY pós-reset.
 * Confirma que:
 *  - pipeline Clube da Performance tem exatamente N deals esperados
 *  - todos têm email + telefone
 *  - todos estão atribuídos ao Geraldo Tadeu
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

const TOKEN   = process.env.RD_CRM_TOKEN;
const BASE    = 'https://crm.rdstation.com/api/v1';
const PIPE_ID = '69d52f54c0b8000015d2e7b9';
const GERALDO = '68e6e08c6c2ac10017538422';

async function main() {
  const r = await fetch(`${BASE}/deals?token=${TOKEN}&deal_pipeline_id=${PIPE_ID}&limit=200`);
  const d = await r.json();
  const deals = d.deals || [];

  console.log(`\nDeals no pipeline Clube da Performance: ${deals.length}\n`);

  let okEmail = 0, okPhone = 0, okOwner = 0;
  const failures = [];

  for (const deal of deals) {
    const dealId = deal._id || deal.id;
    const cRes = await fetch(`${BASE}/deals/${dealId}/contacts?token=${TOKEN}`);
    const cData = cRes.ok ? await cRes.json() : {};
    const primary = (cData.contacts || [])[0] || {};

    const email   = primary.emails?.[0]?.email || null;
    const phone   = primary.phones?.[0]?.phone || null;
    const ownerId = deal.user?._id || deal.user?.id || null;
    const isGeraldo = ownerId === GERALDO;

    if (email) okEmail++;
    if (phone) okPhone++;
    if (isGeraldo) okOwner++;

    const e = email ? '✓' : '✗';
    const p = phone ? '✓' : '✗';
    const o = isGeraldo ? '✓' : '✗';
    console.log(`  [${e}e ${p}p ${o}owner] ${(deal.name || '').padEnd(35)} ${email || '—'}  ${phone || '—'}`);

    if (!email || !phone || !isGeraldo) {
      failures.push({ dealId, name: deal.name, email, phone, ownerId });
    }
    await new Promise(r => setTimeout(r, 80));
  }

  console.log('\n╔══════════════════ VERIFICAÇÃO ══════════════════╗');
  console.log(`  Total deals:               ${deals.length.toString().padStart(3)}`);
  console.log(`  Com email:                 ${okEmail.toString().padStart(3)}/${deals.length}`);
  console.log(`  Com telefone:              ${okPhone.toString().padStart(3)}/${deals.length}`);
  console.log(`  Owner = Geraldo Tadeu:     ${okOwner.toString().padStart(3)}/${deals.length}`);
  console.log('╚══════════════════════════════════════════════════╝');

  if (failures.length) {
    console.log('\n⚠ Deals com problema:');
    for (const f of failures) console.log(`  ${f.dealId}  ${f.name}  email=${f.email}  phone=${f.phone}  owner=${f.ownerId}`);
    process.exit(1);
  } else {
    console.log('\n✅ TUDO OK');
  }
}

main().catch(err => { console.error('ERRO:', err); process.exit(1); });
