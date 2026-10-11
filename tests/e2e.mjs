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
    res.writeHead(200, { 'Content-Type': TYPES[extname(path)] || 'application/octet-stream' }).end(data);
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
  f.elements.first_name.value = 'Jana';
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

/* ---------- Report ---------- */

ws.close();
chrome.kill();
server.close();
await rm(profile, { recursive: true, force: true }).catch(() => {});

for (const [status, name] of results) console.log(`${status}  ${name}`);
const failed = results.filter(([s]) => s === 'FAIL').length;
console.log(`\n${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);
