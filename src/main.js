// Entry point of the K-Arena Yokohama digital twin.
//
// One three.js scene: the arena model modules (src/arena, src/site) on a local diorama
// disc. See src/app/urlstate.js for the deep links and src/app/app.js for the modes.
//
// For tools/shot.mjs and manual testing:
//   window.__ready   true after the first complete frames
//   window.__info    { modules, triangles, drawCalls, failed, missing, … }
//   window.__failed  true on a fatal error
//   window.__app     the App instance (store, goView(id), sit(seat), setMode(mode), set({…}))
import { App } from './app/app.js';

const loading = document.getElementById('loading');

function fatal(err) {
  window.__failed = true;
  console.error(err);
  if (!loading || !loading.isConnected) return;
  loading.classList.remove('done');
  loading.classList.add('failed');
  const step = loading.querySelector('#loading-step');
  const warn = loading.querySelector('#loading-warn');
  if (step) step.textContent = '모델을 표시할 수 없습니다.';
  if (warn) warn.textContent = String(err && err.message ? err.message : err);
}

function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return !!c.getContext('webgl2');
  } catch {
    return false;
  }
}

async function main() {
  if (!webglAvailable()) throw new Error('이 브라우저 / 기기에서는 WebGL 2를 사용할 수 없습니다.');
  const app = new App({
    canvas: document.getElementById('view'),
    uiRoot: document.getElementById('ui'),
    labelRoot: document.getElementById('labels'),
    loading,
  });
  window.__app = app;
  await app.start();
}

main().catch(fatal);
