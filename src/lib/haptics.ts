/**
 * Haptics Bridge - Cross-platform haptic feedback
 *
 * Per 20_DESIGN_TOKENS.md:
 * - Success: Crisp, short (Transient)
 * - Failure: Heavy, dull (Continuous/Buzz)
 *
 * Web Fallback: Logs to console (doesn't crash on localhost)
 * Mobile: Uses Capacitor Haptics API
 */

import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

const isNative = Capacitor.isNativePlatform();

/**
 * hapticSuccess - Crisp, light feedback for correct answers
 * Mobile: ImpactStyle.Light (short, transient)
 * Web: Console log fallback
 */
export async function hapticSuccess() {
  if (isNative) {
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch (err) {
      console.warn('Haptic feedback unavailable:', err);
    }
  } else {
    // Web fallback - non-blocking
    console.log('[Haptics] ✅ Success (Light Impact)');
  }
}

/**
 * hapticFailure - Heavy, dull feedback for incorrect answers
 * Mobile: NotificationType.Error (heavy, continuous buzz)
 * Web: Console log fallback
 */
export async function hapticFailure() {
  if (isNative) {
    try {
      await Haptics.notification({ type: NotificationType.Error });
    } catch (err) {
      console.warn('Haptic feedback unavailable:', err);
    }
  } else {
    // Web fallback - non-blocking
    console.log('[Haptics] ❌ Failure (Error Notification)');
  }
}

/**
 * hapticSelection - Medium feedback for UI interactions
 * Mobile: ImpactStyle.Medium (button presses, selections)
 * Web: Console log fallback
 */
export async function hapticSelection() {
  if (isNative) {
    try {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } catch (err) {
      console.warn('Haptic feedback unavailable:', err);
    }
  } else {
    // Web fallback - non-blocking
    console.log('[Haptics] 🔘 Selection (Medium Impact)');
  }
}

/**
 * hapticWarning - Distinct feedback for warnings or attention
 * Mobile: NotificationType.Warning (orange/amber events)
 * Web: Console log fallback
 */
export async function hapticWarning() {
  if (isNative) {
    try {
      await Haptics.notification({ type: NotificationType.Warning });
    } catch (err) {
      console.warn('Haptic feedback unavailable:', err);
    }
  } else {
    // Web fallback - non-blocking
    console.log('[Haptics] ⚠️ Warning (Warning Notification)');
  }
}
