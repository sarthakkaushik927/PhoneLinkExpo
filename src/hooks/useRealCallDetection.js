/**
 * src/hooks/useRealCallDetection.js
 * ==================================
 * Hooks into the native PhoneStateModule to detect real Android phone calls
 * and forward them over the WebSocket bridge to the Python desktop server.
 *
 * Requirements:
 *   - Only runs on Android (Platform.OS === 'android').
 *   - Requires READ_PHONE_STATE, READ_CALL_LOG, PROCESS_OUTGOING_CALLS
 *     permissions granted at runtime.
 *   - The React Native bridge (PhoneStateModule) must be compiled into the
 *     app — i.e., the app was built with `npx expo run:android`, NOT loaded
 *     via Expo Go's prebuilt runtime.
 *
 * Events emitted from native:
 *   onIncomingCall  (string) — phone number of caller
 *   onOutgoingCall  (string) — phone number being dialled
 *   onCallEnded     (void)   — call terminated
 *
 * WS payloads sent to server:
 *   { "event": "incoming_call", "caller":  "<number>" }
 *   { "event": "outgoing_call", "callee":  "<number>" }
 *   { "event": "call_ended" }
 *
 * @param {{ addLog: (msg: string) => void, sendMessage: (payload: object) => boolean }} opts
 * @returns {{ callState: string, permissionGranted: boolean }}
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  NativeEventEmitter,
  NativeModules,
  PermissionsAndroid,
  Platform,
} from 'react-native';

const { PhoneStateModule } = NativeModules;

/** @enum {string} Human-readable labels for the live call state indicator. */
export const CALL_STATE = Object.freeze({
  IDLE:        'Idle',
  RINGING:     '📲  Ringing…',
  DIALING:     '📤  Dialing Out…',
  ACTIVE:      '📞  Call Active',
});

/** Attempt to grant all required permissions. Returns true if all granted. */
async function requestPhonePermissions() {
  if (Platform.OS !== 'android') return false;

  try {
    const statuses = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE,
      PermissionsAndroid.PERMISSIONS.READ_CALL_LOG,
      PermissionsAndroid.PERMISSIONS.PROCESS_OUTGOING_CALLS,
    ]);

    return Object.values(statuses).every(
      s => s === PermissionsAndroid.RESULTS.GRANTED
    );
  } catch (err) {
    console.error('[useRealCallDetection] Permission request failed:', err);
    return false;
  }
}

export function useRealCallDetection({ addLog, sendMessage } = {}) {
  const [callState,        setCallState]        = useState(CALL_STATE.IDLE);
  const [permissionGranted, setPermissionGranted] = useState(false);

  const log     = useCallback(msg => addLog?.(msg), [addLog]);
  const send    = useCallback(p   => sendMessage?.(p), [sendMessage]);

  // Guard: module not compiled (Expo Go runtime without native build)
  const moduleAvailable = useRef(Boolean(PhoneStateModule)).current;

  useEffect(() => {
    if (Platform.OS !== 'android') {
      log('⚠️  Call detection is Android-only.');
      return;
    }

    if (!moduleAvailable) {
      log('⚠️  PhoneStateModule not found. Build via: npx expo run:android');
      return;
    }

    let emitter;
    let subscriptions = [];

    async function setup() {
      const granted = await requestPhonePermissions();
      setPermissionGranted(granted);

      if (!granted) {
        log('❌  Phone permissions denied — real call detection disabled.');
        return;
      }

      log('✅  Phone permissions granted. Listening for real calls…');
      PhoneStateModule.startListening();

      emitter = new NativeEventEmitter(PhoneStateModule);

      subscriptions = [

        // ── Incoming call ──────────────────────────────────────────────────
        emitter.addListener('onIncomingCall', (number) => {
          setCallState(CALL_STATE.RINGING);
          log(`📲  Incoming call from ${number}`);
          send({ event: 'incoming_call', caller: number });
        }),

        // ── Outgoing call ──────────────────────────────────────────────────
        emitter.addListener('onOutgoingCall', (number) => {
          setCallState(CALL_STATE.DIALING);
          log(`📤  Outgoing call to ${number}`);
          send({ event: 'outgoing_call', callee: number });
        }),

        // ── Call ended ────────────────────────────────────────────────────
        emitter.addListener('onCallEnded', () => {
          setCallState(CALL_STATE.IDLE);
          log('📵  Call ended');
          send({ event: 'call_ended' });
        }),
      ];
    }

    setup();

    return () => {
      subscriptions.forEach(s => s.remove());
      PhoneStateModule?.stopListening();
    };
  }, []); // One-time setup — stable refs ensure no stale closures.

  return { callState, permissionGranted, moduleAvailable };
}
