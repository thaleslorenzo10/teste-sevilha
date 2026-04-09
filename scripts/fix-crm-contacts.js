'use strict';

/**
 * Para cada lead do Supabase:
 * 1. Cria contato no CRM com email + telefone
 * 2. Localiza o deal existente pelo nome/email
 * 3. Vincula o contato ao deal via PUT /deals/:id
 */

const TOKEN = '68e66a4beedbfb0019530394';
const BASE  = 'https://crm.rdstation.com/api/v1';

const leads = [
  { nome: 'Thales P Lorenzo',   email: 'tplorenzo45@gmail.com',                       telefone: '21996842535' },
  { nome: 'Alexsandra',         email: 'alexsandrahenrique@hotmail.com',              telefone: '85999974172' },
  { nome: 'Keli Cordeiro',      email: 'kelicordeiro@yahoo.com.br',                   telefone: '11980993219' },
  { nome: 'Lúcia de Fátima',    email: 'luciacontabeis2014@hotmail.com',             telefone: '55992710414' },
  { nome: 'Elaine Borges',      email: 'elaine.borges@totalgestconsultoria.com',     telefone: '21996266425' },
  { nome: 'Carla Wanesa',       email: 'lckcontabil2019@gmail.com',                  telefone: '62996284714' },
  { nome: 'Marley',             email: 'marleynovo@hotmail.com',                     telefone: '55929919868' },
  { nome: 'Maria das graças',   email: 'graca.contabil@hotail.com',                  telefone: '75991362679' },
  { nome: 'Gustavo',            email: 'gdossantosrodrigues02@gmail.com',            telefone: '16992484274' },
  { nome: 'Priscila Almeida',   email: 'priverras@hotmail.com',                      telefone: '11994203566' },
  { nome: 'Eumar vianei',       email: 'eumarvianei@gmail.com',                      telefone: '67992359650' },
  { nome: 'Aloizio Ziareski',   email: 'castro@essencialecontabilidade.com.br',      telefone: '42999191005' },
  { nome: 'Jose ivaldo',        email: 'cavalcanti.ivaldo@uol.com.br',               telefone: '11973934188' },
  { nome: 'Guido',              email: 'guido_paulino@yahoo.com.br',                 telefone: '5521979039' },
];

async function upsertContact(lead) {
  // Tenta criar
  const res = await fetch(`${BASE}/contacts?token=${TOKEN}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contact: {
        name:   lead.nome,
        emails: [{ email: lead.email }],
        phones: [{ phone: lead.telefone, type: 'cellphone' }],
      },
    }),
  });

  if (res.ok) {
    const c = await res.json();
    return c._id;
  }

  // 422 = duplicado — busca pelo email
  if (res.status === 422) {
    const s = await fetch(`${BASE}/contacts?token=${TOKEN}&email=${encodeURIComponent(lead.email)}`);
    if (s.ok) {
      const data = await s.json();
      const found = (data.contacts || [])[0];
      if (found) {
        // Atualiza com telefone
        await fetch(`${BASE}/contacts/${found._id}?token=${TOKEN}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contact: {
              name:   lead.nome,
              emails: [{ email: lead.email }],
              phones: [{ phone: lead.telefone, type: 'cellphone' }],
            },
          }),
        });
        return found._id;
      }
    }
  }

  console.error('  [contato erro]', res.status, await res.text().catch(() => ''));
  return null;
}

async function findDealByEmail(email) {
  // Busca pelo contato e pega o deal_id
  const s = await fetch(`${BASE}/contacts?token=${TOKEN}&email=${encodeURIComponent(email)}`);
  if (!s.ok) return null;
  const data = await s.json();
  const contact = (data.contacts || [])[0];
  if (!contact) return null;
  return (contact.deal_ids || [])[0] || null;
}

async function linkContactToDeal(dealId, contactId) {
  // PUT /deals/:id com contact_id
  const res = await fetch(`${BASE}/deals/${dealId}?token=${TOKEN}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deal: { contact_id: contactId } }),
  });
  return res.ok;
}

async function main() {
  const unique = [...new Map(leads.map(l => [l.email, l])).values()];

  for (const lead of unique) {
    process.stdout.write(`→ ${lead.email} ... `);

    const contactId = await upsertContact(lead);
    if (!contactId) {
      console.log('FALHOU ao criar/encontrar contato');
      await sleep(400);
      continue;
    }

    // Busca deal vinculado ao contato (atualizado)
    const dealId = await findDealByEmail(lead.email);
    if (dealId) {
      const linked = await linkContactToDeal(dealId, contactId);
      console.log(linked ? `OK — contato ${contactId} → deal ${dealId}` : `contato criado mas link falhou`);
    } else {
      console.log(`contato ${contactId} criado — sem deal localizado (ok se for novo)`);
    }

    await sleep(400);
  }

  console.log('\nConcluído.');
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

main().catch(console.error);
