/**
 * src/screens/HomeScreen/index.jsx
 * =================================
 * Full call control: accept, reject, dial from PC or phone.
 *
 * Server commands handled:
 *   accept_call  → answers the ringing call on the phone
 *   reject_call  → rejects the ringing call
 *   dial         → dials a number from the phone (payload: { action:'dial', number:'...' })
 *   hangup       → ends the active call
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  Vibration,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useSocket }                          from '../../hooks/useSocket';
import { useActivityLog }                     from '../../hooks/useActivityLog';
import { useRealCallDetection, CALL_STATE }   from '../../hooks/useRealCallDetection';
import { useCallControl }                     from '../../hooks/useCallControl';
import { useAudioRoute, AUDIO_ROUTE }         from '../../hooks/useAudioRoute';
import StatusCard                             from '../../components/bridge/StatusCard';
import AppButton                              from '../../components/common/AppButton';
import ActivityLog                            from '../../components/common/ActivityLog';
import COLORS                                 from '../../constants/colors';
import styles                                 from './HomeScreen.styles';

// ── Call state colour map ────────────────────────────────────────────────────
const CALL_STATE_COLOR = {
  [CALL_STATE.IDLE]:    COLORS.textMuted,
  [CALL_STATE.RINGING]: '#FF6B35',
  [CALL_STATE.DIALING]: '#4A9EFF',
  [CALL_STATE.ACTIVE]:  '#4CAF50',
};

export default function HomeScreen() {
  const {
    status, lastCommand,
    connect, disconnect,
    simulateIncomingCall, sendMessage,
    isConnected, isConnecting, isDisconnected,
    serverIp, wsUrl,
  } = useSocket();

  const { logLines, addLog } = useActivityLog();

  const [callPending,  setCallPending]  = useState(false);
  // ringing = incoming call is active on phone (not yet answered/rejected)
  const [isRinging,    setIsRinging]    = useState(false);
  // inCall = call is active (answered)
  const [isInCall,     setIsInCall]     = useState(false);
  const [callerNumber, setCallerNumber] = useState('');

  const { callState, permissionGranted, moduleAvailable } = useRealCallDetection({
    addLog,
    sendMessage,
  });

  const { answerCall, rejectCall, dialCall, hangupCall } = useCallControl();
  const { route, routeToBluetooth, routeToEarpiece, routeToSpeaker, stopAudio } = useAudioRoute();

  // ── Track call state from native events ────────────────────────────────────
  useEffect(() => {
    if (callState === CALL_STATE.RINGING) {
      setIsRinging(true);
      setIsInCall(false);
      Vibration.vibrate([0, 500, 300, 500, 300, 500], true);
    } else if (callState === CALL_STATE.ACTIVE) {
      setIsRinging(false);
      setIsInCall(true);
      Vibration.cancel();
    } else if (callState === CALL_STATE.IDLE) {
      setIsRinging(false);
      setIsInCall(false);
      setCallerNumber('');
      Vibration.cancel();
    } else if (callState === CALL_STATE.DIALING) {
      setIsRinging(false);
      setIsInCall(true);
    }
  }, [callState]);

  // ── Track status changes ────────────────────────────────────────────────────
  const prevStatus = useRef(status);
  useEffect(() => {
    if (prevStatus.current !== status) {
      addLog(`🔄  Status → ${status}`);
      prevStatus.current = status;
    }
  }, [status, addLog]);

  // ── Handle server commands ─────────────────────────────────────────────────
  const prevCommand = useRef(null);
  useEffect(() => {
    if (!lastCommand || lastCommand === prevCommand.current) return;
    prevCommand.current = lastCommand;

    addLog(`📨  PC → ${JSON.stringify(lastCommand)}`);

    switch (lastCommand.action) {
      case 'accept_call':
        setCallPending(false);
        addLog('✅  PC accepted the call — answering…');
        Vibration.cancel();
        answerCall();
        // Auto-route audio to Bluetooth so you hear it on the laptop
        setTimeout(() => routeToBluetooth(), 1500);
        break;

      case 'reject_call':
        setCallPending(false);
        addLog('❌  PC rejected the call — rejecting…');
        Vibration.cancel();
        rejectCall();
        break;

      case 'dial':
        if (lastCommand.number) {
          addLog(`📤  PC dialing: ${lastCommand.number}`);
          dialCall(lastCommand.number);
        }
        break;

      case 'hangup':
        addLog('📵  PC ended the call — hanging up…');
        hangupCall();
        break;

      case 'set_audio_route':
        addLog(`🔊  PC requested audio route: ${lastCommand.route}`);
        if (lastCommand.route === 'bluetooth') routeToBluetooth();
        else if (lastCommand.route === 'earpiece') routeToEarpiece();
        else if (lastCommand.route === 'speaker') routeToSpeaker();
        break;

      default:
        break;
    }
  }, [lastCommand, addLog, answerCall, rejectCall, dialCall, hangupCall, routeToBluetooth, routeToEarpiece, routeToSpeaker]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleConnect    = () => { addLog('Connecting…'); connect(); };
  const handleDisconnect = () => { addLog('Disconnecting…'); disconnect(); setCallPending(false); };

  const handleSimulateCall = () => {
    const sent = simulateIncomingCall();
    if (sent) {
      setCallPending(true);
      addLog('📤  Sent: incoming_call (simulated)');
    } else {
      addLog('❌  Not connected.');
    }
  };

  // Phone-side answer button
  const handlePhoneAnswer = () => {
    addLog('📞  Answered on phone');
    sendMessage({ event: 'call_answered' });
    answerCall();
    // Start Bluetooth SCO so audio goes to laptop
    setTimeout(() => routeToBluetooth(), 1500);
  };

  // Phone-side reject button
  const handlePhoneReject = () => {
    addLog('❌  Rejected on phone');
    sendMessage({ event: 'call_rejected' });
    rejectCall();
    setIsRinging(false);
  };

  // Phone-side hangup button
  const handlePhoneHangup = () => {
    addLog('📵  Hung up on phone');
    sendMessage({ event: 'call_ended' });
    hangupCall();
    stopAudio();
    setIsInCall(false);
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Bridge status ───────────────────────────────────────────── */}
        <StatusCard
          connectionStatus={status}
          lastCommand={lastCommand}
          serverIp={wsUrl || serverIp}
        />

        {/* ── Live Call State banner ──────────────────────────────────── */}
        <View style={liveStyles.banner}>
          <View style={liveStyles.row}>
            <Text style={liveStyles.label}>📡  Live Call State</Text>
            <View style={[
              liveStyles.badge,
              { borderColor: CALL_STATE_COLOR[callState] ?? COLORS.textMuted }
            ]}>
              <Text style={[
                liveStyles.badgeText,
                { color: CALL_STATE_COLOR[callState] ?? COLORS.textMuted }
              ]}>
                {callState}
              </Text>
            </View>
          </View>
          <Text style={liveStyles.subtext}>
            {!moduleAvailable
              ? '⚠️  Native module not loaded'
              : permissionGranted
                ? '✅  Real call events active'
                : '⏳  Requesting permissions…'}
          </Text>
        </View>

        {/* ── INCOMING CALL PANEL (shown when phone is ringing) ──────── */}
        {isRinging && (
          <View style={callPanel.container}>
            <Text style={callPanel.emoji}>📲</Text>
            <Text style={callPanel.title}>Incoming Call</Text>
            {callerNumber ? (
              <Text style={callPanel.number}>{callerNumber}</Text>
            ) : null}
            <Text style={callPanel.hint}>Answer or reject from here or from your PC</Text>
            <View style={callPanel.btnRow}>
              <TouchableOpacity
                style={[callPanel.btn, callPanel.acceptBtn]}
                onPress={handlePhoneAnswer}
              >
                <Text style={callPanel.btnText}>✅  Answer</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[callPanel.btn, callPanel.rejectBtn]}
                onPress={handlePhoneReject}
              >
                <Text style={callPanel.btnText}>❌  Reject</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ── ACTIVE CALL PANEL ──────────────────────────────────── */}
        {isInCall && !isRinging && (
          <View style={callPanel.activeContainer}>
            <Text style={callPanel.emoji}>📞</Text>
            <Text style={callPanel.title}>Call Active</Text>

            {/* Audio route buttons */}
            <View style={audioStyles.row}>
              <TouchableOpacity
                style={[audioStyles.btn, route === AUDIO_ROUTE.BLUETOOTH && audioStyles.active]}
                onPress={routeToBluetooth}
              >
                <Text style={audioStyles.btnText}>🖥️ Laptop</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[audioStyles.btn, route === AUDIO_ROUTE.EARPIECE && audioStyles.active]}
                onPress={routeToEarpiece}
              >
                <Text style={audioStyles.btnText}>📱 Earpiece</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[audioStyles.btn, route === AUDIO_ROUTE.SPEAKER && audioStyles.active]}
                onPress={routeToSpeaker}
              >
                <Text style={audioStyles.btnText}>🔊 Speaker</Text>
              </TouchableOpacity>
            </View>

            <Text style={callPanel.hint}>
              {route === AUDIO_ROUTE.BLUETOOTH
                ? '🖥️ Audio → Laptop (Bluetooth HFP)'
                : route === AUDIO_ROUTE.SPEAKER
                ? '🔊 Audio → Phone speaker'
                : '📱 Audio → Earpiece'}
            </Text>

            <TouchableOpacity
              style={[callPanel.btn, callPanel.hangupBtn]}
              onPress={handlePhoneHangup}
            >
              <Text style={callPanel.btnText}>📵  Hang Up</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Connect / Disconnect ────────────────────────────────────── */}
        <View style={styles.controlRow}>
          <AppButton
            label={isConnecting ? '⏳  Connecting…' : '🔗  Connect'}
            onPress={handleConnect}
            disabled={isConnected || isConnecting}
            variant="primary"
            style={styles.flex1}
          />
          <AppButton
            label="⛔  Disconnect"
            onPress={handleDisconnect}
            disabled={isDisconnected}
            variant="danger"
            style={styles.flex1}
          />
        </View>

        {/* ── Simulate (test without real call) ──────────────────────── */}
        <AppButton
          label={callPending ? '📲  Awaiting PC Response…' : '🧪  Simulate Incoming Call'}
          sublabel={isConnected ? 'Sends a fake call event to your PC' : 'Connect first'}
          onPress={handleSimulateCall}
          disabled={!isConnected || callPending}
          variant="call"
          style={styles.callBtn}
        />

        {/* ── Activity log ────────────────────────────────────────────── */}
        <ActivityLog lines={logLines} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Live Call State banner styles ─────────────────────────────────────────────
const liveStyles = StyleSheet.create({
  banner: {
    marginHorizontal: 16, marginTop: 12,
    backgroundColor: COLORS.surface,
    borderRadius: 12, borderWidth: 1, borderColor: COLORS.border,
    padding: 14,
  },
  row:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label:     { color: COLORS.textPrimary, fontWeight: '700', fontSize: 14 },
  badge:     { borderWidth: 1, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  subtext:   { color: COLORS.textMuted, fontSize: 12, marginTop: 8 },
});

// ── Call panel styles ─────────────────────────────────────────────────────────
const callPanel = StyleSheet.create({
  container: {
    marginHorizontal: 16, marginTop: 12,
    backgroundColor: '#1a1a2e',
    borderRadius: 16, borderWidth: 2, borderColor: '#FF6B35',
    padding: 20, alignItems: 'center',
  },
  activeContainer: {
    marginHorizontal: 16, marginTop: 12,
    backgroundColor: '#0d2b0d',
    borderRadius: 16, borderWidth: 2, borderColor: '#4CAF50',
    padding: 20, alignItems: 'center',
  },
  emoji:   { fontSize: 40, marginBottom: 8 },
  title:   { color: '#fff', fontWeight: '800', fontSize: 20, marginBottom: 4 },
  number:  { color: '#FF6B35', fontWeight: '600', fontSize: 18, marginBottom: 4 },
  hint:    { color: '#aaa', fontSize: 12, marginBottom: 16, textAlign: 'center' },
  btnRow:  { flexDirection: 'row', gap: 12 },
  btn:     { borderRadius: 12, paddingVertical: 12, paddingHorizontal: 24 },
  acceptBtn: { backgroundColor: '#4CAF50' },
  rejectBtn: { backgroundColor: '#E53935' },
  hangupBtn: { backgroundColor: '#E53935' },
  btnText:   { color: '#fff', fontWeight: '700', fontSize: 15 },
});

// ── Audio route toggle styles ──────────────────────────────────────────────────
const audioStyles = StyleSheet.create({
  row: {
    flexDirection: 'row', gap: 8,
    marginBottom: 12, marginTop: 4,
  },
  btn: {
    borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12,
    backgroundColor: '#1e3a1e', borderWidth: 1, borderColor: '#2d5a2d',
  },
  active: {
    backgroundColor: '#2e7d32', borderColor: '#4CAF50',
  },
  btnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
});

