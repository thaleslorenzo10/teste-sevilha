'use strict';

const TOKEN = '68e66a4beedbfb0019530394';
const BASE  = 'https://crm.rdstation.com/api/v1';

// contactId → dealIds (todos os deals do mesmo lead, incluindo duplicatas)
const links = [
  { name: 'Guido',          contactId: '69d79d5db4afb4001d538b1a', dealIds: ['69d79c81b717dc0019e4a19f','69d530065724d000232317f1'] },
  { name: 'Jose ivaldo',    contactId: '69d79d5cdeb5800017ee21e7', dealIds: ['69d79c80deb580001bee2b4e','69d5300698fdef001aebae39'] },
  { name: 'Eumar vianei',   contactId: '69d79d5a7c8f3d00180180fa', dealIds: ['69d79c7f0bb97e001d9dce48','69d530077e5d76001390e044'] },
  { name: 'Gustavo',        contactId: '69d79d58da6ec70019b92c19', dealIds: ['69d79c7eda6ec70019b92a6d','69d5300a98fdef001aebae4c'] },
  { name: 'Maria das graças', contactId: '69d79d579d93e9001a479291', dealIds: ['69d79c7d9d93e9001a479078','69d5300b3d0aae0019802226'] },
  { name: 'Marley',         contactId: '69d79d562e8b56001dea4e6c', dealIds: ['69d79c7c2e8b560013ea464b','69d5300b5b05b300174d0418'] },
  { name: 'Carla Wanesa',   contactId: '69d79d56c332810013898ad8', dealIds: ['69d79c7bfed5c8001a19423d','69d57ef88a8426001324c55f'] },
  { name: 'Elaine Borges',  contactId: '69d79d55deb5800017ee21e0', dealIds: ['69d79c7aaff2c600133e055d','69d5c9464081f6001ac0fe8f'] },
  { name: 'Lúcia de Fátima', contactId: '69d79d54ec58920026cf0cf5', dealIds: ['69d79c78d14f6b0015706a25','69d6258471e9240018c4b015'] },
  { name: 'Thales Lorenzo', contactId: '69d79d512a2985002358bcdd', dealIds: ['69d7990c7c8f3d001e0171d9','69d655e1907afa0023598a54'] },
  { name: 'Alexsandra',     contactId: '69d79d52b4afb4001d538b15', dealIds: ['69d665df9a293900139a6785'] },
  { name: 'Keli Cordeiro',  contactId: '69d79d5391661900237209d8', dealIds: ['69d6519b52a2d4001a6cb78c'] },
  { name: 'Priscila Almeida', contactId: '69d79d592a2985001358aa1c', dealIds: ['69d53009e163ef0016810103'] },
  { name: 'Aloizio Ziareski', contactId: '69d79d5bb717dc0013e4b0a0', dealIds: ['69d53007569fe2002633d08e'] },
];

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  for (const { name, contactId, dealIds } of links) {
    for (const dealId of dealIds) {
      process.stdout.write(`→ ${name} (deal ${dealId.slice(-6)}) ... `);
      const res = await fetch(`${BASE}/deals/${dealId}?token=${TOKEN}`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ deal: { contact_id: contactId } }),
      });
      console.log(res.ok ? 'OK' : `ERRO ${res.status}`);
      await sleep(250);
    }
  }
  console.log('\nConcluído.');
}

main().catch(console.error);
