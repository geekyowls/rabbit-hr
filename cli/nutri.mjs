#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { createInterface } from 'node:readline';
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import * as p from '@clack/prompts';
import c from 'picocolors';

const require = createRequire(import.meta.url);
const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const STATE_FILE = path.join(os.homedir(), '.nutri-state.json');

const PROD_VM = { name: 'nutricrm-prod', zone: 'asia-south2-b', project: 'rabbithr' };
const PROD_CONTAINERS = {
  api: 'nutricrmprod-api',
  website: 'nutricrmprod-website',
  postgres: 'nutricrmprod-nutricrm-btqdh5',
  redis: 'nutricrmprod-nutricrm-hyye1l',
  typesense: 'nutricrmprod-typesense',
};

const APP_PORTS = { frontend: 3000, website: 3001, backend: 4000 };

const STACK_COLORS = {
  backend: c.cyan,
  frontend: c.blue,
  website: c.magenta,
  dietitian: c.green,
  client: c.yellow,
};

function loadTenants() {
  const mod = require(path.join(REPO_ROOT, 'apps/client-app/tenants/index.js'));
  return Object.entries(mod.tenants).map(([key, t]) => ({
    key, name: t.name, iosBundleId: t.iosBundleId, androidPackage: t.androidPackage,
  }));
}

function readState() {
  try { return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')); } catch { return {}; }
}
function writeState(patch) {
  const next = { ...readState(), ...patch };
  try { fs.writeFileSync(STATE_FILE, JSON.stringify(next, null, 2)); } catch {}
}

async function portInUse(port) {
  return new Promise((resolve) => {
    const srv = net.createServer().once('error', () => resolve(true))
      .once('listening', () => srv.close(() => resolve(false))).listen(port, '127.0.0.1');
  });
}
async function whoHasPort(port) {
  return new Promise((resolve) => {
    const child = spawn('lsof', ['-i', `:${port}`, '-sTCP:LISTEN', '-n', '-P'], { stdio: ['ignore', 'pipe', 'ignore'] });
    let out = '';
    child.stdout.on('data', (b) => { out += b; });
    child.on('close', () => resolve(out.split('\n').filter(Boolean).slice(1).join('\n') || '(unknown)'));
    child.on('error', () => resolve('(lsof unavailable)'));
  });
}

function printCmd(label, cmd, cwd) {
  const cd = cwd && cwd !== REPO_ROOT ? `cd ${path.relative(REPO_ROOT, cwd)} && ` : '';
  console.log(c.dim('  $ ') + c.bold(cd + cmd));
}

async function confirmAndRun({ label, cmd, args = [], cwd = REPO_ROOT, env = {}, autoYes = false }) {
  const shown = [cmd, ...args].join(' ');
  console.log('');
  console.log(c.bold(label));
  printCmd(label, shown, cwd);
  const skip = autoYes || GLOBAL_YES || !process.stdout.isTTY;
  if (!skip) {
    const go = await p.confirm({ message: 'Run this?', initialValue: true });
    if (p.isCancel(go) || !go) { p.outro(c.yellow('cancelled')); return 130; }
  }
  console.log('');
  return runSingle({ cmd, args, cwd, env });
}

function runSingle({ cmd, args, cwd, env }) {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { cwd, env: { ...process.env, ...env }, stdio: 'inherit' });
    child.on('close', (code) => resolve(code ?? 0));
    child.on('error', (err) => { console.error(c.red('spawn failed: ' + err.message)); resolve(1); });
  });
}

async function runStack(processes) {
  for (const p of processes) {
    if (p.port && (await portInUse(p.port))) {
      const who = await whoHasPort(p.port);
      console.error(c.red(`port ${p.port} is in use (needed for ${p.label}):\n${who}`));
      return 1;
    }
  }
  console.log(c.bold(`\nStarting ${processes.length} service${processes.length > 1 ? 's' : ''}…`));
  for (const proc of processes) {
    console.log(`  ${STACK_COLORS[proc.color](proc.label.padEnd(10))} ${c.dim(proc.cmd + ' ' + proc.args.join(' '))}`);
  }
  console.log(c.dim('\nCtrl-C kills all. One crash does not stop the others.\n'));

  const children = [];
  let stopping = false;
  for (const proc of processes) {
    const child = spawn(proc.cmd, proc.args, {
      cwd: proc.cwd, env: { ...process.env, ...(proc.env || {}), FORCE_COLOR: '1' },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const colorFn = STACK_COLORS[proc.color] || c.white;
    const prefix = colorFn(proc.label.padEnd(10) + '│');
    const pipe = (stream) => createInterface({ input: stream }).on('line', (line) => {
      process.stdout.write(`${prefix} ${line}\n`);
    });
    pipe(child.stdout); pipe(child.stderr);
    child.on('close', (code) => {
      const tag = code === 0 || stopping ? c.dim(`[${proc.label} exited ${code}]`) : c.red(`[${proc.label} crashed with code ${code}]`);
      process.stdout.write(tag + '\n');
    });
    children.push(child);
  }
  const shutdown = (sig) => {
    if (stopping) return; stopping = true;
    console.log(c.dim(`\nReceived ${sig}, stopping ${children.length} children…`));
    for (const ch of children) { try { ch.kill('SIGTERM'); } catch {} }
    setTimeout(() => { for (const ch of children) { try { ch.kill('SIGKILL'); } catch {} } process.exit(0); }, 4000);
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  await new Promise(() => {});
  return 0;
}

// ──────────────────────────────────────────────────────────────────
// Process recipes (used by both menu + direct commands)
// ──────────────────────────────────────────────────────────────────

const procRecipes = {
  frontend: () => ({ label: 'frontend', color: 'frontend', cmd: 'pnpm', args: ['--filter', 'frontend', 'dev'], cwd: REPO_ROOT, port: APP_PORTS.frontend }),
  backend: () => ({ label: 'backend', color: 'backend', cmd: 'pnpm', args: ['--filter', 'backend', 'dev'], cwd: REPO_ROOT, port: APP_PORTS.backend }),
  website: () => ({ label: 'website', color: 'website', cmd: 'pnpm', args: ['--filter', 'website', 'dev'], cwd: REPO_ROOT, port: APP_PORTS.website }),
  dietitian: () => ({ label: 'dietitian', color: 'dietitian', cmd: 'pnpm', args: ['--filter', 'dietitian-app', 'dev'], cwd: REPO_ROOT }),
  client: (tenantKey) => ({
    label: `client:${tenantKey}`, color: 'client',
    cmd: 'pnpm', args: ['--filter', 'client-app', 'dev'],
    cwd: REPO_ROOT, env: { TENANT: tenantKey },
  }),
};

// ──────────────────────────────────────────────────────────────────
// Actions (the dispatch target for both modes)
// ──────────────────────────────────────────────────────────────────

async function pickTenant(label = 'Which tenant?') {
  const tenants = loadTenants();
  const last = readState().lastTenant;
  const choice = await p.select({
    message: label,
    initialValue: tenants.find((t) => t.key === last)?.key,
    options: tenants.map((t) => ({ value: t.key, label: t.name, hint: t.iosBundleId })),
  });
  if (p.isCancel(choice)) return null;
  writeState({ lastTenant: choice });
  return choice;
}

const fastlane = (appDir, lane, extraArgs = []) => ({
  cmd: './scripts/fastlane.sh', args: [lane[0], lane[1], ...extraArgs], cwd: path.join(REPO_ROOT, appDir),
});

async function actMobile(app, platform, action, tenantKey) {
  const appDir = app === 'dietitian' ? 'apps/dietitian-app' : 'apps/client-app';
  const tenantArg = app === 'client' ? [`tenant:${tenantKey}`] : [];
  const labelPrefix = app === 'client' ? `client-app (${tenantKey})` : 'dietitian-app';
  const lanes = {
    build: { ios: ['ios', 'build'], android: ['android', 'build'] },
    beta: { ios: ['ios', 'beta'], android: ['android', 'beta'] },
    metadata: { ios: ['ios', 'update_store_metadata'] },
    submit: { ios: ['ios', 'submit_review'] },
    'content-rights': { ios: ['ios', 'set_content_rights'] },
  };
  const lane = lanes[action]?.[platform];
  if (!lane) { console.error(c.red(`no ${action} ${platform} for ${app}`)); return 1; }
  const f = fastlane(appDir, lane, tenantArg);
  return confirmAndRun({ label: `${labelPrefix} — ${platform} ${action}`, ...f });
}

async function actEas(app, platform, action, tenantKey) {
  const filter = app === 'dietitian' ? 'dietitian-app' : 'client-app';
  const script = app === 'dietitian' ? `${action}:${platform}` : `${action}:${tenantKey}:${platform}`;
  const labelPrefix = app === 'client' ? `client-app (${tenantKey})` : 'dietitian-app';
  const verb = action === 'submit' ? 'EAS submit to store' : 'EAS cloud build';
  return confirmAndRun({
    label: `${labelPrefix} — ${platform} ${verb}`,
    cmd: 'pnpm', args: ['--filter', filter, script], cwd: REPO_ROOT,
  });
}

async function actTypecheck(target) {
  const apps = target === 'all'
    ? ['frontend', 'backend', 'dietitian-app', 'client-app']
    : [target];
  for (const a of apps) {
    const code = await confirmAndRun({
      label: `typecheck ${a}`,
      cmd: 'pnpm', args: ['--filter', a, 'exec', 'tsc', '--noEmit'],
      autoYes: target === 'all',
    });
    if (code !== 0 && target === 'all') {
      console.log(c.red(`${a} failed — stopping`)); return code;
    }
  }
  return 0;
}

async function actDb(op) {
  const ops = {
    shell: { label: 'psql local', cmd: 'psql', args: ['-h', 'localhost', '-p', '5433', 'nutricrm_prod'] },
    migrate: { label: 'run migrations', cmd: 'pnpm', args: ['--filter', 'backend', 'migration:run'] },
    'migrate:revert': { label: 'revert last migration', cmd: 'pnpm', args: ['--filter', 'backend', 'migration:revert'] },
    'migrate:show': { label: 'show migration status', cmd: 'pnpm', args: ['--filter', 'backend', 'migration:show'] },
    seed: { label: 'seed test data', cmd: 'pnpm', args: ['--filter', 'backend', 'seed'] },
    dump: {
      label: 'dump local DB',
      cmd: 'bash', args: ['-c', `pg_dump -h localhost -p 5433 nutricrm_prod | gzip > ${path.join(REPO_ROOT, 'local-' + new Date().toISOString().replace(/[:.]/g, '-') + '.sql.gz')}`],
    },
  };
  const recipe = ops[op];
  if (!recipe) { console.error(c.red(`unknown db op: ${op}`)); return 1; }
  return confirmAndRun(recipe);
}

async function actPackages(op) {
  const ops = {
    install: { label: 'pnpm install', cmd: 'pnpm', args: ['install'] },
    build: { label: 'build shared packages', cmd: 'pnpm', args: ['build:packages'] },
  };
  const recipe = ops[op];
  if (!recipe) { console.error(c.red(`unknown packages op: ${op}`)); return 1; }
  return confirmAndRun(recipe);
}

async function actProd(op, arg) {
  const gcloudBase = ['compute', 'ssh', PROD_VM.name, '--tunnel-through-iap', `--zone=${PROD_VM.zone}`, `--project=${PROD_VM.project}`];
  if (op === 'ssh') {
    return confirmAndRun({ label: `ssh ${PROD_VM.name}`, cmd: 'gcloud', args: gcloudBase });
  }
  if (op === 'ps') {
    return confirmAndRun({
      label: 'list nutricrmprod containers',
      cmd: 'gcloud', args: [...gcloudBase, `--command=sudo docker ps --filter name=nutricrmprod- --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'`],
    });
  }
  if (op === 'health') {
    return confirmAndRun({ label: 'check api health', cmd: 'curl', args: ['-sS', 'https://api.nutricrm.co/api/v1/health'] });
  }
  if (op === 'logs') {
    const prefix = PROD_CONTAINERS[arg];
    if (!prefix) { console.error(c.red(`unknown container: ${arg}. options: ${Object.keys(PROD_CONTAINERS).join(', ')}`)); return 1; }
    return confirmAndRun({
      label: `tail logs ${arg}`,
      cmd: 'gcloud',
      args: [...gcloudBase, `--command=sudo docker logs -f --tail=100 $(sudo docker ps --filter name=${prefix} --format '{{.Names}}' | head -1)`],
    });
  }
  console.error(c.red(`unknown prod op: ${op}`)); return 1;
}

async function actDev(target, tenantKey) {
  if (procRecipes[target]) {
    const proc = procRecipes[target](tenantKey);
    return runStack([proc]);
  }
  const stacks = {
    web: ['backend', 'frontend', 'website'],
    'web+dietitian': ['backend', 'frontend', 'website', 'dietitian'],
    'web+client': ['backend', 'frontend', 'website', 'client'],
    full: ['backend', 'frontend', 'website', 'client'],
  };
  const names = stacks[target];
  if (!names) { console.error(c.red(`unknown dev target: ${target}`)); return 1; }
  if (names.includes('client') && !tenantKey) {
    console.error(c.red(`stack ${target} needs a tenant. usage: ./nutri dev ${target} <tenant>`)); return 1;
  }
  const procs = names.map((n) => procRecipes[n](tenantKey));
  return runStack(procs);
}

// ──────────────────────────────────────────────────────────────────
// Interactive menu
// ──────────────────────────────────────────────────────────────────

async function menu() {
  console.log('');
  p.intro(c.bgCyan(c.black(' NutriCRM ')));

  const top = await p.select({
    message: 'What do you want to do?',
    initialValue: readState().lastTop,
    options: [
      { value: 'dev', label: 'Dev server' },
      { value: 'mobile', label: 'Mobile build / release' },
      { value: 'typecheck', label: 'Typecheck' },
      { value: 'db', label: 'Local DB' },
      { value: 'packages', label: 'Packages' },
      { value: 'prod', label: 'Production (read-only)' },
      { value: 'quit', label: 'Quit' },
    ],
  });
  if (p.isCancel(top) || top === 'quit') { p.outro(c.dim('bye')); return 0; }
  writeState({ lastTop: top });

  if (top === 'dev') return menuDev();
  if (top === 'mobile') return menuMobile();
  if (top === 'typecheck') return menuTypecheck();
  if (top === 'db') return menuDb();
  if (top === 'packages') return menuPackages();
  if (top === 'prod') return menuProd();
}

async function menuDev() {
  const mode = await p.select({
    message: 'Single app, or run a stack?',
    options: [
      { value: 'stack:web', label: 'Stack — web (frontend + backend + website)' },
      { value: 'stack:web+dietitian', label: 'Stack — web + dietitian-app' },
      { value: 'stack:web+client', label: 'Stack — web + client-app' },
      { value: 'stack:full', label: 'Stack — full (web + client-app)' },
      { value: 'single', label: 'Single app' },
    ],
  });
  if (p.isCancel(mode)) return 0;

  if (mode === 'single') {
    const app = await p.select({
      message: 'Which app?',
      options: [
        { value: 'frontend', label: 'frontend (Next.js admin, :3000)' },
        { value: 'backend', label: 'backend (NestJS, :4000)' },
        { value: 'website', label: 'website (Next.js public, :3001)' },
        { value: 'dietitian', label: 'dietitian-app (Expo)' },
        { value: 'client', label: 'client-app (Expo, multi-tenant)' },
      ],
    });
    if (p.isCancel(app)) return 0;
    let tenant;
    if (app === 'client') { tenant = await pickTenant(); if (!tenant) return 0; }
    return actDev(app, tenant);
  }

  const target = mode.replace('stack:', '');
  let tenant;
  if (target.includes('client') || target === 'full') {
    tenant = await pickTenant(); if (!tenant) return 0;
  }
  return actDev(target, tenant);
}

async function menuMobile() {
  const app = await p.select({
    message: 'Which app?',
    options: [
      { value: 'dietitian', label: 'dietitian-app' },
      { value: 'client', label: 'client-app (multi-tenant)' },
    ],
  });
  if (p.isCancel(app)) return 0;

  let tenant;
  if (app === 'client') { tenant = await pickTenant(); if (!tenant) return 0; }

  const action = await p.select({
    message: 'Which action?',
    initialValue: readState().lastMobileAction,
    options: [
      { value: 'beta:ios', label: 'iOS — build + upload to TestFlight' },
      { value: 'build:ios', label: 'iOS — build .ipa only' },
      { value: 'metadata:ios', label: 'iOS — push App Store metadata' },
      { value: 'submit:ios', label: 'iOS — submit for review' },
      { value: 'content-rights:ios', label: 'iOS — set Content Rights (no 3rd party)' },
      { value: 'beta:android', label: 'Android — build + upload to Play internal' },
      { value: 'build:android', label: 'Android — build .aab only' },
      { value: 'eas-build:ios', label: 'iOS — EAS cloud build (Expo-managed signing)' },
      { value: 'eas-build:android', label: 'Android — EAS cloud build (Expo-managed signing)' },
      { value: 'eas-submit:ios', label: 'iOS — EAS submit latest build to App Store' },
      { value: 'eas-submit:android', label: 'Android — EAS submit latest build to Play' },
    ],
  });
  if (p.isCancel(action)) return 0;
  writeState({ lastMobileAction: action });
  if (action.startsWith('eas-')) {
    const [op, platform] = action.slice(4).split(':');
    return actEas(app, platform, op, tenant);
  }
  const [op, platform] = action.split(':');
  return actMobile(app, platform, op, tenant);
}

async function menuTypecheck() {
  const target = await p.select({
    message: 'Which?',
    options: [
      { value: 'all', label: 'all (frontend + backend + dietitian-app + client-app)' },
      { value: 'frontend', label: 'frontend' },
      { value: 'backend', label: 'backend' },
      { value: 'dietitian-app', label: 'dietitian-app' },
      { value: 'client-app', label: 'client-app' },
    ],
  });
  if (p.isCancel(target)) return 0;
  return actTypecheck(target);
}

async function menuDb() {
  const op = await p.select({
    message: 'Local DB action',
    options: [
      { value: 'shell', label: 'psql shell' },
      { value: 'migrate', label: 'run pending migrations' },
      { value: 'migrate:show', label: 'show migration status' },
      { value: 'migrate:revert', label: 'revert last migration' },
      { value: 'seed', label: 'seed test data' },
      { value: 'dump', label: 'dump local DB to .sql.gz' },
    ],
  });
  if (p.isCancel(op)) return 0;
  return actDb(op);
}

async function menuPackages() {
  const op = await p.select({
    message: 'Packages action',
    options: [
      { value: 'install', label: 'pnpm install (all workspaces)' },
      { value: 'build', label: 'build shared packages' },
    ],
  });
  if (p.isCancel(op)) return 0;
  return actPackages(op);
}

async function menuProd() {
  const op = await p.select({
    message: 'Production action (read-only)',
    options: [
      { value: 'ssh', label: 'SSH into nutricrm-prod VM' },
      { value: 'ps', label: 'list nutricrmprod-* containers' },
      { value: 'logs', label: 'tail container logs' },
      { value: 'health', label: 'curl /api/v1/health' },
    ],
  });
  if (p.isCancel(op)) return 0;
  if (op !== 'logs') return actProd(op);
  const container = await p.select({
    message: 'Which container?',
    options: Object.keys(PROD_CONTAINERS).map((k) => ({ value: k, label: k })),
  });
  if (p.isCancel(container)) return 0;
  return actProd('logs', container);
}

// ──────────────────────────────────────────────────────────────────
// Direct command parsing
// ──────────────────────────────────────────────────────────────────

function resolveAppOrTenant(arg) {
  if (arg === 'dietitian') return { app: 'dietitian' };
  const tenants = loadTenants();
  const t = tenants.find((x) => x.key === arg);
  if (t) return { app: 'client', tenantKey: t.key };
  return null;
}

async function direct(args) {
  const [cmd, ...rest] = args;
  if (cmd === 'dev') {
    const target = rest[0];
    if (!target) { console.error(c.red('usage: ./nutri dev <single|stack> [tenant]')); return 1; }
    if (procRecipes[target]) return actDev(target, rest[1]);
    return actDev(target, rest[1]);
  }
  if (cmd === 'eas') {
    const [action, target, platform] = rest;
    if (!['build', 'submit'].includes(action) || !target || !['ios', 'android'].includes(platform)) {
      console.error(c.red('usage: ./nutri eas <build|submit> <dietitian|tenant-key> <ios|android>')); return 1;
    }
    const resolved = resolveAppOrTenant(target);
    if (!resolved) { console.error(c.red(`unknown app/tenant: ${target}. try './nutri tenants'`)); return 1; }
    return actEas(resolved.app, platform, action, resolved.tenantKey);
  }
  if (cmd === 'typecheck') return actTypecheck(rest[0] || 'all');
  if (cmd === 'db') return actDb(rest[0]);
  if (cmd === 'packages') return actPackages(rest[0]);
  if (cmd === 'prod') return actProd(rest[0], rest[1]);
  if (cmd === 'tenants') {
    const tenants = loadTenants();
    console.log(c.bold('Tenants:'));
    for (const t of tenants) console.log(`  ${t.key.padEnd(12)} ${c.dim(t.iosBundleId)}  ${t.name}`);
    return 0;
  }
  const mobileMatch = cmd.match(/^(build|beta|metadata|submit|content-rights):(ios|android)$/);
  if (mobileMatch) {
    const [, action, platform] = mobileMatch;
    const target = rest[0];
    if (!target) { console.error(c.red(`usage: ./nutri ${cmd} <dietitian|<tenant-key>>`)); return 1; }
    const resolved = resolveAppOrTenant(target);
    if (!resolved) { console.error(c.red(`unknown app/tenant: ${target}. try './nutri tenants'`)); return 1; }
    return actMobile(resolved.app, platform, action, resolved.tenantKey);
  }
  printHelp();
  return cmd ? 1 : 0;
}

function printHelp() {
  console.log(`
${c.bold('nutri')} — NutriCRM monorepo CLI

${c.bold('Interactive:')}
  ./nutri                            menu-driven, asks what to do

${c.bold('Dev:')}
  ./nutri dev <app>                  single: frontend | backend | website | dietitian | client <tenant>
  ./nutri dev web                    stack: backend + frontend + website
  ./nutri dev web+dietitian
  ./nutri dev web+client <tenant>
  ./nutri dev full <tenant>

${c.bold('Mobile build / release (local fastlane — needs local keystore/certs):')}
  ./nutri build:ios <dietitian|tenant-key>
  ./nutri beta:ios <dietitian|tenant-key>           build + upload TestFlight
  ./nutri metadata:ios <dietitian|tenant-key>       push App Store metadata
  ./nutri submit:ios <dietitian|tenant-key>         submit for review
  ./nutri content-rights:ios <dietitian|tenant-key>
  ./nutri build:android <dietitian|tenant-key>
  ./nutri beta:android <dietitian|tenant-key>       build + upload Play internal

${c.bold('Mobile build / release (EAS cloud — Expo-managed signing):')}
  ./nutri eas build <dietitian|tenant-key> <ios|android>    cloud build (.ipa/.aab)
  ./nutri eas submit <dietitian|tenant-key> <ios|android>   submit latest EAS build to store

${c.bold('Other:')}
  ./nutri typecheck [all|frontend|backend|dietitian-app|client-app]
  ./nutri db <shell|migrate|migrate:show|migrate:revert|seed|dump>
  ./nutri packages <install|build>
  ./nutri prod <ssh|ps|health|logs <container>>
  ./nutri tenants                    list tenant keys

${c.dim('State (last tenant + last action) is cached in ~/.nutri-state.json')}
`);
}

// ──────────────────────────────────────────────────────────────────
// Entry
// ──────────────────────────────────────────────────────────────────

let GLOBAL_YES = false;
const rawArgs = process.argv.slice(2);
const args = rawArgs.filter((a) => {
  if (a === '--yes' || a === '-y') { GLOBAL_YES = true; return false; }
  return true;
});

if (args[0] === '--help' || args[0] === '-h' || args[0] === 'help') {
  printHelp();
  process.exit(0);
}

const exitCode = args.length === 0 ? await menu() : await direct(args);
process.exit(exitCode ?? 0);
