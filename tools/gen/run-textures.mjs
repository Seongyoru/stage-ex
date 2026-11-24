#!/usr/bin/env node
// Generate the texture sets listed in tools/gen/textures.json with the local ComfyUI toolkit:
//   Z-Image Turbo (1024 px material picture) → seamless (CPU: tileable albedo + normal + roughness)
//   → WebP for the web (public/textures/<set>_{albedo,normal,roughness}.webp).
// Work files and 2x2 tiling previews go to tools/gen/_work/textures/. Resumable: finished
// sets are skipped.
//
//   node tools/gen/run-textures.mjs                    # everything missing
//   node tools/gen/run-textures.mjs grass asphalt      # only these
//   node tools/gen/run-textures.mjs --force grass      # regenerate
//   node tools/gen/run-textures.mjs --seed 9 grass     # another variation
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const CLI = process.env.COMFY_CLI || 'C:/Users/wsx48/.claude/tools/comfyui/cli.mjs';
const spec = JSON.parse(readFileSync(resolve(root, 'tools/gen/textures.json'), 'utf8'));
const work = resolve(root, 'tools/gen/_work/textures');
const outDir = resolve(root, 'public/textures');
mkdirSync(work, { recursive: true });
mkdirSync(outDir, { recursive: true });

const argv = process.argv.slice(2);
const force = argv.includes('--force');
const seedIdx = argv.indexOf('--seed');
const seedOverride = seedIdx >= 0 ? Number(argv[seedIdx + 1]) : null;
const names = argv.filter((a, i) => !a.startsWith('--') && !(seedIdx >= 0 && i === seedIdx + 1));
const list = spec.sets.filter((s) => names.length === 0 || names.includes(s.name));

function run(cmd, args) {
  const r = spawnSync(cmd, args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  return { status: r.status, out: (r.stdout || '').trim(), err: (r.stderr || '').trim() };
}
function comfy(args) {
  const r = run(process.execPath, [CLI, ...args]);
  const line = r.out.split('\n').filter(Boolean).pop() || '';
  let json = null;
  try {
    json = JSON.parse(line);
  } catch {}
  if (r.status !== 0 || !json || json.ok === false) throw new Error(`comfy ${args[0]} failed: ${line.slice(0, 400)} ${r.err.slice(-400)}`);
  return json;
}
const TO_WEBP = `
import sys
from PIL import Image
src, dst, size, quality = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4])
im = Image.open(src).convert('RGB')
if im.size[0] != size:
    im = im.resize((size, size), Image.LANCZOS)
im.save(dst, 'WEBP', quality=quality, method=6)
`;
function toWebp(src, dst, size, quality) {
  const r = run('python', ['-I', '-c', TO_WEBP, src, dst, String(size), String(quality)]);
  if (r.status !== 0) throw new Error(`webp conversion failed: ${r.err.slice(-300)}`);
}

const log = [];
for (const s of list) {
  const o = { ...spec.defaults, ...s };
  const raw = resolve(work, `${s.name}_raw.png`);
  const base = resolve(work, `${s.name}.png`);
  // seamless writes the albedo to the --out path itself and the other maps beside it
  const made = [base, resolve(work, `${s.name}_normal.png`), resolve(work, `${s.name}_roughness.png`)];
  const final = ['albedo', 'normal', 'roughness'].map((k) => resolve(outDir, `${s.name}_${k}.webp`));
  const seed = seedOverride ?? s.seed;
  const t0 = Date.now();
  try {
    if (force) for (const f of [raw, ...made, ...final]) rmSync(f, { force: true });
    if (final.every((f) => existsSync(f))) {
      log.push({ name: s.name, ok: true, skipped: true });
      continue;
    }
    if (!existsSync(raw)) comfy(['txt2img', '--prompt', `${s.prompt}, ${spec.style}`, '--width', '1024', '--height', '1024', '--seed', String(seed), '--out', raw]);
    comfy(['seamless', '--image', raw, '--out', base, '--flatten', String(o.flatten), '--flatten-radius', String(o.flattenRadius), '--crop', String(o.crop), '--roughness', String(o.roughness), '--normal-strength', String(o.normalStrength), '--size', '1024', '--preview']);
    toWebp(made[0], final[0], 1024, 86);
    toWebp(made[1], final[1], 1024, 88);
    toWebp(made[2], final[2], 512, 82);
    const entry = { name: s.name, ok: true, seconds: Math.round((Date.now() - t0) / 1000) };
    log.push(entry);
    console.log(JSON.stringify(entry));
  } catch (e) {
    const entry = { name: s.name, ok: false, error: e.message };
    log.push(entry);
    console.log(JSON.stringify(entry));
  }
}
writeFileSync(resolve(work, 'last-run.json'), JSON.stringify(log, null, 1));
console.log(`done: ${log.filter((l) => l.ok).length}/${log.length} ok`);
