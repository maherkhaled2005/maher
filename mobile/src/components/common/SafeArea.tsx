/**
 * SafeArea wrapper for TecnoRexa.
 * React Native's built-in SafeAreaView is a no-op on Android, which made every
 * screen render under the status bar / notch. This re-exports the real
 * safe-area implementation so all screens behave on phone, tablet and desktop.
 */
export {
  SafeAreaView,
  useSafeAreaInsets,
  SafeAreaProvider,
  SafeAreaInsetsContext,
} from "react-native-safe-area-context";
