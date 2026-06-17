import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const outDir = path.join(process.cwd(), 'qa-artifacts');
await fs.mkdir(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, ignoreHTTPSErrors: true });
const page = await context.newPage();
const events = [];
page.on('console', (msg) => events.push({ type: 'console', level: msg.type(), text: msg.text() }));
page.on('response', (res) => {
  if (res.status() >= 400) events.push({ type: 'http', status: res.status(), url: res.url() });
});

const email = `aita.qa.${Date.now()}@gmail.com`;
await page.goto('http://127.0.0.1:8080/auth?mode=signup', { waitUntil: 'networkidle' });
await page.getByLabel('Full name').fill('QA Teacher');
await page.getByLabel('Email').fill(email);
await page.getByLabel('Password').fill('ValidPass123!');
await page.getByRole('button', { name: /^Create account$/i }).click();
await page.waitForTimeout(3000);
const bodyText = await page.locator('body').innerText();
await page.screenshot({ path: path.join(outDir, 'auth-valid-signup.png'), fullPage: true });
await browser.close();

console.log(JSON.stringify({ email, url: page.url(), bodyText: bodyText.slice(0, 1500), events }, null, 2));
