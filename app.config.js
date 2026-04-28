const appJson = require('./app.json');

const SCHOOL_CONFIGS = {
  athleticos: {
    name: 'AthleticOS Engineers',
    icon: './assets/icons/athleticos-app-icon.png',
    iosBundleIdentifier: 'com.athleticos.athleticos',
  },
  recruitos: {
    name: 'RecruitOS Recruiters',
    icon: './assets/icons/recruitos-app-icon.png',
    iosBundleIdentifier: 'com.athleticos.recruitos',
  },
  pellcity: {
    name: 'Pell City Panthers',
    icon: './assets/icons/pellcity-app-icon.png',
    iosBundleIdentifier: 'com.athleticos.pellcity',
  },
  'pike-road': {
    name: 'Pike Road Patriots',
    icon: './assets/images/icon.png',
    iosBundleIdentifier: 'com.athleticos.pikeroad',
  },
};

function getConfiguredSchoolSlug() {
  const configuredSlug =
    process.env.EXPO_PUBLIC_SCHOOL_SLUG || appJson.expo?.extra?.schoolSlug || 'athleticos';

  return String(configuredSlug).trim().toLowerCase();
}

module.exports = () => {
  const schoolSlug = getConfiguredSchoolSlug();
  const schoolConfig = SCHOOL_CONFIGS[schoolSlug] || {};
  const baseExpoConfig = appJson.expo || {};
  const splashBackgroundColor = '#000000';
  const plugins = (baseExpoConfig.plugins || []).map((plugin) => {
    if (Array.isArray(plugin) && plugin[0] === 'expo-splash-screen') {
      return [
        plugin[0],
        {
          resizeMode: 'contain',
          backgroundColor: splashBackgroundColor,
        },
      ];
    }

    return plugin;
  });

  return {
    ...baseExpoConfig,
    name: schoolConfig.name || baseExpoConfig.name,
    icon: schoolConfig.icon || baseExpoConfig.icon,
    splash: {
      backgroundColor: splashBackgroundColor,
      resizeMode: 'contain',
    },
    ios: {
      ...(baseExpoConfig.ios || {}),
      bundleIdentifier:
        schoolConfig.iosBundleIdentifier ||
        baseExpoConfig.ios?.bundleIdentifier,
      infoPlist: {
        ...(baseExpoConfig.ios?.infoPlist || {}),
        CFBundleDisplayName:
          schoolConfig.name ||
          baseExpoConfig.ios?.infoPlist?.CFBundleDisplayName ||
          baseExpoConfig.name,
      },
    },
    plugins,
    extra: {
      ...(baseExpoConfig.extra || {}),
      schoolSlug,
    },
  };
};
