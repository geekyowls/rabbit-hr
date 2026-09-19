import { execFileSync } from 'node:child_process';
import { readFileSync, rmSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'out');
const version = JSON.parse(
  readFileSync(join(root, 'package.json'), 'utf8'),
).version;

const url = process.env.SENTRY_URL || 'https://monitoring.rabbithr.co';
const { SENTRY_AUTH_TOKEN, SENTRY_ORG, SENTRY_PROJECT } = process.env;

function stripMaps(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) stripMaps(full);
    else if (entry.name.endsWith('.map')) rmSync(full);
  }
}

function cli(args) {
  execFileSync('sentry-cli', args, {
    cwd: root,
    stdio: 'inherit',
    env: { ...process.env, SENTRY_URL: url },
  });
}

if (SENTRY_AUTH_TOKEN && SENTRY_ORG && SENTRY_PROJECT) {
  try {
    cli(['sourcemaps', 'inject', outDir]);
    cli([
      'sourcemaps',
      'upload',
      '--release',
      version,
      '--url-prefix',
      '~/_next',
      outDir,
    ]);
    console.log(`Uploaded source maps to GlitchTip for release ${version}`);
  } catch (err) {
    console.warn(`Source map upload failed (continuing): ${err.message}`);
  }
} else {
  console.log('SENTRY_* env not set — skipping source map upload');
}

stripMaps(outDir);
console.log('Stripped .map files from out/');
