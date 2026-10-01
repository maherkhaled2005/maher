import { registerRootComponent } from 'expo';
import { Text, TextInput, Platform } from 'react-native';
import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);



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
