'use strict';

/**
 * Sevilha Performance — A/B Split Function
 * GET /campanha (via vercel.json rewrite → /api/ab)
 *
 * Divide o tráfego igualmente entre as 3 landing pages (33.3% cada).
 * O visitante fica na mesma variante via cookie _sp_variant (sticky 30 dias).
 * Repassa toda a query string (UTMs, fbclid, gclid…) para a página destino.
 * Registra cada visita na tabela page_views do Supabase.
 */

const VARIANTS = ['/', '/pre-inscricao-2', '/pre-inscricao-3'];
const COOKIE_NAME = '_sp_variant';
const COOKIE_TTL_DAYS = 30;

// User-agents de bots conhecidos para não inflar as métricas
const BOT_PATTERN = /bot|crawl|slurp|spider|mediapartners|google|baidu|bing|msn|teoma|yahoo|ask/i;

module.exports = async function handler(req, res) {
  // ── 1. Lê cookie existente (sticky) ─────────────────────────────────────
  const rawCookie = req.headers['cookie'] || '';
  const cookieMap = Object.fromEntries(
    rawCookie.split(';')
      .map(s => s.trim())
      .filter(Boolean)
      .map(s => {
        const idx = s.indexOf('=');
        return idx > -1
          ? [s.slice(0, idx).trim(), s.slice(idx + 1).trim()]
          : [s.trim(), ''];
      })
  );

  let variant;
  const existing = parseInt(cookieMap[COOKIE_NAME], 10);
  if (!isNaN(existing) && existing >= 0 && existing <= 2) {
    variant = existing; // visitante recorrente — mesma variante
  } else {
    variant = Math.floor(Math.random() * 3); // novo visitante — aleatorizar
  }

  // ── 2. Monta URL de destino com query string preservada ─────────────────
  const destination = VARIANTS[variant];
  const incomingUrl = new URL(req.url, 'http://localhost');
  const queryString  = incomingUrl.searchParams.toString();
  const redirectUrl  = queryString ? `${destination}?${queryString}` : destination;

  // ── 3. Extrai UTMs e click IDs da query string ───────────────────────────
  const p = incomingUrl.searchParams;
  const pageViewPayload = {
    variant,
    pagina:       destination,
    utm_source:   p.get('utm_source')   || null,
    utm_medium:   p.get('utm_medium')   || null,
    utm_campaign: p.get('utm_campaign') || null,
    utm_term:     p.get('utm_term')     || null,
    utm_content:  p.get('utm_content')  || null,
    fbclid:       p.get('fbclid')       || null,
    gclid:        p.get('gclid')        || null,
    ttclid:       p.get('ttclid')       || null,
    msclkid:      p.get('msclkid')      || null,
    user_agent:   req.headers['user-agent'] || null,
    ip:           truncateIp(
                    (req.headers['x-forwarded-for'] || '').split(',')[0].trim()
                    || req.socket?.remoteAddress
                    || ''
                  ),
  };

  // ── 4. Salva pageview no Supabase (ignora bots) ──────────────────────────
  const ua = req.headers['user-agent'] || '';
  if (!BOT_PATTERN.test(ua)) {
    await savePageView(pageViewPayload);
  }

  // ── 5. Redireciona com cookie sticky ─────────────────────────────────────
  const maxAge = COOKIE_TTL_DAYS * 24 * 60 * 60;
  res.setHeader('Set-Cookie',      `${COOKIE_NAME}=${variant}; Max-Age=${maxAge}; Path=/; SameSite=Lax; HttpOnly`);
  res.setHeader('Cache-Control',   'no-store, private');
  res.setHeader('Location',        redirectUrl);
  return res.status(302).end();
};

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Trunca o último octeto do IP (LGPD): 1.2.3.4 → 1.2.3.0
 * Para IPv6 mantém como está.
 */
function truncateIp(ip) {
  if (!ip) return null;
  // IPv4
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(ip)) {
    return ip.replace(/\.\d+$/, '.0');
  }
  return ip;
}

async function savePageView(data) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
  if (!supabaseUrl || !supabaseKey) return;

  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/page_views_sevilhaperfomance`, {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'apikey':        supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Prefer':        'return=minimal',
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      console.error('[AB pageview error]', res.status, await res.text());
    } else {
      console.log(`[AB OK] variant=${data.variant} pagina=${data.pagina}`);
    }
  } catch (e) {
    console.error('[AB pageview exception]', e.message);
  }
}
