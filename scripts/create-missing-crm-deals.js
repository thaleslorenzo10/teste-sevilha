'use strict';

const CRM_TOKEN = '68e66a4beedbfb0019530394';

const missing = [
  { nome: 'Lúcia de Fátima',   email: 'luciacontabeis2014@hotmail.com',        telefone: '(55) 99271-0414', utm_source: 'Instagram_Feed',        utm_campaign: '[CP] [CAPTAÇÃO] [COLD] [V1] - Teste de Página', utm_content: 'AD01', utm_medium: 'Público Advantage+' },
  { nome: 'Elaine Borges',     email: 'elaine.borges@totalgestconsultoria.com', telefone: '+21996266425',   utm_source: 'Instagram_Feed',        utm_campaign: '[CP] [CAPTAÇÃO] [COLD] [V1] - Teste de Página', utm_content: 'AD01', utm_medium: 'Público Advantage+' },
  { nome: 'Carla Wanesa',      email: 'lckcontabil2019@gmail.com',              telefone: '(62) 99628-4714', utm_source: 'Instagram_Stories',    utm_campaign: '[CP] [CAPTAÇÃO] [HOT] [V1] - Teste de Página',  utm_content: 'AD01', utm_medium: 'Warm' },
  { nome: 'Marley',            email: 'marleynovo@hotmail.com',                 telefone: '(55) 92991-9868', utm_source: 'Facebook_Mobile_Feed', utm_campaign: '[CP] [CAPTAÇÃO] [COLD] [V1] - Teste de Página', utm_content: 'AD01', utm_medium: 'Público Advantage+' },
  { nome: 'Maria das graças',  email: 'graca.contabil@hotail.com',              telefone: '(75) 99136-2679', utm_source: 'Instagram_Stories',    utm_campaign: '[CP] [CAPTAÇÃO] [HOT] [V1] - Teste de Página',  utm_content: 'AD01', utm_medium: 'Warm' },
  { nome: 'Gustavo',           email: 'gdossantosrodrigues02@gmail.com',        telefone: '(16) 99248-4274', utm_source: 'Instagram_Stories',    utm_campaign: '[CP] [CAPTAÇÃO] [HOT] [V1] - Teste de Página',  utm_content: 'AD01', utm_medium: 'Warm' },
  { nome: 'Eumar vianei',      email: 'eumarvianei@gmail.com',                  telefone: '67992359650',    utm_source: 'Facebook_Mobile_Reels', utm_campaign: '[CP] [CAPTAÇÃO] [COLD] [V1] - Teste de Página', utm_content: 'AD01', utm_medium: 'Público Advantage+' },
  { nome: 'Jose ivaldo',       email: 'cavalcanti.ivaldo@uol.com.br',           telefone: '11973934188',    utm_source: 'Facebook_Mobile_Feed', utm_campaign: '[CP] [CAPTAÇÃO] [HOT] [V1] - Teste de Página',  utm_content: 'AD01', utm_medium: 'Warm' },
  { nome: 'Guido',             email: 'guido_paulino@yahoo.com.br',             telefone: '(55) 21979-0039', utm_source: 'Instagram_Reels',     utm_campaign: '[CP] [CAPTAÇÃO] [COLD] [V1] - Teste de Página', utm_content: 'AD01', utm_medium: 'Público Advantage+' },
];

async function createDeal(data) {
  const deal = {
    name: data.nome,
    deal_stage_id:  '69d52f54c0b8000015d2e7bb',
    deal_source_id: '68e5c150af14bb00013f8acb',
    campaign_id:    '69d52f437e5d76001a90e080',
    contacts_attributes: [{
      name:   data.nome,
      emails: [{ email: data.email }],
      phones: [{ phone: data.telefone, type: 'cellphone' }],
    }],
    deal_custom_fields: [
      { custom_field_id: '68e6668a5621790019a1ad6d', value: data.utm_source   || '' },
      { custom_field_id: '68e6669152f4a7001f8d9f8f', value: data.utm_campaign || '' },
      { custom_field_id: '68e666990450fa001e3e70f5', value: data.utm_content  || '' },
      { custom_field_id: '68e666a608aace0019e118a1', value: data.utm_medium   || '' },
    ].filter(f => f.value),
  };

  const res = await fetch(`https://crm.rdstation.com/api/v1/deals?token=${CRM_TOKEN}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deal }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error(`  ERRO ${res.status}: ${err}`);
    return null;
  }
  const d = await res.json();
  return d._id;
}

async function main() {
  for (const lead of missing) {
    process.stdout.write(`→ ${lead.email} ... `);
    const id = await createDeal(lead);
    console.log(id ? `OK (deal ${id})` : 'FALHOU');
    await new Promise(r => setTimeout(r, 400));
  }
  console.log('\nConcluído.');
}

main().catch(console.error);
