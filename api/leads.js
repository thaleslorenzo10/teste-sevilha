/**
 * Sevilha Performance — Vercel Serverless Function
 * POST /api/leads
 *
 * Recebe dados do formulário e envia para a Meta Conversions API (CAPI).
 * Implementado conforme documentação oficial:
 *   https://developers.facebook.com/docs/marketing-api/conversions-api/parameters
 *
 * Variável de ambiente obrigatória no Vercel:
 *   META_CAPI_TOKEN = <System User Access Token>
 */

'use strict';

const crypto = require('crypto');

const PIXEL_ID    = '657178423444244';
const API_VERSION = 'v19.0';
const CAPI_URL    = `https://graph.facebook.com/${API_VERSION}/${PIXEL_ID}/events`;

/* ─────────────────────────────────────────────────────────
   NORMALIZAÇÃO (conforme spec oficial do Meta)
   https://developers.facebook.com/docs/marketing-api/conversions-api/parameters/customer-information-parameters
───────────────────────────────────────────────────────── */

/** Hash SHA-256 de um valor já normalizado */
function h(value) {
  if (!value) return null;
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

/**
 * Email → lowercase, trim
 * Ex: "  John@GMAIL.com " → "john@gmail.com"
 */
function normalizeEmail(raw) {
  if (!raw) return null;
  return raw.trim().toLowerCase();
}

/**
 * Telefone → apenas dígitos + DDI obrigatório (sem zeros à esquerda)
 * Meta exige: country code + number, sem símbolos
 * Ex: "(11) 99999-9999" → "5511999999999"
 * Ex: "+55 11 99999-9999" → "5511999999999"
 */
function normalizePhone(raw) {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, '');

  // Já tem DDI 55
  if (digits.startsWith('55') && digits.length >= 12) return digits;

  // 11 dígitos (DDD + 9 dígitos) → adiciona 55
  if (digits.length === 11) return '55' + digits;

  // 10 dígitos (DDD + 8 dígitos, celulares antigos) → adiciona 55
  if (digits.length === 10) return '55' + digits;

  // Fallback: retorna o que tiver
  return digits;
}

/**
 * Nome → lowercase, sem pontuação (spec: "minúsculas, sem pontuação, UTF-8")
 * Ex: "João Da Silva" → "joão" / "silva"
 */
function normalizeName(raw) {
  if (!raw) return null;
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ''); // remove pontuação, mantém letras (incluindo acentos) e números
}

/**
 * País → ISO 3166-1 alfa-2, lowercase
 * Ex: "BR" → "br"
 */
function normalizeCountry(raw) {
  return raw ? raw.trim().toLowerCase() : 'br';
}

/* ─────────────────────────────────────────────────────────
   HELPERS DE REQUEST
───────────────────────────────────────────────────────── */

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.socket?.remoteAddress || '';
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

  const token = process.env.META_CAPI_TOKEN;
  if (!token) {
    console.error('[CAPI] META_CAPI_TOKEN não definido no Vercel → Settings → Environment Variables');
    // Não bloqueia o usuário, apenas loga o erro
    return res.status(200).json({ ok: true, warn: 'capi_token_missing' });
  }

  /* ── Extrai campos do body ─────────────────────────── */
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
    pagina      = '/',
  } = body;

  const eventTime = Math.floor(Date.now() / 1000);
  const ip        = getClientIp(req);
  const ua        = user_agent || req.headers['user-agent'] || '';

  /* ── Monta user_data ───────────────────────────────── */
  // Campos SEM hash
  const userData = {
    client_ip_address: ip,
    client_user_agent: ua,
  };

  // Campos COM hash SHA-256 (normalizar antes de hashear)
  if (email)    userData.em  = [h(normalizeEmail(email))];
  if (telefone) userData.ph  = [h(normalizePhone(telefone))];

  // country: obrigatório segundo spec — Brasil = "br"
  userData.country = [h(normalizeCountry('br'))];

  // Nome e sobrenome
  if (nome) {
    const parts = normalizeName(nome).split(/\s+/).filter(Boolean);
    if (parts[0])                userData.fn = [h(parts[0])];
    if (parts.length > 1)        userData.ln = [h(parts[parts.length - 1])];
  }

  // external_id: hashing recomendado pelo Meta
  if (external_id) userData.external_id = [h(external_id)];

  // Campos SEM hash (identifiers)
  if (fbp) userData.fbp = fbp;

  // fbc: cookie tem prioridade; fallback monta a partir do fbclid
  if (fbc)         userData.fbc = fbc;
  else if (fbclid) userData.fbc = `fb.1.${eventTime * 1000}.${fbclid}`;

  /* ── Monta custom_data ─────────────────────────────── */
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

  /* ── Payload CAPI ──────────────────────────────────── */
  const finalEventId = event_id || `ev_${eventTime}_${crypto.randomBytes(4).toString('hex')}`;

  const payload = {
    data: [{
      event_name:       'Lead',
      event_time:       eventTime,
      event_id:         finalEventId,   // ← usado para deduplicação com o Pixel
      event_source_url: page_url || req.headers.referer || '',
      action_source:    'website',      // obrigatório para eventos web
      user_data:        userData,
      custom_data:      customData,
    }],
  };

  /* ── Chama a API ───────────────────────────────────── */
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
    // Sempre retorna 200 para não bloquear o UX do lead
    return res.status(200).json({ ok: true, error: 'capi_exception' });
  }
};
