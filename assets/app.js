/*
 * Landing-page behaviour. No dependencies.
 * Sections: attribution (UTM), headline variant, disclosures, analytics, lead form.
 */
(function () {
  'use strict';

  var pageLoadedAt = Date.now();

  /* ---------- Attribution (first touch per browser session) ---------- */

  var ATTR_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'gclid', 'fbclid'];
  var STORE_KEY = 'etf_attribution_v1';

  function readStored() {
    try { return JSON.parse(sessionStorage.getItem(STORE_KEY)); } catch (e) { return null; }
  }
  function store(value) {
    try { sessionStorage.setItem(STORE_KEY, JSON.stringify(value)); } catch (e) { /* storage blocked: URL values still apply */ }
  }

  var query = new URLSearchParams(window.location.search);
  var fromUrl = {};
  ATTR_KEYS.forEach(function (key) {
    var value = query.get(key);
    if (value) fromUrl[key] = value.slice(0, 200);
  });
  var hasUrlParams = Object.keys(fromUrl).length > 0;

  // Keep the first touch of the session, but let a campaign visit replace a
  // stored direct (parameter-less) visit.
  var attribution = readStored();
  if (!attribution || (hasUrlParams && Object.keys(attribution.params || {}).length === 0)) {
    attribution = {
      params: fromUrl,
      landing_url: window.location.href.slice(0, 500),
      referrer: document.referrer.slice(0, 500)
    };
    store(attribution);
  }

  /* ---------- Headline variant matched to the ad (utm_content) ---------- */

  var VARIANTS = {
    ad_a_problem: {
      key: 'a',
      title: 'Broker vám nedovolil koupit SPY nebo VOO? Tady je, co si můžete koupit místo nich.',
      lead: 'Proč americké ETF v EU většinou nekoupíte a které evropské fondy UCITS sledují stejný index. Všechna čísla se zdroji.',
      // Fees: CSPX TER 0.07 %, VUAA OCF 0.07 % (issuer factsheets, docs/step-1-research.md §4c).
      teaser: 'Místo SPY / VOO: CSPX nebo VUAA — stejný index S&P\u00a0500, roční náklady 0,07\u00a0%.'
    },
    ad_b_compare: {
      key: 'b',
      title: 'S&P\u00a0500, nebo globální akcie? 4\u00a0evropské ETF v\u00a0jednom srovnání.',
      lead: 'Roční náklady, ISIN, burzy a typ fondu, u každého údaje zdroj. Tahák v PDF zdarma.',
      // Fees: CSPX/VUAA 0.07 %, SWDA TER 0.20 %, VWCE OCF 0.14 % (issuer factsheets, §4c).
      // MSCI World = developed markets only; FTSE All-World = developed + emerging. Say which is which.
      teaser: 'S&P\u00a0500 (jen USA): CSPX a VUAA, 0,07\u00a0% ročně. Globální akcie: SWDA (rozvinuté trhy) 0,20\u00a0%, VWCE (vč. rozvíjejících se) 0,14\u00a0% ročně.'
    }
  };
  var variant = VARIANTS[attribution.params && attribution.params.utm_content];
  var variantKey = variant ? variant.key : 'default';

  var heroTitle = document.getElementById('hero-title');
  var heroLead = document.getElementById('hero-lead');
  var heroTeaser = document.getElementById('hero-teaser');
  if (variant && heroTitle && heroLead) {
    heroTitle.textContent = variant.title;
    heroLead.textContent = variant.lead;
    if (heroTeaser) heroTeaser.textContent = variant.teaser;
    heroTitle.setAttribute('data-variant', variant.key);
  }

  /* ---------- Disclosures: open on wide screens ---------- */

  // details[data-open-wide] (US ETF table, fund "Podrobnosti") stay collapsed on
  // phones and open from 48rem, matching the CSS breakpoint. Closing is left to
  // the visitor, so a resize never hides something they opened.
  var wideQuery = window.matchMedia ? window.matchMedia('(min-width: 48rem)') : null;
  function openOnWide() {
    if (!wideQuery || !wideQuery.matches) return;
    document.querySelectorAll('details[data-open-wide]').forEach(function (d) { d.open = true; });
  }
  openOnWide();
  if (wideQuery && wideQuery.addEventListener) wideQuery.addEventListener('change', openOnWide);

  /* ---------- Analytics (GoatCounter, cookieless) ---------- */

  // Event path = "<event>/<variant>", e.g. "lead_success/a". GoatCounter
  // records utm_campaign and utm_source itself, but not utm_content, so the
  // ad variant travels in the event name.
  var debug = query.get('debug') === '1';
  var events = window.__events = [];
  var pendingCounts = [];
  var debugList = null;

  if (debug) {
    var panel = document.createElement('aside');
    panel.className = 'debug-panel';
    panel.setAttribute('aria-label', 'Ladění: odeslané události');
    var heading = document.createElement('strong');
    heading.textContent = 'debug: events';
    // Show which variant applied and why (textContent: the URL value is untrusted).
    var info = document.createElement('p');
    var utmContent = attribution.params && attribution.params.utm_content;
    info.textContent = 'variant: ' + variantKey + (utmContent
      ? ' (utm_content=' + utmContent + (variant ? ')' : ', not recognised: use ad_a_problem or ad_b_compare)')
      : ' (no utm_content)');
    debugList = document.createElement('ol');
    panel.appendChild(heading);
    panel.appendChild(info);
    panel.appendChild(debugList);
    document.body.appendChild(panel);
  }

  function goatcounterReady() {
    return window.goatcounter && typeof window.goatcounter.count === 'function';
  }

  function flushCounts() {
    if (!goatcounterReady()) return;
    while (pendingCounts.length) {
      try { window.goatcounter.count(pendingCounts.shift()); } catch (e) { /* never break the page */ }
    }
  }

  var gcScript = document.getElementById('goatcounter-script');
  if (gcScript) gcScript.addEventListener('load', flushCounts);

  function track(name) {
    var path = name + '/' + variantKey;
    events.push({ name: name, variant: variantKey, path: path, ms: Date.now() - pageLoadedAt });
    pendingCounts.push({ path: path, title: name, event: true });
    flushCounts();
    if (debugList) {
      var li = document.createElement('li');
      li.textContent = path;
      debugList.appendChild(li);
    }
  }

  // Landing page view: the first step of the funnel, recorded through the
  // same track() as every other event so the whole funnel has one source.
  // (GoatCounter's automatic pageview still runs, but has no variant.)
  if (heroTitle) track('page_view');

  // Clicks on anything marked data-track="<event>".
  document.addEventListener('click', function (event) {
    var el = event.target.closest && event.target.closest('[data-track]');
    if (el) track(el.getAttribute('data-track'));
  });

  // Comparison seen: the first fund's key facts (annual costs) are at least
  // half visible. This small element comes right after the section intro, so
  // the "Zobrazit srovnání" jump reaches it even on short phone screens; the
  // US table now sits in a disclosure after the UCITS funds.
  var comparisonTargets = [document.querySelector('#srovnani .card .fact-key')].filter(Boolean);
  if (comparisonTargets.length && 'IntersectionObserver' in window) {
    var seen = new IntersectionObserver(function (entries) {
      // Check the ratio explicitly instead of relying on isIntersecting.
      if (entries.some(function (e) { return e.intersectionRatio >= 0.5; })) {
        track('comparison_view');
        seen.disconnect();
      }
    }, { threshold: 0.5 });
    comparisonTargets.forEach(function (el) { seen.observe(el); });
  }

  /* ---------- Lead form ---------- */

  var form = document.getElementById('lead-form');
  var success = document.getElementById('lead-success');
  if (!form || !success) return;

  function fillAttributionFields() {
    ATTR_KEYS.forEach(function (key) {
      form.elements[key].value = (attribution.params && attribution.params[key]) || '';
    });
    form.elements.landing_variant.value = variantKey;
    form.elements.landing_url.value = attribution.landing_url || '';
    form.elements.referrer.value = attribution.referrer || '';
  }

  var email = form.elements.email;
  var emailError = document.getElementById('email-error');
  var formError = document.getElementById('form-error');
  var submitBtn = form.querySelector('button[type="submit"]');
  var mode = form.getAttribute('data-lead-mode') === 'live' ? 'live' : 'demo';

  // The controls are disabled in the HTML so that nothing can be submitted
  // without JavaScript (demo safety). Enable them now that the script runs.
  var fields = document.getElementById('lead-fields');
  if (fields) fields.disabled = false;

  // Demo notices are only shown while the form is not collecting data.
  if (mode === 'live') {
    document.querySelectorAll('[data-demo-only]').forEach(function (el) { el.hidden = true; });
  }

  function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
  }

  function setEmailError(show) {
    emailError.hidden = !show;
    email.setAttribute('aria-invalid', show ? 'true' : 'false');
  }

  form.addEventListener('focusin', function onStart() {
    form.removeEventListener('focusin', onStart);
    track('form_start');
  });

  email.addEventListener('input', function () {
    if (!emailError.hidden && isValidEmail(email.value.trim())) setEmailError(false);
  });

  function send(body) {
    if (mode === 'demo') {
      // Nothing leaves the browser. Keep the payload for local inspection.
      window.__lastLeadPayload = Object.fromEntries(body);
      return Promise.resolve();
    }
    // Netlify Forms AJAX submission.
    return fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString()
    }).then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
    });
  }

  function showSuccess() {
    form.hidden = true;
    success.hidden = false;
    success.focus();
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    formError.hidden = true;

    // Honeypot filled: almost certainly a bot. Show success, send nothing.
    if (form.elements.company.value) {
      showSuccess();
      return;
    }

    email.value = email.value.trim();
    if (!isValidEmail(email.value)) {
      setEmailError(true);
      email.focus();
      return;
    }
    setEmailError(false);
    track('form_submit');

    fillAttributionFields();
    form.elements.time_to_submit_ms.value = String(Date.now() - pageLoadedAt);

    submitBtn.disabled = true;
    submitBtn.setAttribute('aria-busy', 'true');

    send(new URLSearchParams(new FormData(form)))
      .then(function () {
        // lead_success is reserved for a live submission the server accepted.
        // In demo mode nothing was sent, so record a clearly separate event.
        track(mode === 'live' ? 'lead_success' : 'demo_lead_success');
        showSuccess();
      })
      .catch(function () {
        track('form_error');
        formError.hidden = false;
      })
      .then(function () {
        submitBtn.disabled = false;
        submitBtn.removeAttribute('aria-busy');
      });
  });
})();
