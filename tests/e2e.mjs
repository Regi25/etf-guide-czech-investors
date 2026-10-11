// Dependency-free end-to-end checks.
// Starts a local static server (with a mock Netlify Forms endpoint), launches
// headless Chrome and drives it over the DevTools protocol.
//
// Usage: node tests/e2e.mjs
// Needs: Node 22+ (global WebSocket) and Google Chrome. Override the binary with CHROME=/path.

import { createServer } from 'node:http';
import { readFile, mkdtemp, rm } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.pdf': 'application/pdf', '.png': 'image/png', '.svg': 'image/svg+xml' };

/* ---------- Local server with a mock form endpoint ---------- */

// Serve pages with the same CSP as production (netlify.toml) so violations surface in tests.
const CSP = (await readFile(join(ROOT, 'netlify.toml'), 'utf8')).match(/Content-Security-Policy = "([^"]+)"/)[1];

const posts = [];
let failPosts = false;

const server = createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (req.method === 'POST' && url.pathname === '/') {
    let body = '';
    for await (const chunk of req) body += chunk;
    posts.push(Object.fromEntries(new URLSearchParams(body)));
    res.writeHead(failPosts ? 500 : 200).end();
    return;
  }
  let path = url.pathname === '/' ? '/index.html' : decodeURIComponent(url.pathname);
  try {
    let data = await readFile(join(ROOT, path));
    // Test-only switch: ?__live=1 serves the page with the form in live mode.
    if (path.endsWith('.html') && url.searchParams.has('__live')) {
      data = Buffer.from(data.toString().replace('data-lead-mode="demo"', 'data-lead-mode="live" data-netlify="true"'));
    }
    res.writeHead(200, { 'Content-Type': TYPES[extname(path)] || 'application/octet-stream', 'Content-Security-Policy': CSP }).end(data);
  } catch {
    res.writeHead(404).end('not found');
  }
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${server.address().port}`;

/* ---------- Minimal CDP client ---------- */

const profile = await mkdtemp(join(tmpdir(), 'e2e-chrome-'));
const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--no-first-run', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe'] });
const wsUrl = await new Promise((resolve, reject) => {
  let buf = '';
  chrome.stderr.on('data', (d) => {
    buf += d;
    const m = buf.match(/DevTools listening on (ws:\/\/\S+)/);
    if (m) resolve(m[1]);
  });
  setTimeout(() => reject(new Error('Chrome did not start')), 15000);
});

const ws = new WebSocket(wsUrl);
await new Promise((r) => ws.addEventListener('open', r));
let nextId = 1;
const pending = new Map();
const listeners = [];
ws.addEventListener('message', (e) => {
  const msg = JSON.parse(e.data);
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result);
  } else if (msg.method) {
    listeners.forEach((fn) => fn(msg));
  }
});
const cdp = (method, params = {}, sessionId) => new Promise((resolve, reject) => {
  const id = nextId++;
  pending.set(id, { resolve, reject });
  ws.send(JSON.stringify({ id, method, params, sessionId }));
});

async function openPage(path, { width = 390, height = 844, mobile = true } = {}) {
  const { targetId } = await cdp('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await cdp('Target.attachToTarget', { targetId, flatten: true });
  await cdp('Page.enable', {}, sessionId);
  await cdp('Runtime.enable', {}, sessionId);
  await cdp('Log.enable', {}, sessionId);
  const errors = [];
  listeners.push((m) => {
    if (m.sessionId === sessionId && m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
    if (m.sessionId === sessionId && m.method === 'Log.entryAdded' && m.params.entry.level === 'error') errors.push(m.params.entry.text);
  });
  await cdp('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 2, mobile }, sessionId);
  const goto = async (p) => {
    const loaded = new Promise((r) => {
      const fn = (m) => { if (m.sessionId === sessionId && m.method === 'Page.loadEventFired') { listeners.splice(listeners.indexOf(fn), 1); r(); } };
      listeners.push(fn);
    });
    await cdp('Page.navigate', { url: BASE + p }, sessionId);
    await loaded;
  };
  await goto(path);
  const page = {
    goto, // same tab, so sessionStorage is kept
    errors,
    cdp: (method, params = {}) => cdp(method, params, sessionId),

    eval: async (expr) => {
      const r = await cdp('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }, sessionId);
      if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
      return r.result.value;
    },
    waitFor: async (expr, timeout = 3000) => {
      const end = Date.now() + timeout;
      while (Date.now() < end) {
        if (await page.eval(expr)) return true;
        await new Promise((r) => setTimeout(r, 50));
      }
      throw new Error('Timed out waiting for: ' + expr);
    },
    close: () => cdp('Target.closeTarget', { targetId })
  };
  return page;
}

/* ---------- Test harness ---------- */

const results = [];
async function test(name, fn) {
  try {
    await fn();
    results.push(['PASS', name]);
  } catch (err) {
    results.push(['FAIL', name + ' :: ' + err.message]);
  }
}
function assert(cond, msg) { if (!cond) throw new Error(msg); }

// Fill and submit the lead form via real DOM events.
const fillAndSubmit = (email, { consent = false, honeypot = '' } = {}) => `(() => {
  const f = document.getElementById('lead-form');
  f.elements.email.value = ${JSON.stringify(email)};
  f.elements.marketing_consent.checked = ${consent};
  f.elements.company.value = ${JSON.stringify(honeypot)};
  f.querySelector('button[type=submit]').click();
  return true;
})()`;
const isVisible = (sel) => `(() => { const el = document.querySelector(${JSON.stringify(sel)}); return !!el && !el.hidden && el.offsetParent !== null; })()`;

/* ---------- Tests: lead form + resource access ---------- */

await test('demo: invalid e-mail shows error and does not succeed', async () => {
  const p = await openPage('/');
  await p.eval(fillAndSubmit('not-an-email'));
  await p.waitFor(isVisible('#email-error'));
  assert(await p.eval(isVisible('#lead-form')), 'form should stay visible');
  assert(!(await p.eval(isVisible('#lead-success'))), 'success must not show');
  assert((await p.eval(`document.getElementById('email').getAttribute('aria-invalid')`)) === 'true', 'aria-invalid not set');
  await p.close();
});

await test('demo: valid submit without consent shows PDF link and sends nothing', async () => {
  const before = posts.length;
  const p = await openPage('/');
  await p.eval(fillAndSubmit('jana@example.cz', { consent: false }));
  await p.waitFor(isVisible('#lead-success'));
  const href = await p.eval(`document.querySelector('#lead-success a[href$=".pdf"]').getAttribute('href')`);
  assert(href === 'assets/tahak-etf.pdf', 'unexpected PDF href: ' + href);
  const payload = await p.eval('window.__lastLeadPayload');
  assert(payload && payload.email === 'jana@example.cz', 'payload missing e-mail');
  assert(!('marketing_consent' in payload), 'unchecked consent must not be sent');
  assert(Number(payload.time_to_submit_ms) >= 0, 'time_to_submit_ms missing');
  assert(posts.length === before, 'demo mode must not POST');
  assert(await p.eval(isVisible('.demo-banner')) === false, 'banner is inside the hidden form now'); // form hidden after success
  await p.close();
});

await test('demo: notice is visible before submit', async () => {
  const p = await openPage('/');
  assert(await p.eval(isVisible('.demo-banner')), 'demo banner should be visible');
  await p.close();
});

await test('honeypot filled: shows success, sends nothing', async () => {
  const before = posts.length;
  const p = await openPage('/?__live=1');
  await p.eval(fillAndSubmit('bot@example.cz', { honeypot: 'ACME' }));
  await p.waitFor(isVisible('#lead-success'));
  assert(posts.length === before, 'honeypot submission must not POST');
  await p.close();
});

await test('live (mock Netlify): valid submit POSTs lead and shows PDF', async () => {
  const before = posts.length;
  const p = await openPage('/?__live=1');
  assert(!(await p.eval(isVisible('.demo-banner'))), 'demo banner must be hidden in live mode');
  await p.eval(fillAndSubmit('petr@example.cz', { consent: true }));
  await p.waitFor(isVisible('#lead-success'));
  assert(posts.length === before + 1, 'expected exactly one POST');
  const last = posts.at(-1);
  assert(last['form-name'] === 'lead', 'form-name missing');
  assert(last.email === 'petr@example.cz' && last.marketing_consent === 'yes', 'fields missing: ' + JSON.stringify(last));
  await p.close();
});

await test('live (mock Netlify): server error shows message and keeps values', async () => {
  failPosts = true;
  const p = await openPage('/?__live=1');
  await p.eval(fillAndSubmit('eva@example.cz'));
  await p.waitFor(isVisible('#form-error'));
  assert(!(await p.eval(isVisible('#lead-success'))), 'success must not show on error');
  assert((await p.eval(`document.getElementById('email').value`)) === 'eva@example.cz', 'e-mail value lost');
  assert(!(await p.eval(`document.querySelector('#lead-form button[type=submit]').disabled`)), 'button should be re-enabled');
  failPosts = false;
  await p.close();
});

await test('resource: PDF and thank-you page are served', async () => {
  const pdf = await fetch(BASE + '/assets/tahak-etf.pdf');
  assert(pdf.ok && pdf.headers.get('content-type') === 'application/pdf', 'PDF not served');
  const bytes = new Uint8Array(await pdf.arrayBuffer());
  assert(String.fromCharCode(...bytes.slice(0, 5)) === '%PDF-', 'not a PDF');
  const ty = await (await fetch(BASE + '/dekujeme.html')).text();
  assert(ty.includes('href="assets/tahak-etf.pdf"'), 'thank-you page lacks PDF link');
});

/* ---------- Tests: UTM attribution + headline variant ---------- */

const AD_A = '/?utm_source=meta&utm_medium=paid_social&utm_campaign=etf_cz_2026q4&utm_content=ad_a_problem&fbclid=abc123';
const AD_B = '/?utm_source=meta&utm_medium=paid_social&utm_campaign=etf_cz_2026q4&utm_content=ad_b_compare';
const submitAndGetPayload = async (p) => {
  await p.eval(fillAndSubmit('jana@example.cz'));
  await p.waitFor(isVisible('#lead-success'));
  return p.eval('window.__lastLeadPayload');
};

await test('utm: ad A link shows headline A and attaches attribution to the lead', async () => {
  const p = await openPage(AD_A);
  assert((await p.eval(`document.getElementById('hero-title').dataset.variant`)) === 'a', 'variant A not applied');
  assert((await p.eval(`document.getElementById('hero-title').textContent`)).startsWith('Broker vám nedovolil'), 'headline A text');
  const d = await submitAndGetPayload(p);
  assert(d.utm_source === 'meta' && d.utm_medium === 'paid_social' && d.utm_campaign === 'etf_cz_2026q4', 'utm fields: ' + JSON.stringify(d));
  assert(d.utm_content === 'ad_a_problem' && d.fbclid === 'abc123' && d.landing_variant === 'a', 'content/variant: ' + JSON.stringify(d));
  assert(d.landing_url.includes('utm_content=ad_a_problem'), 'landing_url missing');
  await p.close();
});

await test('utm: ad B link shows headline B', async () => {
  const p = await openPage(AD_B);
  assert((await p.eval(`document.getElementById('hero-title').dataset.variant`)) === 'b', 'variant B not applied');
  const d = await submitAndGetPayload(p);
  assert(d.utm_content === 'ad_b_compare' && d.landing_variant === 'b', 'variant B payload');
  await p.close();
});

await test('utm: no parameters keeps default headline and empty attribution', async () => {
  const p = await openPage('/');
  assert((await p.eval(`document.getElementById('hero-title').dataset.variant`)) === 'default', 'should be default');
  const d = await submitAndGetPayload(p);
  assert(d.utm_source === '' && d.utm_content === '' && d.landing_variant === 'default', 'should be empty: ' + JSON.stringify(d));
  await p.close();
});

await test('utm: attribution survives reload and navigation without parameters', async () => {
  const p = await openPage(AD_B);
  await p.goto('/dekujeme.html');
  await p.goto('/');
  assert((await p.eval(`document.getElementById('hero-title').dataset.variant`)) === 'b', 'variant lost after navigation');
  const d = await submitAndGetPayload(p);
  assert(d.utm_content === 'ad_b_compare' && d.utm_source === 'meta', 'attribution lost: ' + JSON.stringify(d));
  await p.close();
});

await test('utm: first campaign touch wins; campaign replaces a direct visit', async () => {
  const p = await openPage('/');
  await p.goto(AD_A);
  await p.goto(AD_B);
  const d = await submitAndGetPayload(p);
  assert(d.utm_content === 'ad_a_problem', 'expected first campaign (A), got ' + d.utm_content);
  await p.close();
});

await test('utm: unknown utm_content falls back to default headline; values are length-capped', async () => {
  const long = 'x'.repeat(500);
  const p = await openPage(`/?utm_source=newsletter&utm_content=${long}`);
  assert((await p.eval(`document.getElementById('hero-title').dataset.variant`)) === 'default', 'should be default');
  const d = await submitAndGetPayload(p);
  assert(d.utm_source === 'newsletter' && d.utm_content.length === 200, 'cap failed: ' + d.utm_content.length);
  await p.close();
});

await test('live (mock Netlify): attribution reaches the submitted lead', async () => {
  const p = await openPage(AD_A + '&__live=1');
  await p.eval(fillAndSubmit('karel@example.cz'));
  await p.waitFor(isVisible('#lead-success'));
  const last = posts.at(-1);
  assert(last.email === 'karel@example.cz' && last.utm_content === 'ad_a_problem' && last.landing_variant === 'a', 'POST lacks attribution: ' + JSON.stringify(last));
  await p.close();
});

/* ---------- Tests: analytics events ---------- */

// Stand-in for GoatCounter's count.js: records every count() call.
const FAKE_GC = `window.__gcCalls = []; window.goatcounter = { count: (v) => window.__gcCalls.push(v) }; true`;
// Stop real navigation/download on link clicks after our handlers have run.
const BLOCK_NAV = `window.addEventListener('click', (e) => { if (e.target.closest('a')) e.preventDefault(); }); true`;

await test('analytics: full funnel fires events in order, tagged with the variant', async () => {
  const p = await openPage(AD_A + '&debug=1');
  await p.eval(BLOCK_NAV);
  await p.eval(`document.querySelector('.hero [data-track="cta_click"]').click(); true`);
  await p.eval(`document.querySelector('#srovnani .cards').scrollIntoView(); true`);
  await p.waitFor(`window.__events.some(e => e.name === 'comparison_view')`);
  await p.eval(FAKE_GC); // GoatCounter "loads" mid-session: earlier events must be flushed
  await p.eval(`document.getElementById('email').focus(); true`);
  await p.eval(fillAndSubmit('jana@example.cz'));
  await p.waitFor(isVisible('#lead-success'));
  await p.eval(`document.querySelector('#lead-success [data-track="magnet_download"]').click(); true`);

  const names = await p.eval(`window.__events.map(e => e.name)`);
  const expected = ['page_view', 'cta_click', 'comparison_view', 'form_start', 'form_submit', 'lead_success', 'magnet_download'];
  assert(JSON.stringify(names) === JSON.stringify(expected), 'order: ' + names.join(','));
  const paths = await p.eval(`window.__events.map(e => e.path)`);
  assert(paths.every((x) => x.endsWith('/a') && !x.startsWith('/')), 'paths: ' + paths.join(','));
  const calls = await p.eval('window.__gcCalls');
  assert(calls.length === expected.length && calls.every((c) => c.event === true), 'GoatCounter calls: ' + JSON.stringify(calls));
  assert((await p.eval(`document.querySelectorAll('.debug-panel li').length`)) === expected.length, 'debug panel incomplete');
  assert(p.errors.length === 0, 'page errors: ' + p.errors.join(' | '));
  await p.close();
});

await test('analytics: form_start fires once; invalid submit does not fire form_submit', async () => {
  const p = await openPage('/');
  await p.eval(`document.getElementById('email').focus(); document.getElementById('marketing_consent').focus(); true`);
  await p.eval(fillAndSubmit('bad'));
  await p.waitFor(isVisible('#email-error'));
  const names = await p.eval(`window.__events.map(e => e.name)`);
  assert(names.filter((n) => n === 'form_start').length === 1, 'form_start count: ' + names);
  assert(!names.includes('form_submit'), 'form_submit must not fire on invalid input');
  await p.close();
});

await test('analytics: server error fires form_error, not lead_success', async () => {
  failPosts = true;
  const p = await openPage(AD_B + '&__live=1');
  await p.eval(fillAndSubmit('eva@example.cz'));
  await p.waitFor(isVisible('#form-error'));
  const names = await p.eval(`window.__events.map(e => e.name)`);
  assert(names.includes('form_error') && !names.includes('lead_success'), 'events: ' + names);
  failPosts = false;
  await p.close();
});

await test('analytics: no GoatCounter loaded is harmless; source clicks and thank-you download tracked', async () => {
  const p = await openPage('/');
  await p.eval(BLOCK_NAV);
  await p.eval(`document.querySelector('[data-track="source_click"]').click(); true`);
  assert((await p.eval(`window.__events.map(e => e.name).join()`)) === 'page_view,source_click', 'source_click missing');
  await p.goto('/dekujeme.html');
  await p.eval(BLOCK_NAV);
  await p.eval(`document.querySelector('[data-track="magnet_download"]').click(); true`);
  assert((await p.eval(`window.__events.map(e => e.path).join()`)) === 'magnet_download/default', 'thank-you download not tracked');
  assert((await p.eval(`document.querySelector('.debug-panel') === null`)), 'debug panel must be off by default');
  assert(p.errors.length === 0, 'page errors: ' + p.errors.join(' | '));
  await p.close();
});

/* ---------- Tests: page_view, compare button, comparison visibility, debug panel ---------- */

const names = (p) => p.eval(`window.__events.map(e => e.name)`);
const settle = (ms = 400) => new Promise((r) => setTimeout(r, ms));

await test('analytics: page_view is the first event on the landing page and carries the variant', async () => {
  const p = await openPage(AD_B);
  assert((await p.eval(`window.__events[0] && window.__events[0].path`)) === 'page_view/b', 'first event: ' + (await names(p)));
  await p.goto('/dekujeme.html');
  assert(!(await names(p)).includes('page_view'), 'thank-you page must not record a landing page_view');
  await p.close();
});

for (const [width, height] of [[390, 844], [360, 640], [1280, 800]]) {
  await test(`analytics ${width}x${height}: no comparison_view on load; "Zobrazit srovnání" fires compare_click + comparison_view`, async () => {
    const p = await openPage('/', { width, height, mobile: width < 800 });
    await settle();
    assert(!(await names(p)).includes('comparison_view'), 'comparison_view fired without scrolling: ' + (await names(p)));
    await p.eval(`document.querySelector('.hero [data-track="compare_click"]').click(); true`);
    await p.waitFor(`window.__events.some(e => e.name === 'comparison_view')`, 4000);
    const n = await names(p);
    assert(n.indexOf('compare_click') > 0 && n.indexOf('compare_click') < n.indexOf('comparison_view'), 'order: ' + n);
    await p.close();
  });
}

for (const [width, height] of [[320, 640], [375, 667]]) {
  await test(`analytics ${width}x${height}: "Zobrazit srovnání" jump alone fires comparison_view (first fund's key facts)`, async () => {
    const p = await openPage('/', { width, height });
    await settle();
    assert(!(await names(p)).includes('comparison_view'), 'fired before the jump');
    await p.eval(`document.querySelector('.hero [data-track="compare_click"]').click(); true`);
    await p.waitFor(`window.__events.some(e => e.name === 'comparison_view')`, 4000);
    await p.close();
  });
}

await test('analytics 320x568 (4-inch phone): the jump shows only the section intro; a short scroll fires comparison_view', async () => {
  const p = await openPage('/', { width: 320, height: 568 });
  await p.eval(`document.documentElement.style.scrollBehavior = 'auto'; document.querySelector('.hero [data-track="compare_click"]').click(); true`);
  await settle(400);
  assert(!(await names(p)).includes('comparison_view'), 'unexpectedly fired on the jump at 320x568');
  await p.eval(`window.scrollBy(0, 120); true`);
  await p.waitFor(`window.__events.some(e => e.name === 'comparison_view')`, 2000);
  await p.close();
});

await test('analytics: a 20px peek of the comparison does not count as comparison_view', async () => {
  const p = await openPage('/');
  await p.eval(`document.documentElement.style.scrollBehavior = 'auto';
    window.scrollTo(0, document.querySelector('#srovnani .card .fact-key').getBoundingClientRect().top + scrollY - innerHeight + 20); true`);
  await settle();
  assert(!(await names(p)).includes('comparison_view'), 'fired at 20px: ' + (await names(p)));
  await p.close();
});

await test('analytics: comparison already peeking 20px at page load does not count (initial observer callback)', async () => {
  // Measure where the first key facts start, then load with a viewport that ends 20px below that.
  const probe = await openPage('/');
  const keyTop = await probe.eval(`Math.round(document.querySelector('#srovnani .card .fact-key').getBoundingClientRect().top + scrollY)`);
  await probe.close();
  const p = await openPage('/', { width: 390, height: keyTop + 20 });
  await settle();
  const visible = await p.eval(`Math.round(innerHeight - document.querySelector('#srovnani .card .fact-key').getBoundingClientRect().top)`);
  assert(visible > 0 && visible < 40, 'setup: key facts should peek slightly, visible px = ' + visible);
  assert(!(await names(p)).includes('comparison_view'), 'fired on a small peek at load: ' + (await names(p)));
  await p.close();
});

await test('debug: panel shows page_view on load and explains an unrecognised utm_content', async () => {
  const p = await openPage('/?utm_content=a&debug=1');
  assert((await p.eval(`[...document.querySelectorAll('.debug-panel li')].map(li => li.textContent).join()`)) === 'page_view/default', 'panel rows');
  const info = await p.eval(`document.querySelector('.debug-panel p').textContent`);
  assert(info.includes('variant: default') && info.includes('not recognised') && info.includes('ad_a_problem'), 'info: ' + info);
  await p.goto('/?utm_content=ad_a_problem&debug=1'); // same session: first touch 'a' is kept
  assert((await p.eval(`document.querySelector('.debug-panel p').textContent`)).includes('utm_content=a,'), 'first touch should still be shown');
  await p.close();
});

await test('debug: utm_content is shown as text, never parsed as HTML', async () => {
  const p = await openPage('/?debug=1&utm_content=' + encodeURIComponent('<img src=x onerror="window.__xss=1">'));
  await settle(200);
  assert((await p.eval(`document.querySelectorAll('.debug-panel img').length`)) === 0, 'HTML was injected');
  assert((await p.eval(`window.__xss`)) === undefined, 'script ran');
  assert(p.errors.length === 0, 'errors: ' + p.errors.join(' | '));
  await p.close();
});

await test('utm: short values a and b are not variants (only ad_a_problem / ad_b_compare)', async () => {
  for (const v of ['a', 'b', 'A', 'ad_a']) {
    const p = await openPage('/?utm_content=' + v);
    assert((await p.eval(`document.getElementById('hero-title').dataset.variant`)) === 'default', v + ' should be default');
    await p.close();
  }
});

/* ---------- Tests: US table on narrow screens (M1) ---------- */

// Geometry of the US table: horizontal scrolling, cells outside the container,
// labels that collide with values, and links outside the viewport.
const US_TABLE_GEOMETRY = `(() => {
  const ts = document.querySelector('#srovnani .table-scroll'), box = ts.getBoundingClientRect();
  const cells = [...ts.querySelectorAll('tbody th, tbody td')];
  const outside = cells.filter((c) => { const b = c.getBoundingClientRect(); return b.left < box.left - 0.5 || b.right > box.right + 0.5; }).length;
  const tds = [...ts.querySelectorAll('tbody td')];
  const labelInfo = tds.map((td) => {
    const lab = getComputedStyle(td, '::before');
    const range = document.createRange(); range.selectNodeContents(td);
    const first = range.getClientRects()[0];
    const tdLeft = td.getBoundingClientRect().left;
    return { label: lab.content.replace(/^"|"$/g, ''), expected: td.dataset.label, labelRight: parseFloat(lab.left) + parseFloat(lab.width), valueLeft: first ? first.left - tdLeft : 0 };
  });
  const links = [...ts.querySelectorAll('a')].map((a) => { const b = a.getBoundingClientRect(); return b.left >= 0 && b.right <= innerWidth && b.width > 0 && b.height > 0; });
  return { scrolls: ts.scrollWidth > ts.clientWidth, pageScrolls: document.documentElement.scrollWidth > innerWidth, outside, labelInfo, linksVisible: links.every(Boolean), linkCount: links.length, display: getComputedStyle(tds[0]).display };
})()`;

for (const [width, height] of [[320, 640], [360, 800], [390, 844]]) {
  await test(`layout ${width}x${height}: US table shows every field without horizontal scrolling`, async () => {
    const p = await openPage('/', { width, height });
    assert((await p.eval(`document.getElementById('americke-etf').open`)) === false, 'US disclosure should start closed on phones');
    await p.eval(`document.querySelector('#americke-etf > summary').click(); true`);
    const g = await p.eval(US_TABLE_GEOMETRY);
    assert(g.display === 'block', 'expected stacked layout, got display ' + g.display);
    assert(!g.scrolls && !g.pageScrolls, 'horizontal scrolling present');
    assert(g.outside === 0, g.outside + ' cells outside the table container');
    assert(g.labelInfo.length === 15, 'expected 15 data cells, got ' + g.labelInfo.length);
    for (const l of g.labelInfo) {
      assert(l.label === l.expected, `visible label "${l.label}" != data-label "${l.expected}"`);
      assert(l.labelRight <= l.valueLeft + 0.5, `label "${l.label}" overlaps its value`);
    }
    assert(g.linkCount === 3 && g.linksVisible, 'source links not fully visible');
    await p.close();
  });
}

for (const [width, height] of [[768, 1024], [1280, 800]]) {
  await test(`layout ${width}x${height}: US table keeps its table layout with visible column headers`, async () => {
    const p = await openPage('/', { width, height, mobile: false });
    assert((await p.eval(`document.getElementById('americke-etf').open`)) === true, 'US disclosure should be open from 48rem');
    const g = await p.eval(US_TABLE_GEOMETRY);
    assert(g.display === 'table-cell', 'expected table layout, got ' + g.display);
    assert(!g.scrolls && g.outside === 0, 'table overflows its container');
    const headers = await p.eval(`[...document.querySelectorAll('#srovnani thead th')].map(th => th.getBoundingClientRect().height > 10)`);
    assert(headers.length === 6 && headers.every(Boolean), 'column headers not visible');
    await p.close();
  });
}

await test('layout: every data-label matches its column header text', async () => {
  const p = await openPage('/');
  const mismatches = await p.eval(`(() => {
    const heads = [...document.querySelectorAll('#srovnani thead th')].map(th => th.textContent.trim());
    return [...document.querySelectorAll('#srovnani tbody tr')].flatMap(tr => [...tr.children].slice(1).map((td, i) => td.dataset.label === heads[i + 1] ? null : (td.dataset.label + ' vs ' + heads[i + 1]))).filter(Boolean);
  })()`);
  assert(mismatches.length === 0, 'mismatches: ' + mismatches.join(', '));
  await p.close();
});

await test('a11y (Chrome): native table semantics are kept in the stacked mobile layout', async () => {
  for (const [width, mobile] of [[360, true], [1280, false]]) {
    const p = await openPage('/', { width, height: 800, mobile });
    await p.eval(`document.getElementById('americke-etf').open = true; true`);
    await settle(200);
    await p.cdp('Accessibility.enable');
    const { nodes } = await p.cdp('Accessibility.getFullAXTree');
    const count = (role) => nodes.filter((n) => !n.ignored && n.role?.value === role).length;
    const got = { table: count('table'), columnheader: count('columnheader'), rowheader: count('rowheader'), cell: count('cell') };
    assert(got.table === 1 && got.columnheader === 6 && got.rowheader === 3 && got.cell === 15, `${width}px roles: ` + JSON.stringify(got));
    await p.close();
  }
});

/* ---------- Tests: UCITS fund cards (M3) ---------- */

await test('cards: ticker leads each heading; fee and index come first; all 9 facts kept', async () => {
  const p = await openPage('/');
  const cards = await p.eval(`[...document.querySelectorAll('#srovnani .card')].map(c => ({
    first: c.querySelector('h4').firstElementChild?.className,
    heading: c.querySelector('h4').textContent.replace(/\\s+/g, ' ').trim(),
    labelledby: c.getAttribute('aria-labelledby') === c.querySelector('h4').id,
    dts: [...c.querySelectorAll('.facts > div > dt')].map(dt => dt.textContent.trim()),
    keys: [...c.querySelectorAll('.facts > .fact-key > dt')].map(dt => dt.textContent.trim()) }))`);
  assert(cards.length === 4, 'expected 4 cards, got ' + cards.length);
  const tickers = ['CSPX', 'VUAA', 'SWDA', 'VWCE'];
  cards.forEach((c, i) => {
    assert(c.first === 'card-ticker' && c.heading.startsWith(tickers[i] + ' '), 'heading: ' + c.heading);
    assert(c.labelledby, 'aria-labelledby no longer points at the heading');
    assert(c.dts.length === 9, c.heading + ': ' + c.dts.length + ' facts');
    assert(c.keys.length === 2 && c.keys[0].startsWith('Roční náklady') && c.keys[1] === 'Index', 'key facts: ' + c.keys.join(', '));
    assert(c.dts[0].startsWith('Roční náklady') && c.dts[1] === 'Index', 'key facts not first');
  });
  await p.close();
});

for (const [width, height] of [[320, 640], [360, 800], [390, 844]]) {
  await test(`cards ${width}x${height}: no overflow; fee emphasised; source links are 44px rows with tracking`, async () => {
    const p = await openPage('/', { width, height });
    const r = await p.eval(`(() => {
      const cards = [...document.querySelectorAll('#srovnani .card')];
      const outside = cards.flatMap(c => { const cb = c.getBoundingClientRect(); return [...c.querySelectorAll('*')].filter(el => { const b = el.getBoundingClientRect(); return b.width && (b.right > cb.right + 0.5 || b.left < cb.left - 0.5); }); }).length;
      const links = cards.flatMap(c => [...c.querySelectorAll('.card-src a')]);
      return {
        pageScrolls: document.documentElement.scrollWidth > innerWidth,
        outside,
        feePx: cards.map(c => parseFloat(getComputedStyle(c.querySelector('.fact-key:first-child dd')).fontSize)),
        bodyPx: parseFloat(getComputedStyle(document.body).fontSize),
        links: links.map(a => ({ h: a.getBoundingClientRect().height, inView: a.getBoundingClientRect().right <= innerWidth, track: a.dataset.track, ext: a.target === '_blank' && a.rel === 'noopener' })),
      };
    })()`);
    assert(!r.pageScrolls && r.outside === 0, `overflow: page ${r.pageScrolls}, elements outside cards ${r.outside}`);
    assert(r.feePx.every((f) => f >= 1.4 * r.bodyPx), 'fee not emphasised: ' + r.feePx.join(','));
    assert(r.links.length === 9, 'expected 9 source links, got ' + r.links.length);
    for (const l of r.links) {
      assert(l.h >= 44, 'source link only ' + l.h + 'px tall');
      assert(l.inView && l.track === 'source_click' && l.ext, 'link attributes or position changed: ' + JSON.stringify(l));
    }
    await p.close();
  });
}

/* ---------- Tests: M4 mobile conversion ---------- */

// Fee shown in a fund card, e.g. "0,07 %" for CSPX.
const CARD_FEES = `Object.fromEntries([...document.querySelectorAll('#srovnani .card')].map(c => [c.querySelector('.card-ticker').textContent, c.querySelector('.fact-key dd').textContent.replace(/\\u00a0/g, ' ').trim()]))`;
const norm = (t) => t.replace(/ /g, ' ').replace(/\s+/g, ' ').trim();

for (const [variant, path, mustInclude] of [
  ['default', '/', ['SPY / VOO', 'CSPX', 'VUAA', 'S&P 500']],
  ['a', AD_A, ['SPY / VOO', 'CSPX', 'VUAA', 'S&P 500']],
  ['b', AD_B, ['S&P 500 (jen USA)', 'CSPX', 'VUAA', 'Globální akcie', 'SWDA (rozvinuté trhy)', 'VWCE (vč. rozvíjejících se)']],
]) {
  for (const [width, height] of [[320, 640], [375, 667]]) await test(`teaser (${variant}) ${width}x${height}: matches the ad, fees equal the fund cards, sources linked, teaser + CTA on the first screen`, async () => {
    const p = await openPage(path, { width, height });
    const t = norm(await p.eval(`document.getElementById('hero-teaser').textContent`));
    for (const m of mustInclude) assert(t.includes(m), `teaser lacks "${m}": ${t}`);
    const fees = await p.eval(CARD_FEES);
    for (const [ticker, fee] of Object.entries(fees)) {
      if (!t.includes(ticker)) continue;
      // The fee printed next to the ticker (or for the CSPX/VUAA pair) must be the card's value.
      assert(t.includes(fee), `teaser mentions ${ticker} but not its card fee ${fee}: ${t}`);
    }
    if (variant === 'b') {
      assert(!/celý svět/.test(t), 'B teaser must not call MSCI World "the whole world"');
      const h1 = norm(await p.eval(`document.querySelector('h1').textContent`));
      assert(h1 === 'S&P 500, nebo globální akcie? 4 evropské ETF v jednom srovnání.', 'B headline: ' + h1);
    }
    assert((await p.eval(`document.querySelector('.hero-teaser-src a').getAttribute('href')`)) === '#srovnani', 'source link');
    const fold = await p.eval(`(() => { const r = el => el.getBoundingClientRect(); return { teaser: r(document.getElementById('hero-teaser')).bottom, cta: r(document.querySelector('.hero .btn-primary')).bottom, vh: innerHeight }; })()`);
    assert(fold.teaser <= fold.vh && fold.cta <= fold.vh, `teaser/CTA below the first screen: ${JSON.stringify(fold)}`);
    await p.close();
  });
}

await test('comparison order: UCITS cards first, US ETFs after them in a disclosure; Podrobnosti hold the secondary facts', async () => {
  const p = await openPage('/', { width: 375, height: 667 });
  const r = await p.eval(`(() => {
    const sec = document.getElementById('srovnani');
    const firstCard = sec.querySelector('.card'), us = document.getElementById('americke-etf');
    const more = [...sec.querySelectorAll('.card details.card-more')];
    return {
      cardsBeforeUs: !!(firstCard.compareDocumentPosition(us) & Node.DOCUMENT_POSITION_FOLLOWING),
      usTag: us.tagName, usOpen: us.open, usSummary: us.querySelector('summary').textContent.replace(/\\s+/g, ' ').trim(),
      usHasTable: !!us.querySelector('table.data-table'),
      moreCount: more.length, moreOpen: more.some(d => d.open), moreLabels: [...new Set(more.map(d => d.querySelector('summary').textContent.trim()))],
      moreDts: more.map(d => [...d.querySelectorAll('dt')].map(dt => dt.textContent.trim()).join('|')),
      visibleDts: [...sec.querySelector('.card').querySelectorAll(':scope > .facts > div > dt')].map(dt => dt.textContent.trim()),
    };
  })()`);
  assert(r.cardsBeforeUs, 'UCITS cards must come before the US ETFs');
  assert(r.usTag === 'DETAILS' && !r.usOpen && r.usSummary.startsWith('Americké ETF pro srovnání') && r.usHasTable, 'US disclosure: ' + JSON.stringify(r));
  assert(r.moreCount === 4 && !r.moreOpen && r.moreLabels.join() === 'Podrobnosti', 'Podrobnosti: ' + JSON.stringify(r));
  for (const d of r.moreDts) assert(d === 'Sídlo fondu|Replikace|Vznik třídy|Velikost třídy', 'secondary facts: ' + d);
  assert(r.visibleDts.join('|') === 'Roční náklady (TER)|Index|ISIN|Výnosy|Příklady tickerů', 'visible facts: ' + r.visibleDts.join('|'));
  await p.close();
});

await test('disclosures: open from 48rem; on phones they toggle with the keyboard (Enter)', async () => {
  const wide = await openPage('/', { width: 1280, height: 800, mobile: false });
  assert((await wide.eval(`[...document.querySelectorAll('details[data-open-wide]')].every(d => d.open)`)), 'not all disclosures open on desktop');
  await wide.close();
  const p = await openPage('/', { width: 375, height: 667 });
  for (const sel of ['#americke-etf > summary', '#srovnani .card details.card-more > summary']) {
    await p.eval(`document.querySelector(${JSON.stringify(sel)}).focus(); true`);
    assert((await p.eval(`document.activeElement === document.querySelector(${JSON.stringify(sel)})`)), sel + ' not focusable');
    await p.cdp('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, text: '\r' });
    await p.cdp('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 });
    await settle(150);
    assert((await p.eval(`document.querySelector(${JSON.stringify(sel)}).parentElement.open`)), sel + ' did not open with Enter');
  }
  await p.close();
});

for (const [width, height] of [[320, 640], [375, 667], [390, 844]]) {
  await test(`Podrobnosti ${width}x${height}: all four collapsed by default; each toggles with Enter and Space; expanded state exposed`, async () => {
    const p = await openPage('/', { width, height });
    assert((await p.eval(`[...document.querySelectorAll('#srovnani details.card-more')].map(d => d.open).join()`)) === 'false,false,false,false', 'not all collapsed');
    await p.cdp('Accessibility.enable');
    const expandedStates = async () => (await p.cdp('Accessibility.getFullAXTree')).nodes
      .filter((n) => !n.ignored && (n.name?.value || '') === 'Podrobnosti' && (n.properties || []).some((x) => x.name === 'expanded'))
      .map((n) => n.properties.find((x) => x.name === 'expanded').value.value);
    assert((await expandedStates()).join() === 'false,false,false,false', 'AX expanded before: ' + (await expandedStates()).join());
    const key = async (k, code, text) => {
      await p.cdp('Input.dispatchKeyEvent', { type: 'keyDown', key: k, code, windowsVirtualKeyCode: k === 'Enter' ? 13 : 32, text });
      await p.cdp('Input.dispatchKeyEvent', { type: 'keyUp', key: k, code, windowsVirtualKeyCode: k === 'Enter' ? 13 : 32 });
      await settle(120);
    };
    for (let i = 0; i < 4; i++) {
      const open = `document.querySelectorAll('#srovnani details.card-more')[${i}].open`;
      await p.eval(`document.querySelectorAll('#srovnani details.card-more > summary')[${i}].focus(); true`);
      await key('Enter', 'Enter', '\r');
      assert(await p.eval(open), `card ${i + 1}: Enter did not open`);
      await key(' ', 'Space', ' ');
      assert(!(await p.eval(open)), `card ${i + 1}: Space did not close`);
      await key(' ', 'Space', ' ');
      assert(await p.eval(open), `card ${i + 1}: Space did not open`);
    }
    assert((await expandedStates()).join() === 'true,true,true,true', 'AX expanded after: ' + (await expandedStates()).join());
    await p.close();
  });
}

await test('lead form: first-name field removed and not submitted', async () => {
  const p = await openPage('/');
  assert((await p.eval(`document.querySelectorAll('[name="first_name"], #first_name').length`)) === 0, 'first-name field still present');
  const d = await submitAndGetPayload(p);
  assert(!('first_name' in d) && d.email === 'jana@example.cz', 'payload: ' + JSON.stringify(d));
  await p.close();
});

await test('PDF preview: real image from the PDF, alt text, intrinsic size, beside the list on phones', async () => {
  const p = await openPage('/', { width: 375, height: 667 });
  await p.eval(`document.querySelector('.magnet-preview').scrollIntoView(); true`);
  await p.waitFor(`document.querySelector('.magnet-preview').complete && document.querySelector('.magnet-preview').naturalWidth > 0`, 4000);
  const r = await p.eval(`(() => { const img = document.querySelector('.magnet-preview'), list = document.querySelector('.magnet .ticks'); const a = img.getBoundingClientRect(), b = list.getBoundingClientRect();
    return { src: img.getAttribute('src'), alt: img.alt, w: img.getAttribute('width'), h: img.getAttribute('height'), natural: img.naturalWidth + 'x' + img.naturalHeight, loading: img.loading, besideList: a.left >= b.right - 1 && a.top < b.bottom, inView: a.right <= innerWidth, cssW: Math.round(a.width) }; })()`);
  assert(r.src === 'assets/tahak-nahled.jpg' && r.alt.startsWith('Náhled první strany taháku') && r.w && r.h && r.loading === 'lazy', JSON.stringify(r));
  assert(r.besideList && r.inView && r.cssW >= 80, 'layout: ' + JSON.stringify(r));
  const res = await fetch(BASE + '/assets/tahak-nahled.jpg');
  const size = (await res.arrayBuffer()).byteLength;
  assert(res.ok && size < 60 * 1024, 'preview missing or too large: ' + size + ' bytes');
  await p.close();
});

await test('anchor jumps land flush under the sticky header (no paper strip above the comparison)', async () => {
  const p = await openPage('/', { width: 375, height: 667 });
  await p.eval(`document.documentElement.style.scrollBehavior = 'auto'; document.querySelector('.hero [data-track="compare_click"]').click(); true`);
  await settle(300);
  const gap = await p.eval(`Math.round(document.getElementById('srovnani').getBoundingClientRect().top - document.querySelector('.site-header').getBoundingClientRect().bottom) + 0`);
  assert(Math.abs(gap) <= 1, 'gap between header and comparison: ' + gap + 'px');
  await p.close();
});

await test('form inputs: boundary contrast at least 3:1 in light and dark', async () => {
  for (const scheme of ['light', 'dark']) {
    const p = await openPage('/');
    await p.cdp('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: scheme }] });
    const ratio = await p.eval(`(() => {
      const rgb = s => s.match(/\\d+/g).slice(0, 3).map(Number);
      const lum = c => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; const [r, g, b] = c.map(f); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
      const input = document.getElementById('email');
      const border = rgb(getComputedStyle(input).borderTopColor), bg = rgb(getComputedStyle(input).backgroundColor), form = rgb(getComputedStyle(input.closest('form')).backgroundColor);
      const cr = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
      return Math.min(cr(border, bg), cr(border, form));
    })()`);
    assert(ratio >= 3, `${scheme}: input border contrast ${ratio.toFixed(2)}`);
    await p.close();
  }
});

for (const [width, height] of [[320, 640], [375, 667], [390, 844], [768, 1024], [1280, 800]]) {
  await test(`layout ${width}x${height}: no horizontal overflow anywhere, with every disclosure open`, async () => {
    const p = await openPage('/', { width, height, mobile: width < 768 });
    await p.eval(`document.querySelectorAll('details').forEach(d => d.open = true); true`);
    await settle(150);
    const r = await p.eval(`(() => ({ page: document.documentElement.scrollWidth > innerWidth, els: [...document.querySelectorAll('body *')].filter(el => !el.closest('.table-scroll') && el.getBoundingClientRect().right > innerWidth + 1).map(el => el.tagName + '.' + el.className).slice(0, 5) }))()`);
    assert(!r.page && r.els.length === 0, 'overflow: ' + JSON.stringify(r));
    await p.close();
  });
}

/* ---------- Tests: ads and PDF (M5) ---------- */

// Fees as the landing page shows them in the fund cards (single source for consistency checks).
const cardFees = async () => { const p = await openPage('/'); const f = await p.eval(CARD_FEES); await p.close(); return f; };

for (const ad of ['a', 'b']) {
  await test(`ad ${ad.toUpperCase()}: renders inside 1080x1350, fees equal the fund cards, not-advice line present`, async () => {
    const fees = await cardFees();
    const p = await openPage(`/ads/ad-${ad}.html`, { width: 1080, height: 1350, mobile: false });
    const r = await p.eval(`(() => { const els = [...document.querySelectorAll('.ad *')]; return {
      bottom: Math.max(...els.map(e => e.getBoundingClientRect().bottom)), right: Math.max(...els.map(e => e.getBoundingClientRect().right)),
      text: document.querySelector('.ad').textContent.replace(/\\u00a0/g, ' ').replace(/\\s+/g, ' ').trim() }; })()`);
    assert(r.bottom <= 1350 && r.right <= 1080, `clipped: bottom ${r.bottom}, right ${r.right}`);
    assert(r.text.includes('Nejde o investiční doporučení'), 'not-advice line missing');
    assert(!/celý svět/i.test(r.text), 'ad must not say "celý svět"');
    for (const [ticker, fee] of Object.entries(fees)) if (r.text.includes(ticker)) assert(r.text.includes(fee), `${ticker} fee ${fee} missing in ad`);
    if (ad === 'a') {
      const lp = await openPage(AD_A); const teaser = norm(await lp.eval(`document.getElementById('hero-teaser').textContent`)); await lp.close();
      assert(r.text.includes(teaser), 'ad A must repeat the variant A teaser: ' + teaser);
      assert(r.text.includes('Ilustrační obrázek'), 'phone mock-up must be labelled as an illustration');
    } else {
      for (const m of ['S&P 500, nebo globální akcie?', 'jen USA', 'Globální akcie', 'SWDA', 'rozvinuté trhy', 'VWCE', 'rozvinuté i rozvíjející se trhy', 'CSPX', 'VUAA'])
        assert(r.text.includes(m), `ad B lacks "${m}"`);
      const fund = await p.eval(`[...document.querySelectorAll('.fund')].map(f => f.querySelector('.tk').textContent + ' ' + f.querySelector('.fee').textContent.replace(/\\u00a0/g, ' '))`);
      for (const line of fund) { const [tk, ...rest] = line.split(' '); assert(rest.join(' ') === fees[tk], `${tk}: ad ${rest.join(' ')} vs card ${fees[tk]}`); }
    }
    await p.close();
  });
}

await test('PDF source (tahak.html): fees per ticker equal the fund cards; no "celý svět"', async () => {
  const fees = await cardFees();
  const p = await openPage('/tahak.html', { width: 900, height: 1200, mobile: false });
  const rows = await p.eval(`[...document.querySelectorAll('tbody tr')].filter(tr => tr.querySelector('.tk')).map(tr => [tr.querySelector('.tk').textContent, tr.children[3].textContent.replace(/\\u00a0/g, ' ').trim()])`);
  const text = await p.eval(`document.body.textContent`);
  assert(!/celý svět/i.test(text), 'PDF source must not say "celý svět"');
  for (const [tk, fee] of rows) if (fees[tk]) assert(fee.startsWith(fees[tk]), `${tk}: PDF ${fee} vs card ${fees[tk]}`);
  assert(rows.length === 7, 'expected 7 fund rows, got ' + rows.length);
  await p.close();
});

await test('PDF file: exactly 2 pages; every source URL from tahak.html is a clickable link', async () => {
  const bytes = Buffer.from(await (await fetch(BASE + '/assets/tahak-etf.pdf')).arrayBuffer()).toString('latin1');
  const count = bytes.match(/\/Type \/Pages[\s\S]{0,200}?\/Count (\d+)|\/Count (\d+)/);
  const pages = Number(count[1] || count[2]);
  assert(pages === 2, 'PDF pages: ' + pages);
  // Chrome normalises a bare origin to "https://host/", so compare without a trailing slash.
  const noSlash = (u) => u.replace(/\/$/, '');
  const uris = new Set([...bytes.matchAll(/\/URI \((https:\/\/[^)]*)\)/g)].map((m) => noSlash(m[1])));
  const html = await (await fetch(BASE + '/tahak.html')).text();
  const expected = new Set([...html.matchAll(/<a href="(https:\/\/[^"]+)"/g)].map((m) => m[1]));
  assert(expected.size === 13, 'expected 13 source links in tahak.html, got ' + expected.size);
  for (const u of expected) assert(uris.has(noSlash(u)), 'not a link in the PDF: ' + u);
});

/* ---------- Tests: production headers ---------- */

await test('csp: every page loads with the production CSP and no console errors', async () => {
  for (const path of ['/', '/?utm_content=ad_b_compare&debug=1', '/dekujeme.html', '/ochrana-udaju.html', '/tahak.html']) {
    const p = await openPage(path);
    await new Promise((r) => setTimeout(r, 300));
    assert(p.errors.length === 0, path + ' errors: ' + p.errors.join(' | '));
    await p.close();
  }
});

/* ---------- Report ---------- */

ws.close();
chrome.kill();
server.close();
await rm(profile, { recursive: true, force: true }).catch(() => {});

for (const [status, name] of results) console.log(`${status}  ${name}`);
const failed = results.filter(([s]) => s === 'FAIL').length;
console.log(`\n${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);
