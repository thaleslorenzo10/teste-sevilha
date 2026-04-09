'use strict';

/**
 * Atualiza contatos existentes no RD CRM com email e telefone corretos
 * Busca cada lead do Supabase, localiza o contato no CRM e faz PATCH
 */

const CRM_TOKEN = '68e66a4beedbfb0019530394';

// Leads do Supabase (excluindo testes internos)
const leads = [
  { nome: 'Thales P Lorenzo',     email: 'tplorenzo45@gmail.com',                       telefone: '(21) 99684-2535' },
  { nome: 'Alexsandra',           email: 'alexsandrahenrique@hotmail.com',              telefone: '85999974172' },
  { nome: 'Keli Cordeiro',        email: 'kelicordeiro@yahoo.com.br',                   telefone: '(11) 98099-3219' },
  { nome: 'Lúcia de Fátima',      email: 'luciacontabeis2014@hotmail.com',             telefone: '(55) 99271-0414' },
  { nome: 'Elaine Borges',        email: 'elaine.borges@totalgestconsultoria.com',     telefone: '+21996266425' },
  { nome: 'Carla Wanesa',         email: 'lckcontabil2019@gmail.com',                  telefone: '(62) 99628-4714' },
  { nome: 'Marley',               email: 'marleynovo@hotmail.com',                     telefone: '(55) 92991-9868' },
  { nome: 'Maria das graças',     email: 'graca.contabil@hotail.com',                  telefone: '(75) 99136-2679' },
  { nome: 'Gustavo',              email: 'gdossantosrodrigues02@gmail.com',            telefone: '(16) 99248-4274' },
  { nome: 'Priscila Almeida',     email: 'priverras@hotmail.com',                      telefone: '(11) 99420-3566' },
  { nome: 'Eumar vianei',         email: 'eumarvianei@gmail.com',                      telefone: '67992359650' },
  { nome: 'Aloizio Ziareski',     email: 'castro@essencialecontabilidade.com.br',      telefone: '+55 (42) 99919-1005' },
  { nome: 'Jose ivaldo',          email: 'cavalcanti.ivaldo@uol.com.br',               telefone: '11973934188' },
  { nome: 'Guido',                email: 'guido_paulino@yahoo.com.br',                 telefone: '(55) 21979-0039' },
];

async function findContact(email) {
  const url = `https://crm.rdstation.com/api/v1/contacts?token=${CRM_TOKEN}&email=${encodeURIComponent(email)}`;
  const res = await fetch(url);
  if (!res.ok) {
    console.error(`  [busca erro] ${res.status} ${await res.text()}`);
    return null;
  }
  const data = await res.json();
  // API retorna { contacts: [...] }
  const list = data.contacts || data;
  return Array.isArray(list) && list.length > 0 ? list[0] : null;
}

async function updateContact(contactId, email, telefone) {
  const url = `https://crm.rdstation.com/api/v1/contacts/${contactId}?token=${CRM_TOKEN}`;
  const body = {
    contact: {
      emails: [{ email }],
      phones: [{ phone: telefone, type: 'cellphone' }],
    },
  };
  const res = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    console.error(`  [update erro] ${res.status} ${await res.text()}`);
    return false;
  }
  return true;
}

async function main() {
  // deduplica por email
  const unique = [...new Map(leads.map(l => [l.email, l])).values()];

  for (const lead of unique) {
    process.stdout.write(`→ ${lead.email} ... `);
    const contact = await findContact(lead.email);
    if (!contact) {
      console.log('não encontrado no CRM — pulando');
      continue;
    }
    const ok = await updateContact(contact._id, lead.email, lead.telefone);
    console.log(ok ? `OK (id=${contact._id})` : 'FALHOU');
    await new Promise(r => setTimeout(r, 300)); // throttle
  }

  console.log('\nConcluído.');
}

main().catch(console.error);
