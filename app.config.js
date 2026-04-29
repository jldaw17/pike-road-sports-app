const appJson = require('./app.json');
const fs = require('fs');

const NATIVE_SPLASH_CONFIG = {
  backgroundColor: '#FFFFFF',
  resizeMode: 'contain',
};

const VARIANT_CONFIGS = {
  'pike-road': {
    schoolSlug: 'pike-road',
    name: 'Pike Road Athletics',
    slug: 'pike-road-athletics',
    scheme: 'pikeroadathletics',
    iosBundleIdentifier: 'com.athleticos.pikeroad',
    icon: './assets/images/icon.png',
    easProjectId: '70b794e3-e8d7-4919-ac83-0b034b118ea2',
  },
  pellcity: {
    schoolSlug: 'pellcity',
    name: 'Pell City Athletics',
    slug: 'pell-city-athletics',
    scheme: 'pellcityathletics',
    iosBundleIdentifier: 'com.athleticos.pellcity',
    icon: './assets/icons/pellcity-app-icon.png',
    easProjectId: '1fb0bea0-6786-49cb-8844-50e8e75b5dc5',
  },
  athleticos: {
    schoolSlug: 'athleticos',
    name: 'AthleticOS App',
    slug: 'athleticos-app',
    scheme: 'athleticosapp',
    iosBundleIdentifier: 'com.athleticos.athleticos',
    icon: './assets/icons/athleticos-app-icon.png',
  },
  recruitos: {
    schoolSlug: 'recruitos',
    name: 'RecruitOS',
    slug: 'recruitos-app',
    scheme: 'recruitosapp',
    iosBundleIdentifier: 'com.athleticos.recruitos',
    icon: './assets/icons/recruitos-app-icon.png',
  },
};

function isLocalDevelopment() {
  return process.env.EAS_BUILD !== 'true' && process.env.CI !== 'true';
}

function resolveVariantKey() {
  const configuredVariant = String(process.env.APP_VARIANT || '').trim().toLowerCase();

  if (configuredVariant) {
    return configuredVariant;
  }

  if (isLocalDevelopment()) {
    return 'pike-road';
  }

  throw new Error(
    'Missing APP_VARIANT for this build. Set APP_VARIANT to one of: pike-road, pellcity, athleticos, recruitos.'
  );
}

function resolveVariantConfig() {
  const variantKey = resolveVariantKey();
  const variantConfig = VARIANT_CONFIGS[variantKey];

  if (!variantConfig) {
    throw new Error(
      `Unsupported APP_VARIANT "${variantKey}". Expected one of: ${Object.keys(VARIANT_CONFIGS).join(', ')}.`
    );
  }

  const configuredSchoolSlug = String(process.env.EXPO_PUBLIC_SCHOOL_SLUG || '').trim().toLowerCase();
  if (configuredSchoolSlug && configuredSchoolSlug !== variantConfig.schoolSlug) {
    throw new Error(
      `APP_VARIANT "${variantKey}" requires EXPO_PUBLIC_SCHOOL_SLUG="${variantConfig.schoolSlug}", but received "${configuredSchoolSlug}".`
    );
  }

  return {
    appVariant: variantKey,
    schoolSlug: configuredSchoolSlug || variantConfig.schoolSlug,
    ...variantConfig,
  };
}

function resolveIconPath(iconPath, fallbackPath) {
  if (iconPath && fs.existsSync(iconPath)) {
    return iconPath;
  }

  return fallbackPath;
}

module.exports = () => {
  const baseExpoConfig = appJson.expo || {};
  const variantConfig = resolveVariantConfig();
  const resolvedIcon = resolveIconPath(variantConfig.icon, baseExpoConfig.icon);
  const baseExtra = baseExpoConfig.extra || {};
  const { eas: _ignoredBaseEas, ...safeBaseExtraWithoutEas } = baseExtra;
  const plugins = (baseExpoConfig.plugins || []).map((plugin) => {
    if (Array.isArray(plugin) && plugin[0] === 'expo-splash-screen') {
      return [
        plugin[0],
        NATIVE_SPLASH_CONFIG,
      ];
    }

    return plugin;
  });

  const nextExtra = {
    ...safeBaseExtraWithoutEas,
    schoolSlug: variantConfig.schoolSlug,
    appVariant: variantConfig.appVariant,
  };

  if (variantConfig.easProjectId) {
    nextExtra.eas = {
      projectId: variantConfig.easProjectId,
    };
  }

  return {
    ...baseExpoConfig,
    name: variantConfig.name,
    slug: variantConfig.slug,
    scheme: variantConfig.scheme,
    icon: resolvedIcon,
    splash: NATIVE_SPLASH_CONFIG,
    ios: {
      ...(baseExpoConfig.ios || {}),
      bundleIdentifier: variantConfig.iosBundleIdentifier,
      infoPlist: {
        ...(baseExpoConfig.ios?.infoPlist || {}),
        CFBundleDisplayName: variantConfig.name,
      },
    },
    plugins,
    extra: nextExtra,
  };
};
