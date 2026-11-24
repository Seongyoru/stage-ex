#!/usr/bin/env node
// Generate the 3D props listed in tools/gen/props.json with the local ComfyUI toolkit:
//   Z-Image Turbo (object picture) → BiRefNet (cut-out) → TRELLIS.2 (textured GLB).
// Finished GLBs land in public/models/, work files and preview sheets in tools/gen/_work/props/.
// Steps whose output already exists are skipped, so the script is resumable.
//
//   node tools/gen/run-props.mjs                 # everything missing
//   node tools/gen/run-props.mjs bar_stool       # only these
//   node tools/gen/run-props.mjs --force planter # regenerate from scratch (new picture)
//   node tools/gen/run-props.mjs --seed 7 planter
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const CLI = process.env.COMFY_CLI || 'C:/Users/wsx48/.claude/tools/comfyui/cli.mjs';
const spec = JSON.parse(readFileSync(resolve(root, 'tools/gen/props.json'), 'utf8'));
const work = resolve(root, 'tools/gen/_work/props');
const outDir = resolve(root, 'public/models');
mkdirSync(work, { recursive: true });
mkdirSync(outDir, { recursive: true });

const argv = process.argv.slice(2);
const force = argv.includes('--force');
const seedIdx = argv.indexOf('--seed');
const seedOverride = seedIdx >= 0 ? Number(argv[seedIdx + 1]) : null;
const names = argv.filter((a, i) => !a.startsWith('--') && !(seedIdx >= 0 && i === seedIdx + 1));
const list = spec.props.filter((p) => names.length === 0 || names.includes(p.name));

function comfy(args) {
  const r = spawnSync(process.execPath, [CLI, ...args], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  const line = (r.stdout || '').trim().split('\n').filter(Boolean).pop() || '';
  let json = null;
  try {
    json = JSON.parse(line);
  } catch {}
  if (r.status !== 0 || !json || json.ok === false) {
    throw new Error(`comfy ${args[0]} failed: ${line.slice(0, 400)} ${(r.stderr || '').slice(-400)}`);
  }
  return json;
}

const log = [];
for (const p of list) {
  const raw = resolve(work, `${p.name}_raw.png`);
  const rgba = resolve(work, `${p.name}_rgba.png`);
  const preview = resolve(work, `${p.name}_preview.png`);
  const glb = resolve(outDir, `${p.name}.glb`);
  const seed = seedOverride ?? p.seed;
  const t0 = Date.now();
  try {
    if (force) for (const f of [raw, rgba, preview, glb]) rmSync(f, { force: true });
    if (!existsSync(raw)) comfy(['txt2img', '--prompt', `${p.prompt}, ${spec.style}`, '--width', '1024', '--height', '1024', '--seed', String(seed), '--out', raw]);
    if (!existsSync(rgba)) comfy(['rembg', '--image', raw, '--out', rgba]);
    let info = null;
    if (!existsSync(glb)) {
      info = comfy(['img2mesh', '--image', rgba, '--out', glb, '--faces', String(p.faces), '--texture-size', String(p.tex), '--jpeg-quality', '85', '--preview', preview]);
    }
    const entry = { name: p.name, ok: true, seconds: Math.round((Date.now() - t0) / 1000), glb: `public/models/${p.name}.glb`, warning: info?.warning || null };
    log.push(entry);
    console.log(JSON.stringify(entry));
  } catch (e) {
    const entry = { name: p.name, ok: false, error: e.message };
    log.push(entry);
    console.log(JSON.stringify(entry));
  }
}
writeFileSync(resolve(work, 'last-run.json'), JSON.stringify(log, null, 1));
console.log(`done: ${log.filter((l) => l.ok).length}/${log.length} ok`);
