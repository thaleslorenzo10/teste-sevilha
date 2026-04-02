'use strict';

/**
 * Sevilha Performance — A/B Stats Endpoint
 * GET /api/stats
 *
 * Retorna visitas, leads e taxa de conversão por variante.
 * Usado pelo dashboard /relatorio.html
 */

const PAGES = ['/', '/pre-inscricao-2', '/pre-inscricao-3'];

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'GET') return res.status(405).end();

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: 'Supabase não configurado' });
  }

  const headers = {
    'apikey':        supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
    'Content-Type':  'application/json',
  };

  try {
    // Busca visitas e leads em paralelo
    const [viewsData, leadsData] = await Promise.all([
      fetchAll(`${supabaseUrl}/rest/v1/page_views?select=pagina`, headers),
      fetchAll(`${supabaseUrl}/rest/v1/leads?select=pagina`,      headers),
    ]);

    const visits = countBy(viewsData, 'pagina');
    const leads  = countBy(leadsData, 'pagina');

    const variants = PAGES.map((pagina, index) => {
      const v = visits[pagina] || 0;
      const l = leads[pagina]  || 0;
      return {
        variant:         index,
        pagina,
        visits:          v,
        leads:           l,
        conversion_rate: v > 0 ? parseFloat(((l / v) * 100).toFixed(2)) : 0,
      };
    });

    return res.status(200).json({
      variants,
      generated_at: new Date().toISOString(),
    });

  } catch (e) {
    console.error('[stats error]', e.message);
    return res.status(500).json({ error: e.message });
  }
};

async function fetchAll(url, headers) {
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${await res.text()}`);
  return res.json();
}

function countBy(rows, key) {
  return rows.reduce((acc, row) => {
    const val = row[key];
    if (val) acc[val] = (acc[val] || 0) + 1;
    return acc;
  }, {});
}
