#!/usr/bin/env node

import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const validateScriptPath = path.join(__dirname, 'validate-variant-env.mjs');
const easJsonPath = path.join(rootDir, 'eas.json');

function fail(message) {
  console.error(`[safe-eas-build] ${message}`);
  process.exit(1);
}

function parseArgs(argv) {
  const args = {};

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith('--')) {
      continue;
    }

    const key = token.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith('--')) {
      args[key] = true;
      continue;
    }

    args[key] = next;
    index += 1;
  }

  return args;
}

function loadValidatedRecord(variant) {
  const output = execFileSync(
    'node',
    [validateScriptPath, '--variant', variant],
    {
      cwd: rootDir,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'inherit'],
    }
  );

  return JSON.parse(output);
}

function ensureBuildProfileExists(variant) {
  const easJson = JSON.parse(fs.readFileSync(easJsonPath, 'utf8'));
  if (!easJson.build?.[variant]) {
    fail(`Missing eas.json build profile for variant "${variant}".`);
  }
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const variant = String(args.variant || '').trim().toLowerCase();
  const platform = String(args.platform || 'ios').trim().toLowerCase();

  if (!variant) {
    fail('Missing required --variant argument.');
  }

  if (!['ios', 'android', 'all'].includes(platform)) {
    fail(`Unsupported platform "${platform}". Expected ios, android, or all.`);
  }

  ensureBuildProfileExists(variant);

  const record = loadValidatedRecord(variant);
  if (!record.easProjectId) {
    fail(`Variant "${variant}" is missing an EAS project ID.`);
  }

  console.log(JSON.stringify({
    variant: record.variant,
    schoolSlug: record.schoolSlug,
    easProjectId: record.easProjectId,
    easProjectUrl: `https://expo.dev/accounts/jlaw171/projects/${record.appSlug}`,
    platform,
    profile: variant,
  }, null, 2));

  const result = spawnSync(
    'eas',
    ['build', '--platform', platform, '--profile', variant],
    {
      cwd: rootDir,
      stdio: 'inherit',
      env: {
        ...process.env,
        ...record.expectedEnv,
      },
    }
  );

  if (typeof result.status === 'number' && result.status !== 0) {
    process.exit(result.status);
  }

  if (result.error) {
    fail(result.error.message);
  }
}

main();
