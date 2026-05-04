/**
 * src/screens/SettingsScreen/index.jsx
 * ======================================
 * Lets the user set the PC's IP address (and optionally port) at runtime.
 * Values are persisted via AsyncStorage through the useSocket → SocketContext
 * → useServerConfig chain.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useSocket } from '../../hooks/useSocket';
import COLORS from '../../constants/colors';

export default function SettingsScreen({ navigation }) {
  const { serverIp, serverPort, saveConfigManual, configLoading, disconnect, isConnected, isDiscovering } = useSocket();

  const [ipInput,   setIpInput]   = useState(serverIp   || '');
  const [portInput, setPortInput] = useState(serverPort  || '8765');
  const [saving,    setSaving]    = useState(false);

  useEffect(() => {
    if (serverIp) setIpInput(serverIp);
    if (serverPort) setPortInput(serverPort);
  }, [serverIp, serverPort]);

  const isValidIp = (ip) => {
    const parts = ip.trim().split('.');
    return (
      parts.length === 4 &&
      parts.every(p => {
        const n = Number(p);
        return Number.isInteger(n) && n >= 0 && n <= 255;
      })
    );
  };

  const handleSave = async () => {
    if (!isValidIp(ipInput)) {
      Alert.alert('Invalid IP', 'Please enter a valid IPv4 address (e.g. 192.168.1.42)');
      return;
    }
    const portNum = parseInt(portInput, 10);
    if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
      Alert.alert('Invalid Port', 'Port must be between 1 and 65535.');
      return;
    }

    setSaving(true);

    // If already connected, disconnect first so the next connect() uses new URL
    if (isConnected) disconnect();

    const ok = await saveConfigManual(ipInput.trim(), String(portNum));
    setSaving(false);

    if (ok) {
      Alert.alert(
        '✅ Saved',
        `Server set to ${ipInput.trim()}:${portNum}.\nGo back and tap Connect.`,
        [{ text: 'OK', onPress: () => navigation.goBack() }],
      );
    } else {
      Alert.alert('Error', 'Could not save settings. Please try again.');
    }
  };

  if (configLoading) {
    return (
      <View style={s.centered}>
        <ActivityIndicator color={COLORS.connected} />
      </View>
    );
  }

  return (
    <SafeAreaView style={s.safe} edges={['bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={s.flex}
      >
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

          {/* ── Card ─────────────────────────────────────────── */}
          <View style={s.card}>
            <Text style={s.cardTitle}>🖥️  Desktop Server</Text>
            {isDiscovering && (
              <View style={s.discoveringContainer}>
                <ActivityIndicator size="small" color={COLORS.connected} style={s.discoverSpinner} />
                <Text style={s.discoveringText}>Auto-Discovering Server...</Text>
              </View>
            )}
            <Text style={s.hint}>
              Run{' '}
              <Text style={s.code}>ipconfig</Text>
              {' '}(Windows) or{' '}
              <Text style={s.code}>ip addr</Text>
              {' '}(Linux) on your PC and enter the{' '}
              <Text style={s.emphasis}>Wi-Fi IPv4 address</Text>.
            </Text>

            {/* IP input */}
            <Text style={s.label}>PC IP Address</Text>
            <TextInput
              style={s.input}
              value={ipInput}
              onChangeText={setIpInput}
              placeholder="e.g. 192.168.1.42"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="decimal-pad"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
            />

            {/* Port input */}
            <Text style={s.label}>Port</Text>
            <TextInput
              style={s.input}
              value={portInput}
              onChangeText={setPortInput}
              placeholder="8765"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="number-pad"
              returnKeyType="done"
            />

            {/* Resolved URL preview */}
            {ipInput.trim() ? (
              <Text style={s.preview}>
                🔗 {`ws://${ipInput.trim()}:${portInput}`}
              </Text>
            ) : null}

            {/* Save button */}
            <TouchableOpacity
              style={[s.btn, saving && s.btnDisabled]}
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.75}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={s.btnText}>💾  Save & Return</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* ── Info card ────────────────────────────────────── */}
          <View style={s.infoCard}>
            <Text style={s.infoTitle}>How to find your PC's IP</Text>
            <Text style={s.infoLine}>{'1. Connect both devices to the same Wi-Fi.'}</Text>
            <Text style={s.infoLine}>{'2. Windows → open cmd → run: ipconfig'}</Text>
            <Text style={s.infoLine}>{'   Look for "IPv4 Address" under Wi-Fi.'}</Text>
            <Text style={s.infoLine}>{'3. Linux → run: ip addr'}</Text>
            <Text style={s.infoLine}>{'   Look for "inet" on wlan0 / wlp.'}</Text>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  flex:     { flex: 1 },
  safe:     { flex: 1, backgroundColor: COLORS.background },
  scroll:   { padding: 16, paddingBottom: 40 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background },

  card: {
    backgroundColor: COLORS.surface,
    borderRadius:    14,
    borderWidth:     1,
    borderColor:     COLORS.border,
    padding:         18,
    marginBottom:    16,
  },
  cardTitle: {
    color:        COLORS.textPrimary,
    fontSize:     16,
    fontWeight:   '700',
    marginBottom: 8,
  },
  hint: {
    color:        COLORS.textMuted,
    fontSize:     13,
    lineHeight:   20,
    marginBottom: 16,
  },
  code: {
    fontFamily:      Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    backgroundColor: COLORS.background,
    color:           COLORS.textPrimary,
    paddingHorizontal: 4,
    borderRadius:    4,
  },
  emphasis: {
    color:      COLORS.warning,
    fontWeight: '600',
  },
  label: {
    color:        COLORS.textMuted,
    fontSize:     12,
    fontWeight:   '600',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor:  COLORS.background,
    borderWidth:      1,
    borderColor:      COLORS.border,
    borderRadius:     10,
    color:            COLORS.textPrimary,
    fontSize:         15,
    paddingHorizontal: 14,
    paddingVertical:  12,
    marginBottom:     14,
  },
  preview: {
    color:        COLORS.connected,
    fontSize:     12,
    marginBottom: 14,
    fontFamily:   Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  btn: {
    backgroundColor: COLORS.connected,
    borderRadius:    12,
    alignItems:      'center',
    justifyContent:  'center',
    paddingVertical: 14,
    marginTop:       4,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  btnText: {
    color:      '#fff',
    fontWeight: '700',
    fontSize:   15,
  },

  infoCard: {
    backgroundColor: COLORS.surface,
    borderRadius:    14,
    borderWidth:     1,
    borderColor:     COLORS.border,
    padding:         16,
  },
  infoTitle: {
    color:        COLORS.textPrimary,
    fontSize:     13,
    fontWeight:   '700',
    marginBottom: 10,
  },
  infoLine: {
    color:     COLORS.textMuted,
    fontSize:  12,
    lineHeight: 20,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  discoveringContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(52, 199, 89, 0.1)',
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
  },
  discoverSpinner: {
    marginRight: 8,
  },
  discoveringText: {
    color: COLORS.connected,
    fontSize: 13,
    fontWeight: '600',
  },
});
