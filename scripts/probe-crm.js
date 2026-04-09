'use strict';
const fs = require('fs'), path = require('path');
fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8')
  .split('\n').forEach(l => { const m = l.match(/^([A-Z_]+)=["']?([^"'\n]*)["']?$/); if (m) process.env[m[1]] = m[2]; });
const TOKEN = process.env.RD_CRM_TOKEN;
const BASE  = 'https://crm.rdstation.com/api/v1';
const PIPE  = '69d52f54c0b8000015d2e7b9';

(async () => {
  // 1. deal_stages
  const r1 = await fetch(`${BASE}/deal_stages?token=${TOKEN}`);
  const d1 = await r1.json();
  console.log('GET /deal_stages status:', r1.status, 'keys:', Object.keys(d1));
  console.log('first 400 chars:', JSON.stringify(d1).slice(0, 400));

  // 2. filter by pipeline
  const r2 = await fetch(`${BASE}/deal_stages?token=${TOKEN}&deal_pipeline_id=${PIPE}`);
  const d2 = await r2.json();
  console.log('\nGET /deal_stages?deal_pipeline_id=... status:', r2.status);
  console.log('keys:', Object.keys(d2));
  console.log('first 1500 chars:', JSON.stringify(d2).slice(0, 1500));

  // 3. deals filtered by pipeline
  const r3 = await fetch(`${BASE}/deals?token=${TOKEN}&deal_pipeline_id=${PIPE}&limit=3`);
  const d3 = await r3.json();
  console.log('\nGET /deals?deal_pipeline_id=... status:', r3.status);
  console.log('keys:', Object.keys(d3));
  const list = d3.deals || [];
  console.log(`total deals: ${d3.total || list.length}`);
  if (list.length) console.log('sample:', JSON.stringify(list[0], null, 2).slice(0, 2000));
})();
