import { useEffect, useState } from "react";
import { Keyboard, Platform } from "react-native";

/**
 * Reliable keyboard height for Android/iOS.
 *
 * `adjustResize` in the manifest is not enough once Android draws edge-to-edge
 * (Android 15+), so the chat input used to stay buried under the keyboard.
 * Reading the keyboard frame directly and applying it as bottom padding is
 * predictable on every device.
 *
 * Returns 0 when the keyboard is closed, and the visible keyboard height
 * (minus the navigation bar inset) when it is open.
 */
export function useKeyboardHeight(navigationBarInset = 0): number {
  const [height, setHeight] = useState(0);

  useEffect(() => {
    // iOS tells us the overlap; Android only tells us the frame.
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const onShow = (e: any) => {
      const raw = e?.endCoordinates?.height ?? 0;
      setHeight(
        Math.max(0, raw - (Platform.OS === "ios" ? 0 : navigationBarInset)),
      );
    };
    const onHide = () => setHeight(0);

    const showSub = Keyboard.addListener(showEvent as any, onShow);
    const hideSub = Keyboard.addListener(hideEvent as any, onHide);

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [navigationBarInset]);

  return height;
}

export default useKeyboardHeight;
