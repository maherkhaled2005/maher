const { withDangerousMod } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

const DARK_BG = '#070A0F';
const GOLD = '#D4AF37';

const stylesContent = `<resources xmlns:tools="http://schemas.android.com/tools">
  <style name="AppTheme" parent="Theme.AppCompat.DayNight.NoActionBar">
    <item name="android:windowBackground">${DARK_BG}</item>
    <item name="android:editTextBackground">@drawable/rn_edit_text_material</item>
    <item name="colorPrimary">@color/colorPrimary</item>
    <item name="android:statusBarColor">${DARK_BG}</item>
    <item name="android:navigationBarColor">${DARK_BG}</item>
  </style>
  <style name="Theme.App.SplashScreen" parent="AppTheme">
    <item name="android:windowBackground">@drawable/splashscreen</item>
    <item name="android:statusBarColor">${DARK_BG}</item>
    <item name="android:navigationBarColor">${DARK_BG}</item>
    <item name="android:windowSplashScreenBackground" tools:targetApi="31">${DARK_BG}</item>
    <item name="android:windowSplashScreenAnimatedIcon" tools:targetApi="31">@drawable/splashscreen_logo</item>
    <item name="android:windowSplashScreenIconBackgroundColor" tools:targetApi="31">${DARK_BG}</item>
  </style>
</resources>
`;

const stylesV31Content = `<?xml version="1.0" encoding="utf-8"?>
<resources>
  <style name="AppTheme" parent="Theme.AppCompat.DayNight.NoActionBar">
    <item name="android:windowBackground">${DARK_BG}</item>
    <item name="android:editTextBackground">@drawable/rn_edit_text_material</item>
    <item name="colorPrimary">@color/colorPrimary</item>
    <item name="android:statusBarColor">${DARK_BG}</item>
    <item name="android:navigationBarColor">${DARK_BG}</item>
  </style>
  <style name="Theme.App.SplashScreen" parent="AppTheme">
    <item name="android:windowBackground">@drawable/splashscreen</item>
    <item name="android:statusBarColor">${DARK_BG}</item>
    <item name="android:navigationBarColor">${DARK_BG}</item>
    <item name="android:windowSplashScreenBackground">${DARK_BG}</item>
    <item name="android:windowSplashScreenAnimatedIcon">@drawable/splashscreen_logo</item>
    <item name="android:windowSplashScreenIconBackgroundColor">${DARK_BG}</item>
  </style>
</resources>
`;

const colorsContent = `<resources>
  <color name="splashscreen_background">${DARK_BG}</color>
  <color name="iconBackground">${DARK_BG}</color>
  <color name="colorPrimary">${GOLD}</color>
</resources>
`;

const adaptiveIconXml = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/iconBackground"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>
`;

function withDarkSplash(config) {
  return withDangerousMod(config, [
    'android',
    async (cfg) => {
      const resDir = path.join(cfg.modRequest.platformProjectRoot, 'app', 'src', 'main', 'res');

      // 1. values/styles.xml
      const valuesDir = path.join(resDir, 'values');
      if (!fs.existsSync(valuesDir)) fs.mkdirSync(valuesDir, { recursive: true });
      fs.writeFileSync(path.join(valuesDir, 'styles.xml'), stylesContent, 'utf8');
      fs.writeFileSync(path.join(valuesDir, 'colors.xml'), colorsContent, 'utf8');

      // 2. values-v31/styles.xml
      const v31Dir = path.join(resDir, 'values-v31');
      if (!fs.existsSync(v31Dir)) fs.mkdirSync(v31Dir, { recursive: true });
      fs.writeFileSync(path.join(v31Dir, 'styles.xml'), stylesV31Content, 'utf8');

      // 3. values-night/styles.xml & colors.xml
      const nightDir = path.join(resDir, 'values-night');
      if (!fs.existsSync(nightDir)) fs.mkdirSync(nightDir, { recursive: true });
      fs.writeFileSync(path.join(nightDir, 'styles.xml'), stylesContent, 'utf8');
      fs.writeFileSync(path.join(nightDir, 'colors.xml'), colorsContent, 'utf8');

      // 4. mipmap-anydpi-v26/
      const anydpiDir = path.join(resDir, 'mipmap-anydpi-v26');
      if (fs.existsSync(anydpiDir)) {
        fs.writeFileSync(path.join(anydpiDir, 'ic_launcher.xml'), adaptiveIconXml, 'utf8');
        fs.writeFileSync(path.join(anydpiDir, 'ic_launcher_round.xml'), adaptiveIconXml, 'utf8');
      }

      // 5. Remove any obsolete .webp icons from mipmap folders
      const mipmapFolders = ['mipmap-mdpi', 'mipmap-hdpi', 'mipmap-xhdpi', 'mipmap-xxhdpi', 'mipmap-xxxhdpi'];
      mipmapFolders.forEach((folder) => {
        const targetDir = path.join(resDir, folder);
        if (fs.existsSync(targetDir)) {
          const files = fs.readdirSync(targetDir);
          files.forEach((file) => {
            if (file.endsWith('.webp')) {
              try { fs.unlinkSync(path.join(targetDir, file)); } catch (e) {}
            }
          });
        }
      });

      return cfg;
    },
  ]);
}

module.exports = withDarkSplash;
