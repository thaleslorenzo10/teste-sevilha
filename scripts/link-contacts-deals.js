'use strict';

const TOKEN = '68e66a4beedbfb0019530394';
const BASE  = 'https://crm.rdstation.com/api/v1';

// Mapeamento: contactId → dealId (dos scripts anteriores)
const links = [
  // deals criados no primeiro script (update-crm-contacts encontrou)
  { email: 'kelicordeiro@yahoo.com.br',              contactId: '69d79d5391661900237209d8', dealId: '6987384083d8e200013208b3' },
  { email: 'priverras@hotmail.com',                  contactId: '69d79d592a2985001358aa1c', dealId: '69a8f0dfc0f7980001a77f9e' },
  { email: 'castro@essencialecontabilidade.com.br',  contactId: '69d79d5bb717dc0013e4b0a0', dealId: '69c4838909a7840001668efe' },
  // deals criados no segundo script (create-missing-crm-deals)
  { email: 'luciacontabeis2014@hotmail.com',         contactId: '69d79d54ec58920026cf0cf5', dealId: '69d79c78d14f6b0015706a25' },
  { email: 'elaine.borges@totalgestconsultoria.com', contactId: '69d79d55deb5800017ee21e0', dealId: '69d79c7aaff2c600133e055d' },
  { email: 'lckcontabil2019@gmail.com',              contactId: '69d79d56c332810013898ad8', dealId: '69d79c7bfed5c8001a19423d' },
  { email: 'marleynovo@hotmail.com',                 contactId: '69d79d562e8b56001dea4e6c', dealId: '69d79c7c2e8b560013ea464b' },
  { email: 'graca.contabil@hotail.com',              contactId: '69d79d579d93e9001a479291', dealId: '69d79c7d9d93e9001a479078' },
  { email: 'gdossantosrodrigues02@gmail.com',        contactId: '69d79d58da6ec70019b92c19', dealId: '69d79c7eda6ec70019b92a6d' },
  { email: 'eumarvianei@gmail.com',                  contactId: '69d79d5a7c8f3d00180180fa', dealId: '69d79c7f0bb97e001d9dce48' },
  { email: 'cavalcanti.ivaldo@uol.com.br',           contactId: '69d79d5cdeb5800017ee21e7', dealId: '69d79c80deb580001bee2b4e' },
  { email: 'guido_paulino@yahoo.com.br',             contactId: '69d79d5db4afb4001d538b1a', dealId: '69d79c81b717dc0019e4a19f' },
  // Thales e Alexsandra — deals do CRM antigo (encontrados pelo update-crm-contacts)
  { email: 'tplorenzo45@gmail.com',                  contactId: '69d79d512a2985002358bcdd', dealId: '6930576987f2bd0001809c88' },
  { email: 'alexsandrahenrique@hotmail.com',         contactId: '69d79d52b4afb4001d538b15', dealId: '69d67d05f78083000155f6e8' },
];

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  for (const { email, contactId, dealId } of links) {
    process.stdout.write(`→ ${email} ... `);

    const res = await fetch(`${BASE}/deals/${dealId}?token=${TOKEN}`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ deal: { contact_id: contactId } }),
    });

    if (res.ok) {
      console.log(`OK`);
    } else {
      console.error(`ERRO ${res.status}:`, await res.text());
    }

    await sleep(300);
  }

  console.log('\nConcluído.');
}

main().catch(console.error);
