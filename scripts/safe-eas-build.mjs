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

function loadBuildProfile(profileName) {
  const easJson = JSON.parse(fs.readFileSync(easJsonPath, 'utf8'));
  const profile = easJson.build?.[profileName];
  if (!profile) {
    fail(`Missing eas.json build profile "${profileName}".`);
  }

  return profile;
}

function ensureProfileEnvMatchesVariant(profileName, profile, expectedEnv) {
  const profileEnv = profile.env || {};
  const conflicts = Object.entries(expectedEnv).filter(([key, expectedValue]) => {
    const configuredValue = profileEnv[key];
    return typeof configuredValue === 'string' && configuredValue !== expectedValue;
  });

  if (conflicts.length > 0) {
    const summary = conflicts
      .map(([key, expectedValue]) => `${key}="${profileEnv[key]}" (expected "${expectedValue}")`)
      .join(', ');
    fail(`Build profile "${profileName}" conflicts with the selected variant: ${summary}`);
  }
}

function resolveAndroidArtifactType(profile) {
  if (profile.android?.buildType === 'apk' || profile.distribution === 'internal' || profile.developmentClient === true) {
    return 'apk';
  }

  return 'aab';
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const variant = String(args.variant || '').trim().toLowerCase();
  const platform = String(args.platform || 'ios').trim().toLowerCase();
  const profileName = String(args.profile || variant).trim();

  if (!variant) {
    fail('Missing required --variant argument.');
  }

  if (!['ios', 'android', 'all'].includes(platform)) {
    fail(`Unsupported platform "${platform}". Expected ios, android, or all.`);
  }

  const record = loadValidatedRecord(variant);
  const profile = loadBuildProfile(profileName);
  if (!record.easProjectId) {
    fail(`Variant "${variant}" is missing an EAS project ID.`);
  }

  ensureProfileEnvMatchesVariant(profileName, profile, record.expectedEnv);

  if ((platform === 'android' || platform === 'all') && !record.androidPackage) {
    fail(`Variant "${variant}" is missing an Android package.`);
  }

  const androidArtifactType = platform === 'android' || platform === 'all'
    ? resolveAndroidArtifactType(profile)
    : undefined;

  console.log(JSON.stringify({
    variant: record.variant,
    schoolSlug: record.schoolSlug,
    easProjectId: record.easProjectId,
    easProjectUrl: `https://expo.dev/accounts/jlaw171/projects/${record.appSlug}`,
    ...(platform === 'android' || platform === 'all'
      ? {
          androidPackage: record.androidPackage,
          artifactType: androidArtifactType,
        }
      : {}),
    platform,
    profile: profileName,
  }, null, 2));

  const result = spawnSync(
    'eas',
    ['build', '--platform', platform, '--profile', profileName],
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
