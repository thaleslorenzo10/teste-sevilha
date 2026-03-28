/**
 * Sevilha Performance — Vercel Serverless Function
 * POST /api/leads
 *
 * Recebe os dados do formulário, envia para a
 * Meta Conversions API (CAPI) e retorna { ok: true }.
 *
 * Variáveis de ambiente necessárias no Vercel:
 *   META_CAPI_TOKEN = <token do Business Manager>
 */

const crypto = require('crypto');

const PIXEL_ID    = '657178423444244';
const API_VERSION = 'v19.0';
const CAPI_URL    = `https://graph.facebook.com/${API_VERSION}/${PIXEL_ID}/events`;

/* ── Helpers ────────────────────────────────────────────── */
function sha256(value) {
  if (!value) return undefined;
  return crypto.createHash('sha256').update(String(value).trim().toLowerCase()).digest('hex');
}

function normalizePhone(raw) {
  if (!raw) return undefined;
  const digits = raw.replace(/\D/g, '');
  // Garante DDI 55 (Brasil)
  if (digits.length === 11) return '55' + digits;
  if (digits.length === 10) return '55' + digits;
  if (digits.startsWith('55')) return digits;
  return digits;
}

function clientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.socket?.remoteAddress || '';
}

/* ── Handler ────────────────────────────────────────────── */
module.exports = async function handler(req, res) {
  // CORS — permite chamadas do próprio domínio
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST')    return res.status(405).json({ error: 'Method not allowed' });

  const token = process.env.META_CAPI_TOKEN;
  if (!token) {
    console.error('[CAPI] META_CAPI_TOKEN não configurado no Vercel');
    return res.status(200).json({ ok: true, warn: 'capi_token_missing' });
  }

  const body = req.body || {};
  const {
    nome, email, telefone,
    fbp, fbc, external_id, event_id,
    page_url, user_agent,
    utm_source, utm_medium, utm_campaign, utm_term, utm_content,
    fbclid, gclid, pagina,
  } = body;

  const eventTime = Math.floor(Date.now() / 1000);
  const ip        = clientIp(req);
  const ua        = user_agent || req.headers['user-agent'] || '';

  /* ── user_data (campos hasheados conforme spec do Meta) ── */
  const userData = {
    client_ip_address: ip,
    client_user_agent: ua,
  };

  if (email)    userData.em          = [sha256(email)];
  if (telefone) userData.ph          = [sha256(normalizePhone(telefone))];
  if (external_id) userData.external_id = [sha256(external_id)];
  if (fbp)      userData.fbp         = fbp;

  // fbc: preferência ao cookie, fallback ao fbclid da URL
  if (fbc)      userData.fbc = fbc;
  else if (fbclid) userData.fbc = `fb.1.${eventTime}.${fbclid}`;

  // Nome e sobrenome
  if (nome) {
    const parts = nome.trim().split(/\s+/);
    userData.fn = [sha256(parts[0])];
    if (parts.length > 1) userData.ln = [sha256(parts[parts.length - 1])];
  }

  /* ── custom_data ─────────────────────────────────────── */
  const customData = {
    content_category: 'pre-inscricao',
    content_name:     pagina || '/',
  };
  if (utm_source)   customData.utm_source   = utm_source;
  if (utm_medium)   customData.utm_medium   = utm_medium;
  if (utm_campaign) customData.utm_campaign = utm_campaign;
  if (utm_term)     customData.utm_term     = utm_term;
  if (utm_content)  customData.utm_content  = utm_content;
  if (gclid)        customData.gclid        = gclid;

  /* ── Payload final ───────────────────────────────────── */
  const payload = {
    data: [{
      event_name:       'Lead',
      event_time:       eventTime,
      event_id:         event_id || `ev_${eventTime}_${Math.random().toString(36).slice(2, 8)}`,
      event_source_url: page_url || '',
      action_source:    'website',
      user_data:        userData,
      custom_data:      customData,
    }],
  };

  /* ── Chama a Conversions API ─────────────────────────── */
  try {
    const capiRes = await fetch(`${CAPI_URL}?access_token=${token}`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    });

    const capiData = await capiRes.json();

    if (!capiRes.ok) {
      console.error('[CAPI Error]', JSON.stringify(capiData));
    } else {
      console.log(`[CAPI OK] events_received=${capiData.events_received} fbtrace=${capiData.fbtrace_id}`);
    }

    return res.status(200).json({
      ok:              true,
      events_received: capiData.events_received ?? 0,
    });

  } catch (err) {
    console.error('[CAPI Exception]', err.message);
    // Retorna 200 para não bloquear UX do usuário
    return res.status(200).json({ ok: true, error: 'capi_exception' });
  }
};
