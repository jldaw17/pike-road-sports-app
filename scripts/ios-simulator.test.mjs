import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  assertEnvironmentMatches,
  flattenSimulatorDevices,
  getLaunchableVariant,
  getMissingClientCommand,
  parseArgs,
  selectSimulator,
  validateInstalledClientMetadata,
  validateSimulatorProfile,
} from './ios-simulator.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const record = {
  variant: 'bishop-gorman',
  schoolSlug: 'bishop-gorman',
  appSlug: 'bishop-gorman-athletics',
  scheme: 'bishopgormanathletics',
  iosBundleIdentifier: 'com.athleticos.bishopgorman',
  easProjectId: 'c6d70f8f-8dff-4f73-8977-217393ec1f74',
  launchable: true,
};

const devices = [
  {
    name: 'iPhone 17 Pro Max AthleticOS',
    udid: 'PHONE-UDID',
    state: 'Booted',
  },
  {
    name: 'iPad Pro 13-inch (M5)',
    udid: 'IPAD-UDID',
    state: 'Shutdown',
  },
  {
    name: 'AthleticOS Duo Test',
    udid: 'DUO-UDID',
    state: 'Shutdown',
  },
];

test('parses launch and explicit build arguments', () => {
  assert.deepEqual(parseArgs(['bishop-gorman', '--device', 'PHONE-UDID']), {
    build: false,
    dryRun: false,
    help: false,
    listDevices: false,
    variant: 'bishop-gorman',
    device: 'PHONE-UDID',
  });
  assert.equal(parseArgs(['--build', 'prattville', '--dry-run']).build, true);
});

test('rejects unknown variants and preserves exact registry identity', () => {
  assert.throws(
    () => getLaunchableVariant({ 'bishop-gorman': record }, 'unknown-school'),
    /Unknown or non-launchable variant/
  );
  assert.equal(getLaunchableVariant({ 'bishop-gorman': record }, 'bishop-gorman'), record);
});

test('refuses a conflicting school environment', () => {
  assert.throws(
    () => assertEnvironmentMatches(record, { APP_VARIANT: 'prattville' }),
    /Refusing to override a conflicting school environment/
  );
  assert.doesNotThrow(() => assertEnvironmentMatches(record, {}));
});

test('resolves and validates an inherited simulator profile', () => {
  const easJson = {
    build: {
      development: {
        channel: 'development',
        developmentClient: true,
        distribution: 'internal',
      },
      'ios-simulator-development': {
        extends: 'development',
        ios: { simulator: true },
      },
      'bishop-gorman-simulator': {
        extends: 'ios-simulator-development',
        env: {
          APP_VARIANT: record.variant,
          EXPO_PUBLIC_SCHOOL_SLUG: record.schoolSlug,
          EXPO_PUBLIC_EAS_PROJECT_ID: record.easProjectId,
        },
      },
    },
  };

  const result = validateSimulatorProfile(easJson, record);
  assert.equal(result.profile.developmentClient, true);
  assert.equal(result.profile.ios.simulator, true);
  assert.equal(result.profile.env.APP_VARIANT, 'bishop-gorman');
});

test('rejects a simulator profile wired to the wrong school', () => {
  const easJson = {
    build: {
      'bishop-gorman-simulator': {
        channel: 'development',
        developmentClient: true,
        distribution: 'internal',
        ios: { simulator: true },
        env: {
          APP_VARIANT: 'prattville',
          EXPO_PUBLIC_SCHOOL_SLUG: 'prattville',
          EXPO_PUBLIC_EAS_PROJECT_ID: 'wrong-project',
        },
      },
    },
  };

  assert.throws(() => validateSimulatorProfile(easJson, record), /school identity mismatch/);
});

test('selects a simulator by name or UDID and rejects unavailable devices', () => {
  assert.equal(selectSimulator(devices, 'IPAD-UDID').name, 'iPad Pro 13-inch (M5)');
  assert.equal(selectSimulator(devices, 'AthleticOS Duo Test').udid, 'DUO-UDID');
  assert.equal(selectSimulator(devices).udid, 'PHONE-UDID');
  assert.throws(() => selectSimulator(devices, 'Missing Device'), /unavailable/);
});

test('requires explicit selection when multiple simulators are booted', () => {
  const multipleBooted = devices.map((device) => ({ ...device, state: 'Booted' }));
  assert.throws(() => selectSimulator(multipleBooted), /Multiple simulators are booted/);
});

test('flattens available simctl devices while excluding unavailable entries', () => {
  const flattened = flattenSimulatorDevices({
    devices: {
      runtime: [
        { name: 'Available', udid: 'ONE', state: 'Shutdown', isAvailable: true },
        { name: 'Unavailable', udid: 'TWO', state: 'Shutdown', isAvailable: false },
      ],
    },
  });
  assert.deepEqual(flattened.map((device) => device.udid), ['ONE']);
});

test('validates installed development-client identity', () => {
  assert.doesNotThrow(() =>
    validateInstalledClientMetadata(
      {
        bundleIdentifier: record.iosBundleIdentifier,
        hasDevLauncher: true,
        updatesUrl: `https://u.expo.dev/${record.easProjectId}`,
        urlSchemes: [`exp+${record.appSlug}`],
      },
      record
    )
  );
  assert.throws(
    () =>
      validateInstalledClientMetadata(
        {
          bundleIdentifier: 'com.athleticos.prattville',
          hasDevLauncher: false,
          urlSchemes: [],
        },
        record
      ),
    /not a compatible bishop-gorman development client/
  );
});

test('missing-client instructions require a separate explicit build command', () => {
  assert.equal(
    getMissingClientCommand(record, devices[0]),
    'npm run sim:build -- bishop-gorman --device PHONE-UDID'
  );
});

test('every launchable registry variant has a matching simulator profile', () => {
  const registry = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'variant-registry.json'), 'utf8')
  );
  const easJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'eas.json'), 'utf8'));

  for (const candidate of Object.values(registry).filter((item) => item.launchable === true)) {
    assert.doesNotThrow(() => validateSimulatorProfile(easJson, candidate), candidate.variant);
  }
});
