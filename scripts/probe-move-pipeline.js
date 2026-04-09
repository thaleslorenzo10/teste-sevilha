'use strict';

const fs = require('fs'), path = require('path');
fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8')
  .split('\n').forEach(l => { const m = l.match(/^([A-Z_]+)=["']?([^"'\n]*)["']?$/); if (m) process.env[m[1]] = m[2]; });
const TOKEN = process.env.RD_CRM_TOKEN;
const BASE  = 'https://crm.rdstation.com/api/v1';
const CDP_PIPE  = '69d52f54c0b8000015d2e7b9';
const DEFAULT_PIPE = '68d152fa949ae20022df32cb'; // Funil Padrão

(async () => {
  // 1. Lista stages de TODOS os pipelines
  const r = await fetch(`${BASE}/deal_stages?token=${TOKEN}&limit=200`);
  const d = await r.json();
  console.log(`Total stages: ${(d.deal_stages || []).length}\n`);

  console.log('Stages por pipeline:');
  const byPipe = new Map();
  for (const s of d.deal_stages || []) {
    const pipeId = s.deal_pipeline?.id || s.deal_pipeline?._id;
    const pipeName = s.deal_pipeline?.name;
    if (!byPipe.has(pipeId)) byPipe.set(pipeId, { name: pipeName, stages: [] });
    byPipe.get(pipeId).stages.push(s);
  }
  for (const [pid, info] of byPipe) {
    console.log(`\n  ${pid}  ${info.name}`);
    for (const s of info.stages) console.log(`    - ${s._id}  ${s.name}  (order ${s.order})`);
  }

  // 2. Verifica motivos de perda (lost reasons)
  console.log('\n\nLost reasons:');
  const lr = await fetch(`${BASE}/deal_lost_reasons?token=${TOKEN}`);
  if (lr.ok) {
    const lrData = await lr.json();
    const arr = lrData.deal_lost_reasons || lrData || [];
    for (const x of arr) console.log(`  ${x._id || x.id}  ${x.name}`);
  } else console.log(`  erro ${lr.status}`);

  // 3. TESTE: pega um deal antigo e tenta movê-lo pro Funil Padrão
  const oldDealId = '69d79c81b717dc0019e4a19f'; // Guido antigo
  console.log(`\n\nTeste de mover ${oldDealId} (Guido antigo) para Funil Padrão`);
  const defaultStages = (byPipe.get(DEFAULT_PIPE) || {}).stages || [];
  if (!defaultStages.length) { console.log('  Funil Padrão não encontrado'); process.exit(1); }
  const targetStage = defaultStages[0]._id;
  console.log(`  stage alvo: ${targetStage}  ${defaultStages[0].name}`);

  const move = await fetch(`${BASE}/deals/${oldDealId}?token=${TOKEN}`, {
    method:  'PUT',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ deal: { deal_stage_id: targetStage } }),
  });
  console.log(`  PUT status: ${move.status}`);

  await new Promise(r => setTimeout(r, 1500));

  // Confirma
  const g = await fetch(`${BASE}/deals/${oldDealId}?token=${TOKEN}`);
  if (g.ok) {
    const dj = await g.json();
    console.log(`  depois: deal_stage.id = ${dj.deal_stage?.id || dj.deal_stage?._id}`);
    console.log(`  pipeline: ${dj.deal_stage?.deal_pipeline?.name || '?'}`);
  }

  // Verifica se sumiu do CDP
  const cdp = await fetch(`${BASE}/deals?token=${TOKEN}&deal_pipeline_id=${CDP_PIPE}&limit=200`);
  const cdpData = cdp.ok ? await cdp.json() : { deals: [] };
  const stillInCDP = (cdpData.deals || []).some(d => (d._id || d.id) === oldDealId);
  console.log(`  ainda no CDP? ${stillInCDP ? 'SIM ✗' : 'NÃO ✓'}`);

  // 4. Também testa marcar como "lost"
  const lostDealId = '69d79c80deb580001bee2b4e'; // Jose ivaldo antigo
  console.log(`\nTeste de marcar ${lostDealId} como lost (win=false)`);
  const lost = await fetch(`${BASE}/deals/${lostDealId}?token=${TOKEN}`, {
    method:  'PUT',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ deal: { win: false, closed_at: new Date().toISOString() } }),
  });
  console.log(`  PUT status: ${lost.status}`);
  await new Promise(r => setTimeout(r, 1500));
  const g2 = await fetch(`${BASE}/deals/${lostDealId}?token=${TOKEN}`);
  if (g2.ok) {
    const dj = await g2.json();
    console.log(`  depois: win=${dj.win}  closed_at=${dj.closed_at}  markup=${dj.markup}`);
  }
  const cdp2 = await fetch(`${BASE}/deals?token=${TOKEN}&deal_pipeline_id=${CDP_PIPE}&limit=200`);
  const cdp2Data = cdp2.ok ? await cdp2.json() : { deals: [] };
  const stillInCDP2 = (cdp2Data.deals || []).some(d => (d._id || d.id) === lostDealId);
  console.log(`  ainda no CDP? ${stillInCDP2 ? 'SIM (aparece)' : 'NÃO (sumiu da listagem)'}`);
})();
