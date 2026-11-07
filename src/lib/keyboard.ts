import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Keyboard,
  Platform,
  TextInput,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ScrollViewInstance,
} from 'react-native';

// Android (SDK 58) is always edge-to-edge: the window no longer shrinks for the keyboard and
// KeyboardAvoidingView has nothing to work with. So the screen pads itself by the keyboard
// height and scrolls the focused field above the keyboard – JS only, works via live update.

let keyboardTop: number | null = null;
let activeReveal: (() => void) | null = null;

/** Call from an input's onFocus so switching fields while the keyboard is open also scrolls. */
export function revealFocusedInput() {
  if (keyboardTop !== null) setTimeout(() => activeReveal?.(), 60);
}

export function useKeyboardAwareScroll() {
  const scrollRef = useRef<ScrollViewInstance>(null);
  const offset = useRef(0);
  const [height, setHeight] = useState(0);

  const reveal = useCallback(() => {
    const top = keyboardTop;
    const input = TextInput.State.currentlyFocusedInput();
    if (top === null || !input || !scrollRef.current) return;
    input.measureInWindow((_x, y, _w, h) => {
      const overlap = y + h + 28 - top;
      if (overlap > 0) scrollRef.current?.scrollTo({ y: offset.current + overlap, animated: true });
    });
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    const ios = Platform.OS === 'ios';
    const show = Keyboard.addListener(ios ? 'keyboardWillShow' : 'keyboardDidShow', (e) => {
      keyboardTop = e.endCoordinates.screenY;
      setHeight(e.endCoordinates.height);
      setTimeout(reveal, ios ? 280 : 80);
    });
    const hide = Keyboard.addListener(ios ? 'keyboardWillHide' : 'keyboardDidHide', () => {
      keyboardTop = null;
      setHeight(0);
    });
    activeReveal = reveal;
    return () => {
      show.remove();
      hide.remove();
      if (activeReveal === reveal) activeReveal = null;
    };
  }, [reveal]);

  const onScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    offset.current = e.nativeEvent.contentOffset.y;
  }, []);

  // iOS screens already use KeyboardAvoidingView; only Android needs the extra room
  return { scrollRef, onScroll, extraBottom: Platform.OS === 'android' ? height : 0 };
}
