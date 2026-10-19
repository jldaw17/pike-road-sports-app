#!/usr/bin/env node

import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const registryPath = path.join(__dirname, 'variant-registry.json');
const easJsonPath = path.join(rootDir, 'eas.json');
const validateScriptPath = path.join(__dirname, 'validate-variant-env.mjs');

function fail(message) {
  console.error(`[ios-simulator] ${message}`);
  process.exit(1);
}

export function parseArgs(argv) {
  const args = {
    build: false,
    dryRun: false,
    help: false,
    listDevices: false,
  };
  const positionals = [];

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith('--')) {
      positionals.push(token);
      continue;
    }

    const [rawKey, inlineValue] = token.slice(2).split('=', 2);
    if (rawKey === 'build') {
      args.build = true;
    } else if (rawKey === 'dry-run') {
      args.dryRun = true;
    } else if (rawKey === 'help') {
      args.help = true;
    } else if (rawKey === 'list-devices') {
      args.listDevices = true;
    } else if (rawKey === 'device') {
      const value = inlineValue || argv[index + 1];
      if (!value || value.startsWith('--')) {
        throw new Error('Missing value for --device.');
      }
      args.device = value;
      if (!inlineValue) {
        index += 1;
      }
    } else {
      throw new Error(`Unknown option "--${rawKey}".`);
    }
  }

  if (positionals.length > 1) {
    throw new Error(`Expected one school variant, received: ${positionals.join(', ')}.`);
  }

  args.variant = positionals[0]?.trim().toLowerCase();
  return args;
}

export function getLaunchableVariant(registry, variant) {
  if (!variant) {
    throw new Error('Missing school variant. Example: npm run sim -- bishop-gorman');
  }

  const record = registry[variant];
  if (!record || record.launchable !== true) {
    const available = Object.values(registry)
      .filter((candidate) => candidate.launchable === true)
      .map((candidate) => candidate.variant)
      .sort()
      .join(', ');
    throw new Error(`Unknown or non-launchable variant "${variant}". Available: ${available}.`);
  }

  const requiredFields = [
    'variant',
    'schoolSlug',
    'appSlug',
    'scheme',
    'iosBundleIdentifier',
    'easProjectId',
  ];
  const missing = requiredFields.filter((field) => !record[field]);
  if (missing.length > 0) {
    throw new Error(`Variant "${variant}" is missing: ${missing.join(', ')}.`);
  }

  return record;
}

export function getExpectedEnv(record) {
  return {
    APP_VARIANT: record.variant,
    EXPO_PUBLIC_SCHOOL_SLUG: record.schoolSlug,
    EXPO_PUBLIC_EAS_PROJECT_ID: record.easProjectId,
  };
}

export function assertEnvironmentMatches(record, environment) {
  const conflicts = Object.entries(getExpectedEnv(record)).filter(([key, expected]) => {
    const current = String(environment[key] || '').trim();
    return current && current !== expected;
  });

  if (conflicts.length > 0) {
    const details = conflicts
      .map(([key, expected]) => `${key}="${environment[key]}" (expected "${expected}")`)
      .join(', ');
    throw new Error(`Refusing to override a conflicting school environment: ${details}.`);
  }
}

function mergeProfiles(parent, child) {
  return {
    ...parent,
    ...child,
    env: {
      ...(parent.env || {}),
      ...(child.env || {}),
    },
    ios: {
      ...(parent.ios || {}),
      ...(child.ios || {}),
    },
  };
}

export function resolveBuildProfile(buildProfiles, profileName, seen = new Set()) {
  const profile = buildProfiles[profileName];
  if (!profile) {
    throw new Error(`Missing EAS build profile "${profileName}".`);
  }
  if (seen.has(profileName)) {
    throw new Error(`Circular EAS profile inheritance involving "${profileName}".`);
  }

  if (!profile.extends) {
    return { ...profile };
  }

  const nextSeen = new Set(seen).add(profileName);
  const parent = resolveBuildProfile(buildProfiles, profile.extends, nextSeen);
  const merged = mergeProfiles(parent, profile);
  delete merged.extends;
  return merged;
}

export function validateSimulatorProfile(easJson, record) {
  const profileName = `${record.variant}-simulator`;
  const profile = resolveBuildProfile(easJson.build || {}, profileName);
  const expectedEnv = getExpectedEnv(record);

  if (profile.developmentClient !== true) {
    throw new Error(`Profile "${profileName}" must set developmentClient=true.`);
  }
  if (profile.distribution !== 'internal') {
    throw new Error(`Profile "${profileName}" must use internal distribution.`);
  }
  if (profile.ios?.simulator !== true) {
    throw new Error(`Profile "${profileName}" must set ios.simulator=true.`);
  }
  if (profile.channel !== 'development') {
    throw new Error(`Profile "${profileName}" must use the development channel.`);
  }

  const mismatches = Object.entries(expectedEnv).filter(
    ([key, expected]) => profile.env?.[key] !== expected
  );
  if (mismatches.length > 0) {
    const details = mismatches
      .map(([key, expected]) => `${key}="${profile.env?.[key]}" (expected "${expected}")`)
      .join(', ');
    throw new Error(`Profile "${profileName}" has a school identity mismatch: ${details}.`);
  }

  return { profile, profileName };
}

export function flattenSimulatorDevices(simctlOutput) {
  return Object.entries(simctlOutput.devices || {}).flatMap(([runtime, devices]) =>
    devices
      .filter((device) => device.isAvailable !== false)
      .map((device) => ({ ...device, runtime }))
  );
}

export function selectSimulator(devices, requestedDevice) {
  if (requestedDevice) {
    const normalized = requestedDevice.trim().toLowerCase();
    const matches = devices.filter(
      (device) =>
        device.udid.toLowerCase() === normalized || device.name.toLowerCase() === normalized
    );
    if (matches.length === 0) {
      throw new Error(`Simulator "${requestedDevice}" is unavailable. Run npm run sim -- --list-devices.`);
    }
    if (matches.length > 1) {
      const choices = matches.map((device) => `${device.name} (${device.udid})`).join(', ');
      throw new Error(`Simulator name "${requestedDevice}" is ambiguous. Use a UDID: ${choices}.`);
    }
    return matches[0];
  }

  const booted = devices.filter((device) => device.state === 'Booted');
  if (booted.length === 1) {
    return booted[0];
  }
  if (booted.length === 0) {
    throw new Error('No simulator is booted. Pass --device <name-or-UDID> to select one explicitly.');
  }

  const choices = booted.map((device) => `${device.name} (${device.udid})`).join(', ');
  throw new Error(`Multiple simulators are booted. Pass --device with one of: ${choices}.`);
}

function findFileNamed(root, name, maxDepth = 4) {
  if (!root || !fs.existsSync(root) || maxDepth < 0) {
    return null;
  }

  const entries = fs.readdirSync(root, { withFileTypes: true });
  for (const entry of entries) {
    const entryPath = path.join(root, entry.name);
    if (entry.name === name) {
      return entryPath;
    }
    if (entry.isDirectory()) {
      const found = findFileNamed(entryPath, name, maxDepth - 1);
      if (found) {
        return found;
      }
    }
  }
  return null;
}

function readPlist(plistPath) {
  const output = execFileSync('plutil', ['-convert', 'json', '-o', '-', plistPath], {
    encoding: 'utf8',
  });
  return JSON.parse(output);
}

export function validateInstalledClientMetadata(metadata, record) {
  const expectedUpdatesUrl = `https://u.expo.dev/${record.easProjectId}`;
  const expectedDevScheme = `exp+${record.appSlug}`;
  const errors = [];

  if (metadata.bundleIdentifier !== record.iosBundleIdentifier) {
    errors.push(
      `bundle identifier "${metadata.bundleIdentifier}" does not match "${record.iosBundleIdentifier}"`
    );
  }
  if (!metadata.hasDevLauncher) {
    errors.push('EXDevLauncher.bundle is missing');
  }
  if (!metadata.urlSchemes.includes(expectedDevScheme)) {
    errors.push(`development-client URL scheme "${expectedDevScheme}" is missing`);
  }
  if (metadata.updatesUrl && metadata.updatesUrl !== expectedUpdatesUrl) {
    errors.push(`updates URL "${metadata.updatesUrl}" does not match "${expectedUpdatesUrl}"`);
  }

  if (errors.length > 0) {
    throw new Error(`Installed app is not a compatible ${record.variant} development client: ${errors.join('; ')}.`);
  }
}

function inspectInstalledClient(device, record) {
  const container = spawnSync(
    'xcrun',
    ['simctl', 'get_app_container', device.udid, record.iosBundleIdentifier, 'app'],
    { encoding: 'utf8' }
  );
  if (container.status !== 0) {
    return null;
  }

  const appPath = container.stdout.trim();
  const infoPlist = readPlist(path.join(appPath, 'Info.plist'));
  const expoPlistPath = findFileNamed(appPath, 'Expo.plist');
  const expoPlist = expoPlistPath ? readPlist(expoPlistPath) : {};
  const urlSchemes = (infoPlist.CFBundleURLTypes || []).flatMap(
    (urlType) => urlType.CFBundleURLSchemes || []
  );
  const metadata = {
    appPath,
    bundleIdentifier: infoPlist.CFBundleIdentifier,
    hasDevLauncher: Boolean(findFileNamed(appPath, 'EXDevLauncher.bundle')),
    updatesUrl: expoPlist.EXUpdatesURL,
    urlSchemes,
  };

  validateInstalledClientMetadata(metadata, record);
  return metadata;
}

export function getMissingClientCommand(record, device) {
  return `npm run sim:build -- ${record.variant} --device ${device.udid}`;
}

function listSimulatorDevices() {
  const output = execFileSync('xcrun', ['simctl', 'list', 'devices', 'available', '--json'], {
    encoding: 'utf8',
  });
  return flattenSimulatorDevices(JSON.parse(output));
}

function printDevices(devices) {
  const ordered = [...devices].sort((left, right) => {
    if (left.state !== right.state) {
      return left.state === 'Booted' ? -1 : 1;
    }
    return left.name.localeCompare(right.name);
  });
  console.log('Available iOS simulators:');
  for (const device of ordered) {
    console.log(`- ${device.name} | ${device.state} | ${device.udid}`);
  }
}

function ensureSimulatorBooted(device, dryRun) {
  if (device.state === 'Booted') {
    return;
  }
  if (dryRun) {
    console.log(`[ios-simulator] DRY RUN: would boot ${device.name} (${device.udid}).`);
    return;
  }

  const boot = spawnSync('xcrun', ['simctl', 'boot', device.udid], { stdio: 'inherit' });
  if (boot.status !== 0) {
    throw new Error(`Unable to boot simulator ${device.name} (${device.udid}).`);
  }
  const wait = spawnSync('xcrun', ['simctl', 'bootstatus', device.udid, '-b'], {
    stdio: 'inherit',
  });
  if (wait.status !== 0) {
    throw new Error(`Simulator ${device.name} did not finish booting.`);
  }
}

function runVariantValidation(record) {
  const output = execFileSync('node', [validateScriptPath, '--variant', record.variant], {
    cwd: rootDir,
    encoding: 'utf8',
    env: {
      ...process.env,
      ...getExpectedEnv(record),
    },
    stdio: ['ignore', 'pipe', 'inherit'],
  });
  return JSON.parse(output);
}

function printUsage() {
  console.log(`Usage:
  npm run sim -- <variant> [--device <name-or-UDID>] [--dry-run]
  npm run sim:build -- <variant> [--device <name-or-UDID>] [--dry-run]
  npm run sim -- --list-devices

Examples:
  npm run sim -- prattville --device "iPhone 17 Pro Max AthleticOS"
  npm run sim -- bishop-gorman --device 3E6495F3-4B27-4A41-BCFB-A0C050630DB9
  npm run sim:build -- sylacauga --device "iPad Pro 13-inch (M5)"`);
}

function runBuild(record, profileName, device, dryRun) {
  const command = [
    'build:dev',
    '--platform',
    'ios',
    '--profile',
    profileName,
    '--simulator',
    device.udid,
    '--skip-bundler',
  ];

  if (dryRun) {
    console.log(`[ios-simulator] DRY RUN: eas ${command.join(' ')}`);
    return;
  }

  console.log(`[ios-simulator] Explicit cloud build/install authorized for ${record.variant}.`);
  const result = spawnSync('eas', command, {
    cwd: rootDir,
    stdio: 'inherit',
    env: {
      ...process.env,
      ...getExpectedEnv(record),
    },
  });
  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function launchClientAndMetro(record, device, dryRun) {
  if (dryRun) {
    console.log(
      `[ios-simulator] DRY RUN: would launch ${record.iosBundleIdentifier} on ${device.name}.`
    );
    console.log('[ios-simulator] DRY RUN: would start npx expo start --dev-client --clear.');
    return;
  }

  const showSimulator = spawnSync(
    'open',
    ['-a', 'Simulator', '--args', '-CurrentDeviceUDID', device.udid],
    { stdio: 'inherit' }
  );
  if (showSimulator.status !== 0) {
    throw new Error(`Unable to show simulator ${device.name}.`);
  }

  const launch = spawnSync(
    'xcrun',
    ['simctl', 'launch', device.udid, record.iosBundleIdentifier],
    { stdio: 'inherit' }
  );
  if (launch.status !== 0) {
    throw new Error(`Unable to launch ${record.iosBundleIdentifier} on ${device.name}.`);
  }

  const metro = spawnSync('npx', ['expo', 'start', '--dev-client', '--clear'], {
    cwd: rootDir,
    stdio: 'inherit',
    env: {
      ...process.env,
      ...getExpectedEnv(record),
    },
  });
  if (metro.error) {
    throw metro.error;
  }
  if (metro.status !== 0) {
    process.exit(metro.status ?? 1);
  }
}

export function main(argv = process.argv.slice(2)) {
  let args;
  try {
    args = parseArgs(argv);
  } catch (error) {
    fail(error.message);
  }

  if (args.help) {
    printUsage();
    return;
  }

  if (args.listDevices) {
    try {
      printDevices(listSimulatorDevices());
    } catch (error) {
      fail(`Unable to read CoreSimulator devices: ${error.message}`);
    }
    return;
  }

  const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
  const easJson = JSON.parse(fs.readFileSync(easJsonPath, 'utf8'));

  try {
    const record = getLaunchableVariant(registry, args.variant);
    assertEnvironmentMatches(record, process.env);
    const { profileName } = validateSimulatorProfile(easJson, record);
    const validation = runVariantValidation(record);
    const devices = listSimulatorDevices();
    const device = selectSimulator(devices, args.device);

    console.log(JSON.stringify({
      variant: record.variant,
      schoolSlug: record.schoolSlug,
      appSlug: record.appSlug,
      iosBundleIdentifier: record.iosBundleIdentifier,
      easProjectId: record.easProjectId,
      updatesUrl: `https://u.expo.dev/${record.easProjectId}`,
      profile: profileName,
      device: {
        name: device.name,
        udid: device.udid,
        state: device.state,
      },
      expoConfigValidated: validation.expoConfigValidated,
    }, null, 2));

    if (args.build) {
      runBuild(record, profileName, device, args.dryRun);
      return;
    }

    ensureSimulatorBooted(device, args.dryRun);
    const installedClient = inspectInstalledClient(device, record);
    if (!installedClient) {
      if (args.dryRun) {
        console.log(
          `[ios-simulator] DRY RUN: no ${record.variant} development client is installed on ${device.name}.`
        );
        console.log(
          `[ios-simulator] Explicit build/install command: ${getMissingClientCommand(record, device)}`
        );
        return;
      }
      throw new Error(
        `No ${record.variant} development client is installed on ${device.name}. ` +
          `Create or reuse one explicitly with: ${getMissingClientCommand(record, device)}`
      );
    }

    console.log(`[ios-simulator] Compatible client: ${installedClient.appPath}`);
    launchClientAndMetro(record, device, args.dryRun);
  } catch (error) {
    fail(error.message);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  main();
}
