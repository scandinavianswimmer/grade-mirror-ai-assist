import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import AxeBuilder from '@axe-core/playwright';
import { chromium } from 'playwright';

const root = process.cwd();
const outDir = path.join(root, 'qa-artifacts');
// Use a per-process high port so repeated local/CI runs cannot attach to a preview server that is
// still shutting down from the prior run.
const port = 41000 + (process.pid % 10000);
const baseUrl = `http://127.0.0.1:${port}`;
const viteEntry = path.join(root, 'node_modules', 'vite', 'bin', 'vite.js');
const routes = ['/', '/privacy', '/terms', '/accessibility', '/auth', '/not-a-real-page'];
const wcagTags = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

await fs.mkdir(outDir, { recursive: true });

const serverOutput = [];
const server = spawn(
  process.execPath,
  [viteEntry, 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'],
  { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] },
);
server.stdout.on('data', (chunk) => serverOutput.push(chunk.toString()));
server.stderr.on('data', (chunk) => serverOutput.push(chunk.toString()));

const waitForServer = async () => {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    if (server.exitCode !== null) {
      throw new Error(`Preview server exited before it was ready.\n${serverOutput.join('')}`);
    }
    try {
      const response = await fetch(baseUrl, { redirect: 'manual' });
      if (response.ok || response.status === 301 || response.status === 302) return;
    } catch {
      // The server is still starting.
    }
    await delay(250);
  }
  throw new Error(`Timed out waiting for ${baseUrl}.\n${serverOutput.join('')}`);
};

let browser;
try {
  await waitForServer();
  try {
    browser = await chromium.launch({ headless: true });
  } catch (error) {
    if (!String(error).includes("Executable doesn't exist")) throw error;
    // Local contributors commonly have stable Chrome but not Playwright's downloaded Chromium.
    // CI installs the pinned browser explicitly below, so this is a local-only convenience fallback.
    browser = await chromium.launch({ headless: true, channel: 'chrome' });
  }
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: 'reduce',
  });
  const results = [];

  for (const route of routes) {
    const page = await context.newPage();
    await page.goto(`${baseUrl}${route}`, { waitUntil: 'networkidle' });
    // Let entrance transitions settle so contrast is measured in the stable rendered state rather
    // than against a partially transparent animation frame.
    await page.waitForTimeout(800);

    const desktopAxe = await new AxeBuilder({ page }).withTags(wcagTags).analyze();
    const footer = page.getByRole('contentinfo');
    const footerCount = await footer.count();
    const legalNavigationCount = await page
      .getByRole('navigation', { name: 'Legal and support' })
      .count();
    const footerLinks = footerCount === 1
      ? await footer.locator('a').evaluateAll((links) => links.map((link) => {
          const box = link.getBoundingClientRect();
          return {
            text: link.textContent?.trim() ?? '',
            href: link.getAttribute('href'),
            width: Math.round(box.width),
            height: Math.round(box.height),
          };
        }))
      : [];
    const missingRequiredLinks = ['Privacy', 'Terms', 'Accessibility', 'Report a problem']
      .filter((label) => !footerLinks.some((link) => link.text === label));
    const undersizedLinks = footerLinks.filter((link) => link.width < 24 || link.height < 24);

    const accessibilityLink = footer.getByRole('link', { name: 'Accessibility', exact: true });
    let focusIndicator = null;
    if (await accessibilityLink.count()) {
      await accessibilityLink.focus();
      focusIndicator = await accessibilityLink.evaluate((link) => {
        const style = getComputedStyle(link);
        return {
          outlineStyle: style.outlineStyle,
          outlineWidth: style.outlineWidth,
          boxShadow: style.boxShadow,
        };
      });
    }

    await page.setViewportSize({ width: 320, height: 900 });
    const mobileAxe = await new AxeBuilder({ page }).withTags(wcagTags).analyze();
    const ctaContrastChecks = await page
      .getByRole('button', { name: /^(Grade your first assignment|Create your teacher workspace)$/ })
      .evaluateAll((buttons) => {
        const channel = (value) => {
          const normalized = value / 255;
          return normalized <= 0.04045
            ? normalized / 12.92
            : ((normalized + 0.055) / 1.055) ** 2.4;
        };
        const luminance = (rgb) =>
          0.2126 * channel(rgb[0]) + 0.7152 * channel(rgb[1]) + 0.0722 * channel(rgb[2]);
        const parseRgb = (value) => (value.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number);

        return buttons.map((button) => {
          const style = getComputedStyle(button);
          const foreground = parseRgb(style.color);
          const background = parseRgb(style.backgroundColor);
          const foregroundLuminance = luminance(foreground);
          const backgroundLuminance = luminance(background);
          const ratio =
            (Math.max(foregroundLuminance, backgroundLuminance) + 0.05) /
            (Math.min(foregroundLuminance, backgroundLuminance) + 0.05);
          return {
            text: button.textContent?.trim() ?? '',
            foreground: style.color,
            background: style.backgroundColor,
            ratio: Number(ratio.toFixed(2)),
            passesAa: ratio >= 4.5,
          };
        });
      });
    const combinedIncomplete = [
      ...desktopAxe.incomplete.map((check) => ({ viewport: 'desktop', ...check })),
      ...mobileAxe.incomplete.map((check) => ({ viewport: 'mobile-320', ...check })),
    ];
    const unexpectedIncomplete = combinedIncomplete.filter((check) => {
      const isKnownCtaContrastReview =
        check.viewport === 'mobile-320' &&
        check.id === 'color-contrast' &&
        check.nodes.every((node) =>
          node.target.some((target) => target.includes('hover\\:bg-primary\\/90.h-11.px-8')),
        ) &&
        ctaContrastChecks.length === 2 &&
        ctaContrastChecks.every((contrast) => contrast.passesAa);
      return !isKnownCtaContrastReview;
    });
    const horizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    );
    await page.emulateMedia({ forcedColors: 'active' });
    const reducedMotionViolation = await page.locator('body *').evaluateAll((elements) =>
      elements.some((element) => {
        const style = getComputedStyle(element);
        const durations = `${style.animationDuration},${style.transitionDuration}`
          .split(',')
          .map((value) => Number.parseFloat(value) || 0);
        return durations.some((duration) => duration > 0.001);
      }),
    );

    results.push({
      route,
      finalUrl: page.url(),
      title: await page.title(),
      violations: [
        ...desktopAxe.violations.map((violation) => ({ viewport: 'desktop', ...violation })),
        ...mobileAxe.violations.map((violation) => ({ viewport: 'mobile-320', ...violation })),
      ].map(({ viewport, id, impact, help, helpUrl, nodes }) => ({
        viewport,
        id,
        impact,
        help,
        helpUrl,
        nodes: nodes.map(({ target, failureSummary, html }) => ({ target, failureSummary, html })),
      })),
      incomplete: combinedIncomplete.map(({ viewport, id, impact, help, helpUrl, nodes }) => ({
        viewport,
        id,
        impact,
        help,
        helpUrl,
        nodes: nodes.map(({ target, failureSummary, html }) => ({ target, failureSummary, html })),
      })),
      checks: {
        footerCount,
        legalNavigationCount,
        footerLinks,
        missingRequiredLinks,
        undersizedLinks,
        focusIndicator,
        horizontalOverflowAt320: horizontalOverflow,
        reducedMotionViolation,
        ctaContrastChecks,
        unexpectedIncomplete: unexpectedIncomplete.map(({ viewport, id }) => ({ viewport, id })),
      },
    });

    await page.close();
  }

  await context.close();

  const failures = results.flatMap((result) => {
    const routeFailures = [];
    if (result.violations.length) routeFailures.push(`${result.violations.length} axe violation(s)`);
    if (result.checks.footerCount !== 1) routeFailures.push(`${result.checks.footerCount} contentinfo landmarks`);
    if (result.checks.legalNavigationCount !== 1) routeFailures.push(`${result.checks.legalNavigationCount} legal/support navigations`);
    if (result.checks.missingRequiredLinks.length) routeFailures.push(`missing footer links: ${result.checks.missingRequiredLinks.join(', ')}`);
    if (result.checks.undersizedLinks.length) routeFailures.push(`${result.checks.undersizedLinks.length} undersized footer link(s)`);
    if (result.checks.horizontalOverflowAt320) routeFailures.push('horizontal overflow at 320px');
    if (result.checks.reducedMotionViolation) routeFailures.push('motion remains with reduced motion requested');
    if (result.checks.unexpectedIncomplete.length) routeFailures.push(`${result.checks.unexpectedIncomplete.length} unresolved axe incomplete check(s)`);
    if (!result.checks.focusIndicator || result.checks.focusIndicator.outlineStyle === 'none') routeFailures.push('no visible focus outline on Accessibility link');
    return routeFailures.map((failure) => ({ route: result.route, failure }));
  });

  const report = {
    generatedAt: new Date().toISOString(),
    baseUrl,
    standard: 'WCAG 2.2 Level AA target',
    automatedEngine: '@axe-core/playwright',
    routes: results,
    failures,
    note: 'Automated checks do not establish WCAG conformance; manual assistive-technology and task testing remain required.',
  };
  await fs.writeFile(
    path.join(outDir, 'a11y-report.json'),
    `${JSON.stringify(report, null, 2)}\n`,
  );

  console.log(JSON.stringify({
    routeCount: results.length,
    axeViolationCount: results.reduce((sum, result) => sum + result.violations.length, 0),
    incompleteCheckCount: results.reduce((sum, result) => sum + result.incomplete.length, 0),
    failures,
    report: 'qa-artifacts/a11y-report.json',
  }, null, 2));

  if (failures.length) process.exitCode = 1;
} finally {
  if (browser) await browser.close();
  if (server.exitCode === null) server.kill('SIGTERM');
}
