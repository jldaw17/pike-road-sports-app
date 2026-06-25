#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const registryPath = path.join(__dirname, 'variant-registry.json');

function fail(message) {
  console.error(`[safe-variant] ${message}`);
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

function loadRegistry() {
  return JSON.parse(fs.readFileSync(registryPath, 'utf8'));
}

function getVariantRecord(registry, variant) {
  const normalizedVariant = String(variant || '').trim().toLowerCase();
  if (!normalizedVariant) {
    fail('Missing required --variant argument.');
  }

  const record = registry[normalizedVariant];
  if (!record) {
    fail(
      `Unknown variant "${normalizedVariant}". Expected one of: ${Object.keys(registry).join(', ')}.`
    );
  }

  if (record.launchable && !record.easProjectId) {
    fail(`Variant "${normalizedVariant}" is launchable but missing easProjectId in variant-registry.json.`);
  }

  return record;
}

function validateExistingEnv(record) {
  const conflicts = [
    ['APP_VARIANT', record.variant],
    ['EXPO_PUBLIC_SCHOOL_SLUG', record.schoolSlug],
    ['EXPO_PUBLIC_EAS_PROJECT_ID', record.easProjectId],
  ].filter(([key, expected]) => {
    if (!expected) {
      return false;
    }

    const currentValue = String(process.env[key] || '').trim();
    return Boolean(currentValue) && currentValue !== expected;
  });

  if (conflicts.length > 0) {
    const summary = conflicts
      .map(([key, expected]) => `${key}="${process.env[key]}" (expected "${expected}")`)
      .join(', ');
    fail(`Environment conflict for variant "${record.variant}": ${summary}`);
  }
}

function getExpectedEnv(record) {
  return {
    APP_VARIANT: record.variant,
    EXPO_PUBLIC_SCHOOL_SLUG: record.schoolSlug,
    EXPO_PUBLIC_EAS_PROJECT_ID: record.easProjectId,
  };
}

function runExpoConfigValidation(record, expectedEnv) {
  const raw = execFileSync(
    'npx',
    ['expo', 'config', '--type', 'public', '--json'],
    {
      cwd: rootDir,
      env: {
        ...process.env,
        ...expectedEnv,
      },
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }
  );

  const parsed = JSON.parse(raw);
  const expoConfig = parsed.expo || parsed;
  const expectedUpdatesUrl = `https://u.expo.dev/${record.easProjectId}`;
  const actualProjectId = expoConfig.extra?.eas?.projectId;

  if (expoConfig.slug !== record.appSlug) {
    fail(`Expo config slug mismatch. Expected "${record.appSlug}", received "${expoConfig.slug}".`);
  }

  if (expoConfig.ios?.bundleIdentifier !== record.iosBundleIdentifier) {
    fail(
      `Expo config ios.bundleIdentifier mismatch. Expected "${record.iosBundleIdentifier}", received "${expoConfig.ios?.bundleIdentifier}".`
    );
  }

  if (expoConfig.extra?.schoolSlug !== record.schoolSlug) {
    fail(
      `Expo config extra.schoolSlug mismatch. Expected "${record.schoolSlug}", received "${expoConfig.extra?.schoolSlug}".`
    );
  }

  if (actualProjectId !== record.easProjectId) {
    fail(
      `Expo config extra.eas.projectId mismatch. Expected "${record.easProjectId}", received "${actualProjectId}".`
    );
  }

  if (expoConfig.updates?.url !== expectedUpdatesUrl) {
    fail(
      `Expo config updates.url mismatch. Expected "${expectedUpdatesUrl}", received "${expoConfig.updates?.url}".`
    );
  }
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const registry = loadRegistry();
  const record = getVariantRecord(registry, args.variant);
  validateExistingEnv(record);

  const expectedEnv = getExpectedEnv(record);
  const expectedUpdatesUrl = `https://u.expo.dev/${record.easProjectId}`;

  if (args['skip-expo-config'] !== true) {
    runExpoConfigValidation(record, expectedEnv);
  }

  console.log(JSON.stringify({
    variant: record.variant,
    schoolSlug: record.schoolSlug,
    appSlug: record.appSlug,
    scheme: record.scheme,
    iosBundleIdentifier: record.iosBundleIdentifier,
    easProjectId: record.easProjectId,
    updatesUrl: expectedUpdatesUrl,
    expectedEnv,
    expoConfigValidated: args['skip-expo-config'] !== true,
  }, null, 2));
}

main();
