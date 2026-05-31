const { withAndroidManifest, withMainApplication, withDangerousMod, withProjectBuildGradle } = require('@expo/config-plugins');
const path = require('path');
const fs = require('fs');

/**
 * Expo Config Plugin to automate Shistu Android Widgets integration.
 */
const withAndroidWidgets = (config) => {
  // 1. Modify AndroidManifest.xml
  config = withAndroidManifest(config, (config) => {
    const mainApplication = config.modResults.manifest.application[0];

    // Add WidgetProvider
    if (!mainApplication.receiver) mainApplication.receiver = [];
    if (!mainApplication.receiver.find(r => r.$['android:name'] === '.HabitWidgetProvider')) {
      mainApplication.receiver.push({
        $: {
          'android:name': '.HabitWidgetProvider',
          'android:exported': 'true',
        },
        'intent-filter': [{
          action: [{ $: { 'android:name': 'android.appwidget.action.APPWIDGET_UPDATE' } }]
        }],
        'meta-data': [{
          $: {
            'android:name': 'android.appwidget.provider',
            'android:resource': '@xml/habit_widget_info'
          }
        }]
      });
    }

    // Add HabitLogReceiver
    if (!mainApplication.receiver.find(r => r.$['android:name'] === '.HabitLogReceiver')) {
      mainApplication.receiver.push({
        $: {
          'android:name': '.HabitLogReceiver',
          'android:exported': 'true',
        }
      });
    }

    // Add HabitWidgetService
    if (!mainApplication.service) mainApplication.service = [];
    if (!mainApplication.service.find(s => s.$['android:name'] === '.HabitWidgetService')) {
      mainApplication.service.push({
        $: {
          'android:name': '.HabitWidgetService',
          'android:permission': 'android.permission.BIND_REMOTEVIEWS',
          'android:exported': 'false'
        }
      });
    }

    // Add ShistuContentProvider
    if (!mainApplication.provider) mainApplication.provider = [];
    if (!mainApplication.provider.find(p => p.$['android:name'] === '.ShistuContentProvider')) {
      mainApplication.provider.push({
        $: {
          'android:name': '.ShistuContentProvider',
          'android:authorities': 'com.basecamplogic.shistu.provider',
          'android:exported': 'true'
        }
      });
    }

    return config;
  });

  // 2. Modify MainApplication.kt
  config = withMainApplication(config, (config) => {
    if (config.modResults.language === 'kt') {
      let content = config.modResults.contents;
      
      // Add import if missing
      if (!content.includes('import com.facebook.react.ReactPackage')) {
          // This is a safety check, usually it's there
      }

      // Add WidgetSyncPackage to getPackages
      if (!content.includes('packages.add(WidgetSyncPackage())')) {
        content = content.replace(
          /val packages = PackageList\(this\)\.packages/,
          'val packages = PackageList(this).packages\n            packages.add(WidgetSyncPackage())'
        );
      }
      config.modResults.contents = content;
    }
    return config;
  });

  // 3. Copy Native Files (Dangerous Mod)
  config = withDangerousMod(config, [
    'android',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const packagePath = 'com/basecamplogic/shistu';
      const javaTargetDir = path.join(projectRoot, 'android/app/src/main/java', packagePath);
      const resTargetDir = path.join(projectRoot, 'android/app/src/main/res');

      const sourceDir = path.join(projectRoot, 'native-widgets/android');

      // Ensure target directories exist
      fs.mkdirSync(javaTargetDir, { recursive: true });
      fs.mkdirSync(path.join(resTargetDir, 'layout'), { recursive: true });
      fs.mkdirSync(path.join(resTargetDir, 'xml'), { recursive: true });

      // Copy Java/Kotlin files
      const javaFiles = fs.readdirSync(path.join(sourceDir, 'java'));
      javaFiles.forEach(file => {
        fs.copyFileSync(
          path.join(sourceDir, 'java', file),
          path.join(javaTargetDir, file)
        );
      });

      // Copy Resource files
      const layoutFiles = fs.readdirSync(path.join(sourceDir, 'res/layout'));
      layoutFiles.forEach(file => {
        fs.copyFileSync(
          path.join(sourceDir, 'res/layout', file),
          path.join(resTargetDir, 'layout', file)
        );
      });

      const xmlFiles = fs.readdirSync(path.join(sourceDir, 'res/xml'));
      xmlFiles.forEach(file => {
        fs.copyFileSync(
          path.join(sourceDir, 'res/xml', file),
          path.join(resTargetDir, 'xml', file)
        );
      });

      return config;
    },
  ]);

  return config;
};

module.exports = withAndroidWidgets;
