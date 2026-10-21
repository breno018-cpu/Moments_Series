/**
 * Helper para feedback tátil / háptico nativo em smartphones (Android/PWA)
 * e navegadores móveis suportados.
 */
export type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'selection';

export function triggerHaptic(type: HapticType = 'light') {
  if (typeof window === 'undefined' || !('vibrate' in navigator)) return;

  try {
    switch (type) {
      case 'selection':
      case 'light':
        navigator.vibrate(12);
        break;
      case 'medium':
        navigator.vibrate(25);
        break;
      case 'heavy':
        navigator.vibrate(45);
        break;
      case 'success':
        navigator.vibrate([15, 40, 25]);
        break;
      case 'warning':
        navigator.vibrate([30, 50, 30, 50]);
        break;
      default:
        navigator.vibrate(15);
    }
  } catch {}
}
