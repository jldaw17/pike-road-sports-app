const appJson = require('./app.json');
const fs = require('fs');

const NEUTRAL_SPLASH_IMAGE = './assets/images/splash-icon.png';

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
    androidPackage: 'com.athleticos.pikeroad',
    icon: './assets/images/icon.png',
    easProjectId: '70b794e3-e8d7-4919-ac83-0b034b118ea2',
  },
  pellcity: {
    schoolSlug: 'pellcity',
    name: 'Pell City Athletics',
    slug: 'pell-city-athletics',
    scheme: 'pellcityathletics',
    iosBundleIdentifier: 'com.athleticos.pellcity',
    androidPackage: 'com.athleticos.pellcity',
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
  gamedayos: {
    schoolSlug: 'gamedayos',
    name: 'GamedayOS',
    slug: 'gamedayos-app',
    scheme: 'gamedayos',
    iosBundleIdentifier: 'com.athleticos.gamedayos',
    icon: './assets/images/icon.png',
  },
  sylacauga: {
    schoolSlug: 'sylacauga',
    name: 'Sylacauga Athletics',
    slug: 'sylacauga-athletics',
    scheme: 'sylacaugaathletics',
    iosBundleIdentifier: 'com.athleticos.sylacauga',
    androidPackage: 'com.athleticos.sylacauga',
    icon: './assets/images/schools/sylacauga/app-icon.png',
    easProjectId: '8673888c-85fd-46b5-adae-d1c603e9acbd',
  },
  hoover: {
    schoolSlug: 'hoover',
    name: 'Hoover Athletics',
    slug: 'hoover-athletics',
    scheme: 'hooverathletics',
    iosBundleIdentifier: 'com.athleticos.hoover',
    icon: './assets/variants/hoover/icon.png',
  },
  wetumpka: {
    schoolSlug: 'wetumpka',
    name: 'Wetumpka Athletics',
    slug: 'wetumpka-athletics',
    scheme: 'wetumpkaathletics',
    iosBundleIdentifier: 'com.athleticos.wetumpka',
    androidPackage: 'com.athleticos.wetumpka',
    icon: './assets/variants/wetumpka/wetumpka-app-icon.png',
    easProjectId: 'ef5cbd90-cdb0-46ea-b1a6-6d676dee0057',
  },
  opelika: {
    schoolSlug: 'opelika',
    name: 'Opelika Athletics',
    slug: 'opelika-athletics',
    scheme: 'opelikaathletics',
    iosBundleIdentifier: 'com.athleticos.opelika',
    androidPackage: 'com.athleticos.opelika',
    icon: './assets/variants/opelika/opelika-app-icon.png',
    easProjectId: '949be373-10ae-40b4-88b4-2e11d58615d3',
  },
  prattville: {
    schoolSlug: 'prattville',
    name: 'Prattville Lions',
    slug: 'prattville-athletics',
    scheme: 'prattvilleathletics',
    iosBundleIdentifier: 'com.athleticos.prattville',
    androidPackage: 'com.athleticos.prattville',
    icon: './assets/variants/prattville/prattville-app-icon.png',
    easProjectId: 'cab6e75a-7f09-4663-82f7-0543487ef18e',
  },
  campbell: {
    schoolSlug: 'campbell',
    name: 'Campbell Spartans',
    slug: 'campbell-athletics',
    scheme: 'campbell',
    iosBundleIdentifier: 'com.athleticos.campbell',
    androidPackage: 'com.athleticos.campbell',
    icon: './assets/variants/campbell/campbell-app-icon.png',
    easProjectId: '6af0b25c-8dc8-4335-ae46-b81fd2d96d97',
  },
  comer: {
    schoolSlug: 'comer',
    name: 'B.B. Comer Tigers',
    slug: 'comer-athletics',
    scheme: 'comer',
    iosBundleIdentifier: 'com.athleticos.comer',
    androidPackage: 'com.athleticos.comer',
    googleServicesFile: './assets/variants/comer/google-services.json',
    icon: './assets/variants/comer/comer-app-icon.png',
    easProjectId: '64c5ae97-27ad-4519-a0aa-c72f90b8f2a2',
  },
  fayetteville: {
    schoolSlug: 'fayetteville',
    name: 'Fayetteville Wolves',
    slug: 'fayetteville-athletics',
    scheme: 'fayetteville',
    iosBundleIdentifier: 'com.athleticos.fayetteville',
    androidPackage: 'com.athleticos.fayetteville',
    icon: './assets/variants/fayetteville/fayetteville-app-icon.png',
    easProjectId: '32723a6b-bc85-4a54-9885-aa03b6326757',
  },
  childersburg: {
    schoolSlug: 'childersburg',
    name: 'Childersburg Tigers',
    slug: 'childersburg-athletics',
    scheme: 'childersburg',
    iosBundleIdentifier: 'com.athleticos.childersburg',
    androidPackage: 'com.athleticos.childersburg',
    icon: './assets/variants/childersburg/childersburg-app-icon.png',
    easProjectId: '5c859028-b93a-49e3-a1f4-bccd0c35992a',
  },
  hickory: {
    schoolSlug: 'hickory',
    name: 'Hickory Athletics',
    slug: 'hickory-athletics',
    scheme: 'hickoryathletics',
    iosBundleIdentifier: 'com.athleticos.hickory',
    icon: './assets/images/icon.png',
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
    'Missing APP_VARIANT for this build. Set APP_VARIANT to one of: pike-road, pellcity, athleticos, recruitos, gamedayos, sylacauga, hoover, wetumpka, opelika, prattville, campbell, comer, fayetteville, childersburg, hickory.'
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

function resolveSplashImagePath(primaryPath, fallbackPath = NEUTRAL_SPLASH_IMAGE) {
  if (primaryPath && fs.existsSync(primaryPath)) {
    return primaryPath;
  }

  if (fallbackPath && fs.existsSync(fallbackPath)) {
    return fallbackPath;
  }

  return primaryPath || fallbackPath;
}

function resolveEasProjectId(variantConfig) {
  const envProjectId = String(
    process.env.EXPO_PUBLIC_EAS_PROJECT_ID ||
      process.env.EAS_PROJECT_ID ||
      ''
  ).trim();

  return envProjectId || variantConfig.easProjectId || '';
}

module.exports = () => {
  const baseExpoConfig = appJson.expo || {};
  const variantConfig = resolveVariantConfig();
  const resolvedIcon = resolveIconPath(variantConfig.icon, baseExpoConfig.icon);
  const resolvedSplashImage = resolveSplashImagePath(resolvedIcon);
  const baseExtra = baseExpoConfig.extra || {};
  const baseUiBackgroundModes = Array.isArray(baseExpoConfig.ios?.infoPlist?.UIBackgroundModes)
    ? baseExpoConfig.ios.infoPlist.UIBackgroundModes
    : [];
  const resolvedUiBackgroundModes = Array.from(
    new Set([...baseUiBackgroundModes, 'audio'])
  );
  const { eas: _ignoredBaseEas, ...safeBaseExtraWithoutEas } = baseExtra;
  const plugins = (baseExpoConfig.plugins || []).map((plugin) => {
    if (Array.isArray(plugin) && plugin[0] === 'expo-splash-screen') {
      return [
        plugin[0],
        {
          ...(plugin[1] || {}),
          image: resolvedSplashImage,
          ...NATIVE_SPLASH_CONFIG,
        },
      ];
    }

    return plugin;
  });

  const nextExtra = {
    ...safeBaseExtraWithoutEas,
    schoolSlug: variantConfig.schoolSlug,
    appVariant: variantConfig.appVariant,
  };

  const resolvedProjectId = resolveEasProjectId(variantConfig);
  const resolvedUpdatesUrl = resolvedProjectId
    ? `https://u.expo.dev/${resolvedProjectId}`
    : undefined;

  if (resolvedProjectId) {
    nextExtra.eas = {
      projectId: resolvedProjectId,
    };
  }

  return {
    ...baseExpoConfig,
    name: variantConfig.name,
    slug: variantConfig.slug,
    scheme: variantConfig.scheme,
    icon: resolvedIcon,
    splash: {
      ...(baseExpoConfig.splash || {}),
      image: resolvedSplashImage,
      ...NATIVE_SPLASH_CONFIG,
    },
    runtimeVersion: {
      policy: 'appVersion',
    },
    updates: {
      ...(baseExpoConfig.updates || {}),
      ...(resolvedUpdatesUrl ? { url: resolvedUpdatesUrl } : {}),
    },
    ios: {
      ...(baseExpoConfig.ios || {}),
      bundleIdentifier: variantConfig.iosBundleIdentifier,
      infoPlist: {
        ...(baseExpoConfig.ios?.infoPlist || {}),
        CFBundleDisplayName: variantConfig.name,
        UIBackgroundModes: resolvedUiBackgroundModes,
      },
    },
    android: {
      ...(baseExpoConfig.android || {}),
      ...(variantConfig.androidPackage ? { package: variantConfig.androidPackage } : {}),
      ...(variantConfig.googleServicesFile
        ? { googleServicesFile: variantConfig.googleServicesFile }
        : {}),
    },
    plugins,
    extra: nextExtra,
  };
};
