/**
 * src/hooks/useAudioRoute.js
 * ==========================
 * Wraps AudioRouteModule to switch audio between:
 *   - Bluetooth SCO  (PC or BT headset via HFP)
 *   - Earpiece       (normal phone call mode)
 *   - Speaker        (loudspeaker)
 *
 * Auto-starts Bluetooth SCO when the call is answered so audio
 * flows through the paired PC (if Bluetooth is connected).
 */

import { useCallback, useState } from 'react';
import { NativeModules, Platform, PermissionsAndroid, Alert } from 'react-native';

const { AudioRouteModule } = NativeModules;

export const AUDIO_ROUTE = Object.freeze({
  EARPIECE:   'earpiece',
  SPEAKER:    'speaker',
  BLUETOOTH:  'bluetooth',
  UNKNOWN:    'unknown',
});

export function useAudioRoute() {
  const [route, setRoute] = useState(AUDIO_ROUTE.EARPIECE);

  const routeToBluetooth = useCallback(async () => {
    if (!AudioRouteModule) return;
    
    // Request BLUETOOTH_CONNECT on Android 12+ (API 31)
    if (Platform.OS === 'android' && Platform.Version >= 31) {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert(
            'Permission Required',
            'Grant "Nearby devices" (Bluetooth) permission to route audio to your laptop.\n\nSettings → Apps → PhoneLinkExpo → Permissions → Nearby devices → Allow',
            [{ text: 'OK' }]
          );
          return;
        }
      } catch (err) {
        console.warn('BT permission error:', err);
      }
    }

    try {
      await AudioRouteModule.routeToBluetooth();
      setRoute(AUDIO_ROUTE.BLUETOOTH);
      console.log('[AudioRoute] → Bluetooth SCO');
    } catch (e) {
      console.warn('[AudioRoute] Bluetooth SCO failed:', e.message);
      Alert.alert('Bluetooth Routing Failed', 'Make sure your phone is paired to your laptop and "Hands-Free Telephony" is enabled in Windows Bluetooth settings.');
    }
  }, []);

  const routeToEarpiece = useCallback(async () => {
    if (!AudioRouteModule) return;
    try {
      await AudioRouteModule.routeToEarpiece();
      setRoute(AUDIO_ROUTE.EARPIECE);
      console.log('[AudioRoute] → Earpiece');
    } catch (e) {
      console.warn('[AudioRoute] Earpiece failed:', e.message);
    }
  }, []);

  const routeToSpeaker = useCallback(async () => {
    if (!AudioRouteModule) return;
    try {
      await AudioRouteModule.routeToSpeaker();
      setRoute(AUDIO_ROUTE.SPEAKER);
      console.log('[AudioRoute] → Speaker');
    } catch (e) {
      console.warn('[AudioRoute] Speaker failed:', e.message);
    }
  }, []);

  const stopAudio = useCallback(async () => {
    if (!AudioRouteModule) return;
    try {
      await AudioRouteModule.stopAudio();
      setRoute(AUDIO_ROUTE.EARPIECE);
    } catch (e) {
      console.warn('[AudioRoute] stopAudio failed:', e.message);
    }
  }, []);

  return { route, routeToBluetooth, routeToEarpiece, routeToSpeaker, stopAudio };
}
