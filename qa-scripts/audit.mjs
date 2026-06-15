import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const auditRoot = process.cwd();
const outDir = path.join(auditRoot, 'qa-artifacts');
await fs.mkdir(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  ignoreHTTPSErrors: true,
});
const page = await context.newPage();
const events = [];

page.on('console', (msg) => events.push({ type: 'console', level: msg.type(), text: msg.text(), url: page.url() }));
page.on('pageerror', (err) => events.push({ type: 'pageerror', text: String(err), url: page.url() }));
page.on('requestfailed', (req) =>
  events.push({ type: 'requestfailed', url: req.url(), failure: req.failure()?.errorText, method: req.method(), page: page.url() }),
);
page.on('response', (res) => {
  if (res.status() >= 400) events.push({ type: 'http', status: res.status(), url: res.url(), page: page.url() });
});

const base = 'http://127.0.0.1:8080';
const routes = [
  '/',
  '/dashboard',
  '/pitch',
  '/pricing',
  '/auth',
  '/auth?mode=signup',
  '/create-assignment',
  '/training',
  '/upload-training',
  '/submit-assignment',
  '/lms',
  '/profile',
  '/billing',
  '/metrics',
  '/history',
  '/assignment/not-a-real-id',
  '/submission/not-a-real-id',
  '/pdf/submission/not-a-real-id',
  '/not-real-route',
  '/%3Cscript%3Ealert(1)%3C/script%3E',
];

const results = [];
for (const route of routes) {
  const started = Date.now();
  try {
    const resp = await page.goto(base + route, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(600);
    const title = await page.title();
    const h1 = await page.locator('h1').first().textContent({ timeout: 1000 }).catch(() => null);
    const text = (await page.locator('body').innerText({ timeout: 3000 }).catch((e) => String(e))).slice(0, 1000);
    const buttons = await page
      .locator('button')
      .evaluateAll((bs) =>
        bs.map((b) => ({ text: (b.innerText || b.getAttribute('aria-label') || '').trim(), disabled: b.disabled })).slice(0, 30),
      );
    const links = await page
      .locator('a')
      .evaluateAll((as) => as.map((a) => ({ text: (a.innerText || '').trim(), href: a.href })).slice(0, 30));
    const file = `route-${route.replace(/[^a-z0-9]+/gi, '_').replace(/^_+|_+$/g, '') || 'root'}-desktop.png`;
    await page.screenshot({ path: path.join(outDir, file), fullPage: true });
    results.push({ route, status: resp?.status(), finalUrl: page.url(), ms: Date.now() - started, title, h1, text, buttons, links, screenshot: `qa-artifacts/${file}` });
  } catch (e) {
    results.push({ route, error: String(e), finalUrl: page.url(), ms: Date.now() - started });
  }
}

async function authInteraction(pathname, actionName, handler, screenshotName) {
  const authContext = await browser.newContext({ viewport: { width: 1440, height: 1000 }, ignoreHTTPSErrors: true });
  const authPage = await authContext.newPage();
  authPage.on('console', (msg) => events.push({ type: 'console', level: msg.type(), text: msg.text(), url: authPage.url() }));
  authPage.on('requestfailed', (req) =>
    events.push({ type: 'requestfailed', url: req.url(), failure: req.failure()?.errorText, method: req.method(), page: authPage.url() }),
  );
  authPage.on('response', (res) => {
    if (res.status() >= 400) events.push({ type: 'http', status: res.status(), url: res.url(), page: authPage.url() });
  });
  await authPage.goto(base + pathname, { waitUntil: 'domcontentloaded', timeout: 15000 }).catch((e) => {
    events.push({ type: 'interaction-error', action: `${actionName} load`, text: String(e) });
  });
  await authPage.waitForTimeout(1000);
  try {
    await handler(authPage);
  } catch (e) {
    events.push({ type: 'interaction-error', action: actionName, text: String(e), url: authPage.url() });
  }
  await authPage.waitForTimeout(1500);
  const bodyText = await authPage.locator('body').innerText().catch((e) => String(e));
  await authPage.screenshot({ path: path.join(outDir, screenshotName), fullPage: true }).catch(() => {});
  await authContext.close();
  return bodyText;
}

const invalidAuthText = await authInteraction(
  '/auth',
  'invalid sign in',
  async (authPage) => {
    await authPage.getByLabel('Email').fill('not-an-email');
    await authPage.getByLabel('Password').fill('x');
    await authPage.getByRole('button', { name: /sign in/i }).click();
  },
  'auth-invalid-login.png',
);

const signupText = await authInteraction(
  '/auth?mode=signup',
  'weak signup',
  async (authPage) => {
    await authPage.getByLabel('Full name').fill('<img src=x onerror=alert(1)>', { timeout: 5000 });
    await authPage.getByLabel('Email').fill(`qa+${Date.now()}@example.com`);
    await authPage.getByLabel('Password').fill('123');
    await authPage.getByRole('button', { name: /create account/i }).click();
  },
  'auth-weak-signup-xss-name.png',
);

const responsive = [];
for (const vp of [
  { name: 'mobile', w: 390, h: 844 },
  { name: 'tablet', w: 768, h: 1024 },
  { name: 'desktop', w: 1440, h: 1000 },
]) {
  await page.setViewportSize({ width: vp.w, height: vp.h });
  for (const route of ['/pitch', '/pricing', '/auth']) {
    await page.goto(base + route, { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(500);
    const file = `${vp.name}-${route.replace('/', '') || 'root'}.png`;
    await page.screenshot({ path: path.join(outDir, file), fullPage: true });
    const horizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    responsive.push({ viewport: vp.name, route, finalUrl: page.url(), horizontalOverflow, screenshot: `qa-artifacts/${file}` });
  }
}

await context.route('**/*', async (route) => {
  await new Promise((resolve) => setTimeout(resolve, 750));
  await route.continue();
});
await page.setViewportSize({ width: 390, height: 844 });
const slowStart = Date.now();
await page.goto(base + '/pricing', { waitUntil: 'domcontentloaded', timeout: 20000 }).catch((e) => events.push({ type: 'slow-nav-error', text: String(e) }));
await page.screenshot({ path: path.join(outDir, 'slow-pricing-domcontentloaded.png'), fullPage: true });
const slowText = (await page.locator('body').innerText().catch((e) => String(e))).slice(0, 1000);
const slow = { route: '/pricing', msToDom: Date.now() - slowStart, text: slowText, screenshot: 'qa-artifacts/slow-pricing-domcontentloaded.png' };

await browser.close();
const report = { generatedAt: new Date().toISOString(), base, results, invalidAuthText, signupText, responsive, slow, events };
await fs.writeFile(path.join(outDir, 'playwright-audit.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify({ outDir, routeCount: results.length, eventCount: events.length, sampleEvents: events.slice(0, 20), responsive }, null, 2));
