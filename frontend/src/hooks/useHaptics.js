import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { useAuth } from './useAuth';

const isNative = typeof window !== 'undefined' && window.Capacitor?.isNativePlatform();

export function useHaptics() {
  const { profile } = useAuth();
  const enabled = profile?.haptics_enabled !== false; // default true

  const trigger = async (action) => {
    if (!isNative || !enabled) return;
    try {
      await action();
    } catch (error) {
      console.warn('Haptics failed:', error);
    }
  };

  return {
    lightTap: () => trigger(() => Haptics.impact({ style: ImpactStyle.Light })),
    mediumTap: () => trigger(() => Haptics.impact({ style: ImpactStyle.Medium })),
    heavyTap: () => trigger(() => Haptics.impact({ style: ImpactStyle.Heavy })),
    success: () => trigger(() => Haptics.notification({ type: NotificationType.Success })),
    error: () => trigger(() => Haptics.notification({ type: NotificationType.Error })),
    warning: () => trigger(() => Haptics.notification({ type: NotificationType.Warning })),
  };
}
