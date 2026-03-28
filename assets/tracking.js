/**
 * Sevilha Performance — Tracking Centralizado
 * Meta Pixel + Conversions API (CAPI) + Google Ads
 *
 * ─────────────────────────────────────────────────────────
 * CONFIGURAÇÃO — atualize apenas este bloco
 * ─────────────────────────────────────────────────────────
 */
var SP_CONFIG = {
  META_PIXEL_ID:           '657178423444244',
  GOOGLE_ADS_ID:           'AW-XXXXXXXXXX',           // preencher quando tiver o Google Ads ID
  GOOGLE_CONVERSION_LABEL: 'XXXXXXXXXXXXXXXXXXXXX',   // preencher quando tiver o label
  FORM_ENDPOINT:           '/api/leads',              // Vercel Serverless Function
  DEBUG:                   false,
};
/* ──────────────────────────────────────────────────────── */

(function () {
  'use strict';

  /* ── Helpers ─────────────────────────────────────────── */
  function log() {
    if (SP_CONFIG.DEBUG) console.log('[SP Tracking]', ...arguments);
  }

  function getCookie(name) {
    var match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : '';
  }

  function setCookie(name, value, days) {
    var expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = name + '=' + encodeURIComponent(value) +
      '; expires=' + expires + '; path=/; SameSite=Lax';
  }

  function getOrCreateExtId() {
    var id = localStorage.getItem('_sp_ext_id');
    if (!id) {
      id = 'u_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9);
      localStorage.setItem('_sp_ext_id', id);
    }
    return id;
  }

  function generateEventId() {
    return 'ev_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9);
  }

  /* ── Captura UTMs e Click IDs ─────────────────────────── */
  (function captureParams() {
    var params = new URLSearchParams(window.location.search);
    var keys   = ['utm_source','utm_medium','utm_campaign','utm_term','utm_content',
                  'fbclid','gclid','ttclid','msclkid'];

    keys.forEach(function (k) {
      var val = params.get(k);
      if (val) {
        sessionStorage.setItem(k, val);
        log('captured', k, val);

        // Gera _fbc a partir do fbclid
        if (k === 'fbclid') {
          var fbc = 'fb.1.' + Date.now() + '.' + val;
          setCookie('_fbc', fbc, 90);
          log('_fbc cookie set');
        }
      } else {
        // Tenta restaurar da sessionStorage (navegações entre páginas)
        var stored = sessionStorage.getItem(k);
        if (stored) log('restored from session', k, stored);
      }
    });
  })();

  /* ── Meta Pixel ──────────────────────────────────────── */
  !function(f,b,e,v,n,t,s){
    if(f.fbq) return;
    n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq) f._fbq=n;
    n.push=n; n.loaded=!0; n.version='2.0'; n.queue=[];
    t=b.createElement(e); t.async=!0; t.src=v;
    s=b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t,s);
  }(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');

  fbq('init', SP_CONFIG.META_PIXEL_ID, {
    external_id: getOrCreateExtId(),
  });
  fbq('track', 'PageView');
  log('Meta Pixel init + PageView');

  /* ── Google Tag (gtag.js) ────────────────────────────── */
  (function loadGtag() {
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + SP_CONFIG.GOOGLE_ADS_ID;
    document.head.appendChild(s);

    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { dataLayer.push(arguments); };
    gtag('js', new Date());
    gtag('config', SP_CONFIG.GOOGLE_ADS_ID, {
      allow_enhanced_conversions: true,
    });
    log('Google Tag init');
  })();

  /* ── Preenche campos ocultos do formulário ───────────── */
  window.SP_populateHiddenFields = function (form) {
    var utmKeys = ['utm_source','utm_medium','utm_campaign','utm_term','utm_content',
                   'fbclid','gclid','ttclid','msclkid'];

    utmKeys.forEach(function (k) {
      var el = form.querySelector('[name="' + k + '"]');
      if (el) el.value = sessionStorage.getItem(k) || '';
    });

    // Meta Pixel cookies
    var fbpEl = form.querySelector('[name="fbp"]');
    if (fbpEl) fbpEl.value = getCookie('_fbp');

    var fbcEl = form.querySelector('[name="fbc"]');
    if (fbcEl) fbcEl.value = getCookie('_fbc');

    // Identificadores
    var extIdEl = form.querySelector('[name="external_id"]');
    if (extIdEl) extIdEl.value = getOrCreateExtId();

    // Contexto da página
    var pageUrlEl = form.querySelector('[name="page_url"]');
    if (pageUrlEl) pageUrlEl.value = window.location.href;

    var uaEl = form.querySelector('[name="user_agent"]');
    if (uaEl) uaEl.value = navigator.userAgent;

    // Event ID para deduplicação Browser ↔ CAPI
    var eventIdEl = form.querySelector('[name="event_id"]');
    if (eventIdEl && !eventIdEl.value) eventIdEl.value = generateEventId();

    log('hidden fields populated');
  };

  /* ── Dispara eventos de conversão ────────────────────── */
  window.SP_fireLeadEvents = function (eventId, formData) {
    // Meta Pixel Lead
    if (window.fbq) {
      fbq('track', 'Lead', {
        content_name: document.title,
        content_category: 'pre-inscricao',
        value: 0,
        currency: 'BRL',
      }, { eventID: eventId });
      log('Meta Lead fired', eventId);
    }

    // Google Ads Conversion
    if (window.gtag) {
      gtag('event', 'conversion', {
        send_to: SP_CONFIG.GOOGLE_ADS_ID + '/' + SP_CONFIG.GOOGLE_CONVERSION_LABEL,
        value: 0.0,
        currency: 'BRL',
        transaction_id: eventId,
      });
      // Enhanced Conversions (email/telefone hasheados são enviados via gtag)
      if (formData && formData.email) {
        gtag('set', 'user_data', {
          email: formData.email,
          phone_number: formData.telefone || '',
        });
      }
      log('Google Ads conversion fired', eventId);
    }
  };

  /* ── Handler de submit unificado ─────────────────────── */
  window.SP_handleSubmit = function (e, form, onSuccess) {
    e.preventDefault();

    var btn = form.querySelector('button[type="submit"]');
    if (btn) { btn.textContent = 'Enviando...'; btn.disabled = true; }

    // Preenche campos antes de serializar
    window.SP_populateHiddenFields(form);

    var data      = Object.fromEntries(new FormData(form));
    var eventId   = data.event_id || generateEventId();
    data.event_id = eventId;

    log('submitting to', SP_CONFIG.FORM_ENDPOINT, data);

    fetch(SP_CONFIG.FORM_ENDPOINT, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body:    JSON.stringify(data),
    })
    .then(function (res) {
      log('form submitted', res.status);
      window.SP_fireLeadEvents(eventId, data);
      onSuccess();
    })
    .catch(function (err) {
      log('form error', err);
      // Dispara conversão mesmo se o POST falhar para não bloquear UX
      window.SP_fireLeadEvents(eventId, data);
      onSuccess();
    });
  };

  log('tracking.js loaded ✓');
})();
