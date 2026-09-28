import { registerRootComponent } from 'expo';
import { Text, TextInput, Platform } from 'react-native';
import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);

/* ==========================================================================
   GLOBAL TEXT SCALING LOCK
   Phones with a large system "Display size / Font size" were blowing the whole
   layout up: giant text, overflowing rows, unreadable chat. Clamp the scale so
   the UI stays exactly as designed on every phone, tablet and desktop.
   ========================================================================== */
const MAX_FONT_MULTIPLIER = 1.15;
const MIN_FONT_MULTIPLIER = 0.9;

(Text as any).defaultProps = {
  ...(Text as any).defaultProps,
  maxFontSizeMultiplier: MAX_FONT_MULTIPLIER,
  allowFontScaling: true,
};
(TextInput as any).defaultProps = {
  ...(TextInput as any).defaultProps,
  maxFontSizeMultiplier: MAX_FONT_MULTIPLIER,
  allowFontScaling: true,
};
void MIN_FONT_MULTIPLIER;

// On web, neutralize browser font inflation (iOS Safari / Chrome Android)
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    html { font-size: 16px !important; }
    *, *::before, *::after {
      -webkit-text-size-adjust: 100% !important;
      text-size-adjust: 100% !important;
    }
    input, textarea, select, button { font-size: 16px !important; }
  `;
  document.head.appendChild(style);
}
