#!/usr/bin/env node
// Screenshot a page of the running dev server with the locally installed Chrome
// (WebGL enabled) and report console errors. Used to LOOK at the 3D model.
//
//   node tools/shot.mjs --url "/dev/preview.html?m=bowl&cam=hall" --out shots/bowl.png
//   node tools/shot.mjs --url "/?view=overview" --out a.png --w 1600 --h 900 --wait 1500
//
// The page should set `window.__ready = true` once the scene has rendered at
// least one complete frame; the tool waits for it (up to --timeout ms), then
// waits --wait ms more and captures. Exit code 1 if the page threw an error.
import puppeteer from 'puppeteer-core';
import { existsSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, arr) => {
    if (a.startsWith('--')) {
      const next = arr[i + 1];
      acc.push([a.slice(2), next === undefined || next.startsWith('--') ? true : next]);
    }
    return acc;
  }, []),
);

if (!args.url || !args.out) {
  console.error('usage: node tools/shot.mjs --url <path-or-url> --out <file.png> [--w 1600] [--h 900] [--wait 800] [--timeout 60000] [--base http://localhost:5173] [--software] [--eval "js"]');
  process.exit(2);
}

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
].filter(Boolean);
const chrome = CHROME_CANDIDATES.find((p) => existsSync(p));
if (!chrome) {
  console.error('No Chrome/Edge executable found; set CHROME_PATH.');
  process.exit(2);
}

const base = args.base || 'http://localhost:5173';
// Git Bash (MSYS) rewrites an argument like "/dev/x.html" into
// "C:/Program Files/Git/dev/x.html". Undo that so both spellings work;
// passing the path without a leading slash ("dev/x.html") avoids it entirely.
let rawUrl = String(args.url).replace(/\\/g, '/');
const msys = rawUrl.match(/^[A-Za-z]:\/.*?\/Git\/(.*)$/);
if (msys) rawUrl = '/' + msys[1];
const url = /^https?:/.test(rawUrl) ? rawUrl : base + (rawUrl.startsWith('/') ? '' : '/') + rawUrl;
const width = Number(args.w || 1600);
const height = Number(args.h || 900);
const wait = Number(args.wait ?? 800);
const timeout = Number(args.timeout || 60000);
const out = resolve(String(args.out));
mkdirSync(dirname(out), { recursive: true });

async function attempt(software) {
  const profile = mkdtempSync(join(tmpdir(), 'karena-shot-'));
  const gpuArgs = software
    ? ['--use-angle=swiftshader', '--enable-unsafe-swiftshader']
    : ['--enable-gpu', '--ignore-gpu-blocklist', '--use-angle=d3d11'];
  const logs = [];
  let failed = false;
  let summary = null;
  let browser;
  try {
    browser = await puppeteer.launch({
      executablePath: chrome,
      headless: true,
      userDataDir: profile,
      args: ['--no-first-run', '--disable-extensions', '--hide-scrollbars', '--mute-audio', ...gpuArgs],
      defaultViewport: { width, height, deviceScaleFactor: 1 },
    });
    const page = await browser.newPage();
    page.on('console', (m) => {
      const t = m.type();
      if (t === 'error' || t === 'warn' || args.verbose) logs.push(`[console.${t}] ${m.text()}`);
    });
    page.on('pageerror', (e) => {
      failed = true;
      logs.push(`[pageerror] ${e && e.stack ? e.stack : e}`);
    });
    page.on('requestfailed', (r) => logs.push(`[requestfailed] ${r.url()} ${r.failure()?.errorText || ''}`));
    page.on('response', (r) => {
      if (r.status() >= 400) logs.push(`[http ${r.status()}] ${r.url()}`);
    });

    const resp = await page.goto(url, { waitUntil: 'load', timeout });
    let ready = true;
    if (resp && resp.status() >= 400) {
      ready = false;
      failed = true;
      logs.push(`[shot] page returned HTTP ${resp.status()} — is the dev server running and the path right?`);
    } else {
      try {
        // Stop waiting early when the page has already thrown: it will never become ready.
        await page.waitForFunction('window.__ready === true || window.__failed === true', { timeout, polling: 200 });
        ready = await page.evaluate('window.__ready === true');
        if (!ready) {
          failed = true;
          logs.push('[shot] page reported window.__failed');
        }
      } catch {
        ready = false;
        failed = true;
        logs.push(`[shot] window.__ready was not set within ${timeout} ms`);
      }
    }
    if (args.eval) {
      try {
        const r = await page.evaluate(String(args.eval));
        if (r !== undefined) logs.push(`[eval] ${JSON.stringify(r)}`);
      } catch (e) {
        failed = true;
        logs.push(`[eval error] ${e.message}`);
      }
    }
    await new Promise((r) => setTimeout(r, wait));
    await page.screenshot({ path: out, type: out.endsWith('.jpg') ? 'jpeg' : 'png' });
    const info = await page.evaluate('window.__info ? JSON.stringify(window.__info) : null').catch(() => null);
    summary = { ok: !failed, ready, out, url, width, height, renderer: software ? 'software' : 'gpu', info: info ? JSON.parse(info) : null };
  } catch (e) {
    failed = true;
    logs.push(`[shot] ${e.message}`);
    summary = { ok: false, out, url, error: e.message };
  } finally {
    if (browser) await browser.close().catch(() => {});
    try {
      rmSync(profile, { recursive: true, force: true });
    } catch {}
  }
  return { failed, logs, summary };
}

// The GPU may be busy with other work (image / 3D generation). If WebGL could not be
// created on it, retry once with Chrome's software renderer (slower, same picture).
let result = await attempt(Boolean(args.software));
const glTrouble = (r) => r.failed && r.logs.some((l) => /webgl|context lost|could not create a webgl|gpu process/i.test(l));
if (!args.software && glTrouble(result)) {
  console.error('[shot] WebGL failed on the GPU; retrying with the software renderer');
  result = await attempt(true);
}
console.log(JSON.stringify(result.summary));
for (const l of result.logs.slice(0, 60)) console.error(l);
if (result.logs.length > 60) console.error(`... ${result.logs.length - 60} more log lines`);
process.exit(result.failed ? 1 : 0);
