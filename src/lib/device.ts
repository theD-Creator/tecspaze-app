import { Platform } from 'react-native';

/** Phone or tablet browser (has GPS). Desktop browsers only guess the location from Wi-Fi/IP. */
function isMobileBrowser(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent ?? '';
  if (/android|iphone|ipad|ipod|mobile/i.test(ua)) return true;
  // iPadOS reports itself as a Mac
  return navigator.platform === 'MacIntel' && (navigator.maxTouchPoints ?? 0) > 1;
}

/**
 * Whether this device may track location. Desktop browsers don't: their inaccurate fix
 * would report "outside" and end the session the phone is recording.
 */
export const CAN_TRACK = Platform.OS !== 'web' || isMobileBrowser();
