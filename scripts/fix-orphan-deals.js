'use strict';

/**
 * Conserta 2 deals órfãos criados pelos testes de produção do usuário
 * (antes do fix estar deployado em produção).
 *
 * Pra cada deal órfão:
 *   - busca/cria contato correspondente via email do Supabase
 *   - vincula o deal ao contato via PUT /contacts/:id deal_ids
 *   - atribui owner = Geraldo
 *   - garante stage = Pré-inscritos
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

const TOKEN     = process.env.RD_CRM_TOKEN;
const BASE      = 'https://crm.rdstation.com/api/v1';
const SUPA_URL  = process.env.SUPABASE_URL;
const SUPA_KEY  = process.env.SUPABASE_SERVICE_KEY;

const STAGE_PRE = '69d52f54c0b8000015d2e7bb';
const GERALDO   = '68e6e08c6c2ac10017538422';

const ORPHANS = [
  { dealId: '69d7be4f1dfee2001c3a1a3f', email: 'tplorenzo45@gmail.com' },
  { dealId: '69d7be8f935b5c0016e80ff0', email: 'tplorenzo41215@gmail.com' },
];

function normalizePhone(raw) {
  if (!raw) return '';
  const d = String(raw).replace(/\D+/g, '');
  if (!d) return '';
  if (d.startsWith('55') && d.length >= 12) return d;
  return '55' + d;
}

async function fetchJson(url, init) {
  const r = await fetch(url, init);
  if (!r.ok) throw new Error(`${init?.method || 'GET'} ${url} → ${r.status} ${await r.text().catch(()=>'')}`);
  return r.json();
}

async function main() {
  for (const orphan of ORPHANS) {
    console.log(`\n━━━ Deal ${orphan.dealId} (${orphan.email}) ━━━`);

    // 1. pega dado do lead do Supabase
    const sRes = await fetch(
      `${SUPA_URL}/rest/v1/leads_sevilhaperfomance?select=*&email=eq.${encodeURIComponent(orphan.email)}&order=created_at.desc&limit=1`,
      { headers: { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}` } }
    );
    const leads = await sRes.json();
    if (!leads.length) { console.log('  ✗ lead não encontrado no Supabase'); continue; }
    const lead = leads[0];
    const phone = normalizePhone(lead.telefone);
    console.log(`  lead: ${lead.nome} tel=${phone}`);

    // 2. busca contato por email
    let contactId = null;
    const cRes = await fetch(`${BASE}/contacts?token=${TOKEN}&email=${encodeURIComponent(orphan.email)}`);
    if (cRes.ok) {
      const c = await cRes.json();
      const found = (c.contacts || [])[0];
      if (found) contactId = found._id || found.id;
    }

    // 3. se não existe, cria
    if (!contactId) {
      const body = {
        contact: {
          name: lead.nome?.trim() || orphan.email,
          emails: [{ email: orphan.email }],
          phones: phone ? [{ phone, type: 'cellphone' }] : [],
        }
      };
      const ncRes = await fetch(`${BASE}/contacts?token=${TOKEN}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!ncRes.ok) { console.log('  ✗ erro criando contato:', await ncRes.text()); continue; }
      const nc = await ncRes.json();
      contactId = nc._id || nc.id;
      console.log(`  ✓ contato criado: ${contactId}`);
    } else {
      // atualiza nome/telefone
      await fetch(`${BASE}/contacts/${contactId}?token=${TOKEN}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contact: {
            name: lead.nome?.trim() || orphan.email,
            emails: [{ email: orphan.email }],
            phones: phone ? [{ phone, type: 'cellphone' }] : [],
          }
        }),
      });
      console.log(`  ✓ contato existente atualizado: ${contactId}`);
    }

    // 4. vincula o deal ao contato (merge com deal_ids atuais)
    const gRes = await fetch(`${BASE}/contacts/${contactId}?token=${TOKEN}`);
    const currentContact = gRes.ok ? await gRes.json() : {};
    const currentIds = (currentContact.deal_ids || [])
      .map(d => typeof d === 'string' ? d : (d._id || d.id))
      .filter(Boolean);
    const newIds = currentIds.includes(orphan.dealId) ? currentIds : [...currentIds, orphan.dealId];

    await fetch(`${BASE}/contacts/${contactId}?token=${TOKEN}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contact: { deal_ids: newIds } }),
    });
    console.log(`  ✓ deal vinculado (deal_ids=${newIds.length})`);

    // 5. atribui owner = Geraldo e garante stage
    const uRes = await fetch(`${BASE}/deals/${orphan.dealId}?token=${TOKEN}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deal: { user_id: GERALDO, deal_stage_id: STAGE_PRE } }),
    });
    if (!uRes.ok) { console.log('  ✗ erro atualizando deal:', await uRes.text()); continue; }
    console.log('  ✓ deal atribuído ao Geraldo');

    // 6. verifica via /deals/:id/contacts
    const vRes = await fetch(`${BASE}/deals/${orphan.dealId}/contacts?token=${TOKEN}`);
    const v = vRes.ok ? await vRes.json() : {};
    const contacts = v.contacts || [];
    const emails = contacts.flatMap(c => (c.emails || []).map(e => e.email)).join(',') || '—';
    const phones = contacts.flatMap(c => (c.phones || []).map(p => p.phone)).join(',') || '—';
    console.log(`  → verificação: email=${emails} tel=${phones}`);
  }
}

main().catch(err => { console.error('ERRO:', err); process.exit(1); });
