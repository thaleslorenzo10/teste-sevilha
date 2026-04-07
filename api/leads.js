/**
 * Sevilha Performance — Vercel Serverless Function
 * POST /api/leads
 *
 * 1. Salva lead no Supabase (tabela: leads_sevilhaperfomance)
 * 2. Envia para RD Station Marketing
 * 3. Envia para a Meta Conversions API (CAPI)
 *
 * Variáveis de ambiente no Vercel:
 *   SUPABASE_URL          = https://hojcntkggnwrvbvmcwxe.supabase.co
 *   SUPABASE_SERVICE_KEY  = <service_role key>
 *   META_CAPI_TOKEN       = <System User Access Token>
 *   RD_MARKETING_TOKEN    = <RD Station Marketing API token>
 */

'use strict';

const crypto = require('crypto');

const PIXEL_ID    = '657178423444244';
const API_VERSION = 'v19.0';
const CAPI_URL    = `https://graph.facebook.com/${API_VERSION}/${PIXEL_ID}/events`;

/* ─────────────────────────────────────────────────────────
   NORMALIZAÇÃO (conforme spec oficial do Meta)
───────────────────────────────────────────────────────── */

function h(value) {
  if (!value) return null;
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

function normalizeEmail(raw) {
  if (!raw) return null;
  return raw.trim().toLowerCase();
}

function normalizePhone(raw) {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('55') && digits.length >= 12) return digits;
  if (digits.length === 11) return '55' + digits;
  if (digits.length === 10) return '55' + digits;
  return digits;
}

function normalizeName(raw) {
  if (!raw) return null;
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, '');
}

function normalizeCountry(raw) {
  return raw ? raw.trim().toLowerCase() : 'br';
}

/* ─────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────── */

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.socket?.remoteAddress || '';
}

/* ─────────────────────────────────────────────────────────
   SUPABASE — salva lead
───────────────────────────────────────────────────────── */

async function saveToSupabase(data) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.warn('[Supabase] SUPABASE_URL ou SUPABASE_SERVICE_KEY não definidos');
    return;
  }

  const payload = {
    nome:         data.nome        || null,
    email:        data.email       || null,
    telefone:     data.telefone    || null,
    pagina:       data.pagina      || null,
    utm_source:   data.utm_source  || null,
    utm_medium:   data.utm_medium  || null,
    utm_campaign: data.utm_campaign || null,
    utm_term:     data.utm_term    || null,
    utm_content:  data.utm_content || null,
    fbclid:       data.fbclid      || null,
    gclid:        data.gclid       || null,
    ttclid:       data.ttclid      || null,
    msclkid:      data.msclkid     || null,
    fbp:          data.fbp         || null,
    fbc:          data.fbc         || null,
    external_id:  data.external_id || null,
    event_id:     data.event_id    || null,
    page_url:     data.page_url    || null,
    user_agent:   data.user_agent  || null,
  };

  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/leads_sevilhaperfomance`, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'apikey':        supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Prefer':        'return=minimal',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('[Supabase Error]', res.status, err);
    } else {
      console.log(`[Supabase OK] lead salvo — pagina=${payload.pagina} email=${payload.email}`);
    }
  } catch (err) {
    console.error('[Supabase Exception]', err.message);
  }
}

/* ─────────────────────────────────────────────────────────
   RD STATION MARKETING
───────────────────────────────────────────────────────── */

async function sendToRDMarketing(data) {
  const token = process.env.RD_MARKETING_TOKEN;
  if (!token) {
    console.warn('[RD Marketing] RD_MARKETING_TOKEN não definido');
    return;
  }

  const payload = {
    event_type:   'CONVERSION',
    event_family: 'CDP',
    payload: {
      conversion_identifier: 'pre-inscricao-clube-da-performance',
      name:             data.nome     || undefined,
      email:            data.email    || undefined,
      mobile_phone:     data.telefone || undefined,
      tags:             ['pre-inscricao', 'clube-da-performance'],
      traffic_source:   data.utm_source   || undefined,
      traffic_medium:   data.utm_medium   || undefined,
      traffic_campaign: data.utm_campaign || undefined,
      traffic_value:    data.utm_term     || undefined,
      traffic_content:  data.utm_content  || undefined,
      cf_pagina:        data.pagina       || undefined,
    },
  };

  // Remove campos undefined
  Object.keys(payload.payload).forEach(k => {
    if (payload.payload[k] === undefined) delete payload.payload[k];
  });

  try {
    const res = await fetch(`https://api.rd.services/platform/conversions?api_key=${token}`, {
      method:  'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      console.error('[RD Marketing Error]', res.status, await res.text());
    } else {
      console.log(`[RD Marketing OK] lead enviado — email=${data.email}`);
    }
  } catch (err) {
    console.error('[RD Marketing Exception]', err.message);
  }
}

/* ─────────────────────────────────────────────────────────
   RD STATION CRM
───────────────────────────────────────────────────────── */

async function sendToRDCRM(data) {
  const token = process.env.RD_CRM_TOKEN;
  if (!token) {
    console.warn('[RD CRM] RD_CRM_TOKEN não definido');
    return;
  }

  const deal = {
    name: data.nome || data.email,
    deal_stage_id:  '69d52f54c0b8000015d2e7bb', // Pré-inscritos
    deal_source_id: '68e5c150af14bb00013f8acb', // Busca Paga | Facebook Ads
    campaign_id:    '69d52f437e5d76001a90e080', // [CP] Clube da Performance > CRM
    contacts_attributes: [{
      name:   data.nome  || undefined,
      emails: data.email   ? [{ email: data.email }]   : [],
      phones: data.telefone ? [{ phone: data.telefone }] : [],
    }],
    deal_custom_fields: [
      { custom_field_id: '68e6668a5621790019a1ad6d', value: data.utm_source   || '' },
      { custom_field_id: '68e6669152f4a7001f8d9f8f', value: data.utm_campaign || '' },
      { custom_field_id: '68e666990450fa001e3e70f5', value: data.utm_content  || '' },
      { custom_field_id: '68e666a608aace0019e118a1', value: data.utm_medium   || '' },
    ].filter(f => f.value),
  };

  try {
    const res = await fetch(`https://crm.rdstation.com/api/v1/deals?token=${token}`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ deal }),
    });

    if (!res.ok) {
      console.error('[RD CRM Error]', res.status, await res.text());
    } else {
      const d = await res.json();
      console.log(`[RD CRM OK] deal criado — id=${d._id} email=${data.email}`);
    }
  } catch (err) {
    console.error('[RD CRM Exception]', err.message);
  }
}

/* ─────────────────────────────────────────────────────────
   HANDLER PRINCIPAL
───────────────────────────────────────────────────────── */

module.exports = async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST')   return res.status(405).json({ error: 'Method not allowed' });

  const body = req.body || {};
  const {
    nome        = '',
    email       = '',
    telefone    = '',
    fbp         = '',
    fbc         = '',
    external_id = '',
    event_id    = '',
    page_url    = '',
    user_agent  = '',
    utm_source  = '',
    utm_medium  = '',
    utm_campaign = '',
    utm_term    = '',
    utm_content = '',
    fbclid      = '',
    gclid       = '',
    ttclid      = '',
    msclkid     = '',
    pagina      = '/',
  } = body;

  const eventTime = Math.floor(Date.now() / 1000);
  const ip        = getClientIp(req);
  const ua        = user_agent || req.headers['user-agent'] || '';
  const finalEventId = event_id || `ev_${eventTime}_${crypto.randomBytes(4).toString('hex')}`;

  // ── 1. Salva no Supabase (não bloqueia o restante se falhar) ──
  await saveToSupabase({
    nome, email, telefone, pagina,
    utm_source, utm_medium, utm_campaign, utm_term, utm_content,
    fbclid, gclid, ttclid, msclkid,
    fbp, fbc, external_id,
    event_id: finalEventId,
    page_url, user_agent: ua,
  });

  // ── 2. RD Station Marketing ───────────────────────────────────
  await sendToRDMarketing({
    nome, email, telefone, pagina,
    utm_source, utm_medium, utm_campaign, utm_term, utm_content,
  });

  // ── 3. RD Station CRM ────────────────────────────────────────
  await sendToRDCRM({
    nome, email, telefone, pagina,
    utm_source, utm_medium, utm_campaign, utm_term, utm_content,
  });

  // ── 4. Meta CAPI ──────────────────────────────────────────────
  const token = process.env.META_CAPI_TOKEN;
  if (!token) {
    console.warn('[CAPI] META_CAPI_TOKEN não definido');
    return res.status(200).json({ ok: true, warn: 'capi_token_missing' });
  }

  const userData = {
    client_ip_address: ip,
    client_user_agent: ua,
  };

  if (email)    userData.em  = [h(normalizeEmail(email))];
  if (telefone) userData.ph  = [h(normalizePhone(telefone))];
  userData.country = [h(normalizeCountry('br'))];

  if (nome) {
    const parts = normalizeName(nome).split(/\s+/).filter(Boolean);
    if (parts[0])           userData.fn = [h(parts[0])];
    if (parts.length > 1)   userData.ln = [h(parts[parts.length - 1])];
  }

  if (external_id) userData.external_id = [h(external_id)];
  if (fbp)         userData.fbp = fbp;
  if (fbc)         userData.fbc = fbc;
  else if (fbclid) userData.fbc = `fb.1.${eventTime * 1000}.${fbclid}`;

  const customData = {
    content_name:     pagina,
    content_category: 'pre-inscricao',
    currency:         'BRL',
    value:            0,
  };
  if (utm_source)   customData.utm_source   = utm_source;
  if (utm_medium)   customData.utm_medium   = utm_medium;
  if (utm_campaign) customData.utm_campaign = utm_campaign;
  if (utm_term)     customData.utm_term     = utm_term;
  if (utm_content)  customData.utm_content  = utm_content;
  if (gclid)        customData.gclid        = gclid;

  const payload = {
    data: [{
      event_name:       'Lead',
      event_time:       eventTime,
      event_id:         finalEventId,
      event_source_url: page_url || req.headers.referer || '',
      action_source:    'website',
      user_data:        userData,
      custom_data:      customData,
    }],
  };

  try {
    const capiRes  = await fetch(`${CAPI_URL}?access_token=${token}`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    });
    const capiData = await capiRes.json();

    if (!capiRes.ok) {
      console.error('[CAPI Error]', JSON.stringify(capiData));
    } else {
      console.log(
        `[CAPI OK] event_id=${finalEventId}` +
        ` events_received=${capiData.events_received}` +
        ` fbtrace=${capiData.fbtrace_id}`
      );
    }

    return res.status(200).json({
      ok:              true,
      events_received: capiData.events_received ?? 0,
      fbtrace_id:      capiData.fbtrace_id ?? '',
    });

  } catch (err) {
    console.error('[CAPI Exception]', err.message);
    return res.status(200).json({ ok: true, error: 'capi_exception' });
  }
};
