'use strict';

/**
 * GET /api/rd-stats?from=YYYY-MM-DD&to=YYYY-MM-DD
 * Returns RD Marketing contacts + RD CRM deals for both campaigns
 */
module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(204).end();

  const RM = process.env.RD_MARKETING_TOKEN;
  const RC = process.env.RD_CRM_TOKEN;

  if (!RM || !RC) {
    return res.status(500).json({ error: 'Missing RD tokens' });
  }

  async function fetchAll(url) {
    try {
      const r = await fetch(url);
      if (!r.ok) return null;
      return r.json();
    } catch { return null; }
  }

  const [
    cpContacts,
    seContacts,
    cpDeals,
    seDeals,
    crmStages,
  ] = await Promise.all([
    // RD Marketing — Clube da Performance leads
    fetchAll(`https://api.rd.services/platform/contacts?api_key=${RM}&tags=pre-inscricao&page_size=100`),
    // RD Marketing — Sessão Estratégica leads (tag: sessao-estrategica)
    fetchAll(`https://api.rd.services/platform/contacts?api_key=${RM}&tags=sessao-estrategica&page_size=100`),
    // RD CRM — Clube da Performance pipeline
    fetchAll(`https://crm.rdstation.com/api/v1/deals?token=${RC}&deal_pipeline_id=69d52f54c0b8000015d2e7b9&limit=200`),
    // RD CRM — Funil Padrão (SE)
    fetchAll(`https://crm.rdstation.com/api/v1/deals?token=${RC}&deal_pipeline_id=68d152fa949ae20022df32cb&limit=200`),
    // Pipeline stages
    fetchAll(`https://crm.rdstation.com/api/v1/deal_pipelines?token=${RC}`),
  ]);

  // Aggregate CRM deals by stage
  function dealsByStage(dealsData) {
    if (!dealsData?.deals) return {};
    const map = {};
    for (const d of dealsData.deals) {
      const stage = d.deal_stage?.name || 'Sem etapa';
      map[stage] = (map[stage] || 0) + 1;
    }
    return map;
  }

  return res.status(200).json({
    rd_marketing: {
      cp: { total: cpContacts?.total ?? 0 },
      se: { total: seContacts?.total ?? 0 },
    },
    rd_crm: {
      cp: {
        total: cpDeals?.total ?? 0,
        by_stage: dealsByStage(cpDeals),
      },
      se: {
        total: seDeals?.total ?? 0,
        by_stage: dealsByStage(seDeals),
      },
    },
    generated_at: new Date().toISOString(),
  });
};
