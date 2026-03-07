/**
 * smokeTest.js — End-to-end production smoke test
 * Validates that all three live services are healthy and cross-talking correctly.
 *
 * Usage:
 *   BACKEND_URL=https://civic-sense-backend.onrender.com \
 *   AI_URL=https://civic-sense-ai.onrender.com \
 *   FRONTEND_URL=https://civic-sense.vercel.app \
 *   node server/scripts/smokeTest.js
 *
 * All URLs default to localhost for local testing.
 */

import 'dotenv/config';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';
const AI_URL      = process.env.AI_URL      || 'http://localhost:8000';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

let passed = 0;
let failed = 0;

// ─── Utilities ────────────────────────────────────────────────────────────────

async function check(label, fn) {
  process.stdout.write(`  [ ] ${label}… `);
  try {
    const result = await fn();
    process.stdout.write(`\r  [✓] ${label}${result ? ` — ${result}` : ''}\n`);
    passed++;
  } catch (err) {
    process.stdout.write(`\r  [✗] ${label} — ${err.message}\n`);
    failed++;
  }
}

async function get(url, opts = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60_000);
  try {
    const res = await fetch(url, { signal: controller.signal, ...opts });
    clearTimeout(timeout);
    return res;
  } catch (e) {
    clearTimeout(timeout);
    throw e;
  }
}

// ─── Test suites ──────────────────────────────────────────────────────────────

async function testBackend() {
  console.log(`\n🔵  Backend  (${BACKEND_URL})`);

  await check('GET /api/health → 200', async () => {
    const res = await get(`${BACKEND_URL}/api/health`);
    if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
    const body = await res.json();
    if (body.status !== 'ok') throw new Error(`status="${body.status}"`);
    return `status=${body.status}`;
  });

  await check('GET /api → welcome JSON', async () => {
    const res = await get(`${BACKEND_URL}/api`);
    if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
    const body = await res.json();
    if (!body.version) throw new Error('missing version field');
    return `v${body.version}`;
  });

  await check('GET /api/issues → 200 (public list)', async () => {
    const res = await get(`${BACKEND_URL}/api/issues`);
    if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
    const body = await res.json();
    const count = Array.isArray(body.issues) ? body.issues.length : (body.length ?? '?');
    return `${count} issue(s)`;
  });

  await check('GET /api/auth/me → 401 without token (expected)', async () => {
    const res = await get(`${BACKEND_URL}/api/auth/me`);
    if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
    return 'correctly rejected';
  });

  await check('GET /api/admin/stats → 401 without token (expected)', async () => {
    const res = await get(`${BACKEND_URL}/api/admin/stats`);
    if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
    return 'correctly rejected';
  });

  await check('CORS header present for Vercel origin', async () => {
    const res = await get(`${BACKEND_URL}/api/health`, {
      headers: { Origin: FRONTEND_URL },
    });
    const acao = res.headers.get('access-control-allow-origin');
    if (!acao) throw new Error('access-control-allow-origin header missing');
    return `ACAO=${acao}`;
  });
}

async function testAIService() {
  console.log(`\n🟢  AI Service  (${AI_URL})`);

  await check('GET /health → 200', async () => {
    const res = await get(`${AI_URL}/health`);
    if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
    const body = await res.json();
    if (body.status !== 'ok') throw new Error(`status="${body.status}"`);
    const mode = body.model_loaded ? 'DNN+Groq' : 'Groq-only';
    return `status=${body.status}, mode=${mode}`;
  });

  await check('GET /classes → valid class list', async () => {
    const res = await get(`${AI_URL}/classes`);
    if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
    const body = await res.json();
    if (!Array.isArray(body.classes) || body.classes.length === 0) {
      throw new Error('empty or missing classes array');
    }
    return `${body.classes.length} classes`;
  });

  await check('POST /predict → rejects missing file (422)', async () => {
    const res = await get(`${AI_URL}/predict`, { method: 'POST' });
    if (![400, 422].includes(res.status)) {
      throw new Error(`Expected 422, got ${res.status}`);
    }
    return 'correctly rejected';
  });
}

async function testFrontend() {
  console.log(`\n🟣  Frontend  (${FRONTEND_URL})`);

  await check('GET / → 200 HTML', async () => {
    const res = await get(FRONTEND_URL);
    if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('text/html')) throw new Error(`Unexpected content-type: ${ct}`);
    return 'HTML served';
  });

  await check('GET /manifest.webmanifest → JSON with name', async () => {
    const res = await get(`${FRONTEND_URL}/manifest.webmanifest`);
    if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
    const body = await res.json();
    if (!body.name) throw new Error('manifest missing "name" field');
    return `name="${body.name}"`;
  });

  await check('GET /sw.js → 200 (service worker)', async () => {
    const res = await get(`${FRONTEND_URL}/sw.js`);
    if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
    return 'service worker served';
  });

  await check('SPA routing: GET /dashboard → 200 HTML (no 404)', async () => {
    const res = await get(`${FRONTEND_URL}/dashboard`);
    if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
    return 'SPA catch-all works';
  });
}

// ─── Run ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  Civic Sense Portal — Production Smoke Test');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`  Backend:   ${BACKEND_URL}`);
  console.log(`  AI:        ${AI_URL}`);
  console.log(`  Frontend:  ${FRONTEND_URL}`);

  await testBackend();
  await testAIService();
  await testFrontend();

  console.log('\n───────────────────────────────────────────────────────────────');
  console.log(`  Results: ${passed} passed, ${failed} failed`);
  console.log('───────────────────────────────────────────────────────────────\n');

  if (failed > 0) {
    console.log('❌  Smoke test FAILED — fix the issues above before submitting.\n');
    process.exit(1);
  } else {
    console.log('✅  All checks passed — production deployment looks healthy!\n');
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('\n💥  Unexpected error:', err.message);
  process.exit(1);
});
