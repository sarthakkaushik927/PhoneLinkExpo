/**
 * src/hooks/useCallControl.js
 * ===========================
 * Wraps the native CallControlModule to let JS answer, reject,
 * dial, and hang up calls directly on Android.
 *
 * Handles runtime permission requests for dangerous permissions:
 *   CALL_PHONE        → required before dialing
 *   ANSWER_PHONE_CALLS → required before answering (API 26+)
 *
 * Usage:
 *   const { answerCall, rejectCall, dialCall, hangupCall } = useCallControl();
 */

import { useCallback } from 'react';
import { NativeModules, Platform, Alert, PermissionsAndroid } from 'react-native';

const { CallControlModule } = NativeModules;

function notSupported(action) {
  Alert.alert('Not supported', `${action} requires the native build (npx expo run:android).`);
}

/** Request a single dangerous permission. Returns true if granted. */
async function requestPermission(permission) {
  if (Platform.OS !== 'android') return true;
  try {
    const result = await PermissionsAndroid.request(permission);
    return result === PermissionsAndroid.RESULTS.GRANTED;
  } catch {
    return false;
  }
}

export function useCallControl() {
  const answerCall = useCallback(async () => {
    if (!CallControlModule) return notSupported('answerCall');
    // Request ANSWER_PHONE_CALLS at runtime (API 26+ dangerous permission)
    if (Platform.Version >= 26) {
      const granted = await requestPermission(
        PermissionsAndroid.PERMISSIONS.ANSWER_PHONE_CALLS
      );
      if (!granted) {
        Alert.alert('Permission denied', 'ANSWER_PHONE_CALLS permission is required to answer calls.');
        return;
      }
    }
    try {
      const result = await CallControlModule.answerCall();
      console.log('[CallControl] answerCall:', result);
    } catch (e) {
      console.error('[CallControl] answerCall error:', e.message);
    }
  }, []);

  const rejectCall = useCallback(async () => {
    if (!CallControlModule) return notSupported('rejectCall');
    if (Platform.Version >= 26) {
      const granted = await requestPermission(PermissionsAndroid.PERMISSIONS.ANSWER_PHONE_CALLS);
      if (!granted) {
        Alert.alert(
          'Permission Required',
          'Grant "Make and manage phone calls" permission to allow rejecting calls.\n\nGo to: Settings → Apps → PhoneLinkExpo → Permissions → Phone → Allow',
          [{ text: 'OK' }]
        );
        return;
      }
    }
    try {
      const result = await CallControlModule.rejectCall();
      console.log('[CallControl] rejectCall:', result);
    } catch (e) {
      console.error('[CallControl] rejectCall error:', e.message);
    }
  }, []);

  const dialCall = useCallback(async (number) => {
    if (!CallControlModule) return notSupported('dialCall');
    // Request CALL_PHONE at runtime before dialing (dangerous permission)
    const granted = await requestPermission(PermissionsAndroid.PERMISSIONS.CALL_PHONE);
    if (!granted) {
      Alert.alert('Permission denied', 'CALL_PHONE permission is required to make calls.');
      return;
    }
    try {
      const result = await CallControlModule.dialCall(number);
      console.log('[CallControl] dialCall:', result);
    } catch (e) {
      console.error('[CallControl] dialCall error:', e.message);
    }
  }, []);

  const hangupCall = useCallback(async () => {
    if (!CallControlModule) return notSupported('hangupCall');
    if (Platform.Version >= 26) {
      const granted = await requestPermission(PermissionsAndroid.PERMISSIONS.ANSWER_PHONE_CALLS);
      if (!granted) {
        Alert.alert(
          'Permission Required',
          'Grant "Make and manage phone calls" permission to allow ending calls.\n\nGo to: Settings → Apps → PhoneLinkExpo → Permissions → Phone → Allow',
          [{ text: 'OK' }]
        );
        return;
      }
    }
    try {
      const result = await CallControlModule.hangupCall();
      console.log('[CallControl] hangupCall:', result);
    } catch (e) {
      console.error('[CallControl] hangupCall error:', e.message);
    }
  }, []);

  return { answerCall, rejectCall, dialCall, hangupCall };
}
