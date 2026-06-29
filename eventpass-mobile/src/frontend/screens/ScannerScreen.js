import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  StatusBar, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useFocusEffect } from '@react-navigation/native';
import { checkIn, getGuests } from '../../backend/api';
import { C } from '../theme';

const RESULT_DISPLAY_MS = 2500;

export default function ScannerScreen({ route, navigation }) {
  const { eventId, eventName } = route.params;

  const [permission, requestPermission] = useCameraPermissions();
  const [result, setResult]   = useState(null); // { status, guest }
  const [stats, setStats]     = useState({ checkedIn: 0, total: 0 });

  const processingRef = useRef(false);
  const fadeAnim      = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      loadStats();
      return () => {
        processingRef.current = false;
        setResult(null);
      };
    }, [eventId])
  );

  async function loadStats() {
    try {
      const guests = await getGuests(eventId);
      setStats({
        checkedIn: guests.filter(g => g.checkedIn).length,
        total: guests.length,
      });
    } catch (err) {
      if (err.code === 'SESSION_EXPIRED') {
        navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        return;
      }
      // otherwise stay on last known stats if the request fails
    }
  }

  function showResult(res) {
    setResult(res);
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();

    setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setResult(null);
        processingRef.current = false;
      });
    }, RESULT_DISPLAY_MS);
  }

  async function handleBarCodeScanned({ data }) {
    if (processingRef.current) return;
    processingRef.current = true;

    let res;
    try {
      res = await checkIn(data, eventId);
    } catch (err) {
      if (err.code === 'SESSION_EXPIRED') {
        processingRef.current = false;
        navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        return;
      }
      res = { status: 'error', message: err.message };
    }
    if (res.status === 'success') {
      await loadStats();
    }
    showResult(res);
  }

  // ── Permission states ─────────────────────────────────────────
  if (!permission) {
    return <View style={styles.center}><Text style={styles.infoText}>Loading camera...</Text></View>;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.permRoot}>
        <Text style={styles.permTitle}>Camera Permission Required</Text>
        <Text style={styles.permBody}>
          EventPass needs camera access to scan QR tickets at the door.
        </Text>
        <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
          <Text style={styles.permBtnText}>Allow Camera</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.permBack} onPress={() => navigation.goBack()}>
          <Text style={styles.permBackText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // ── Result overlay config ──────────────────────────────────────
  const resultConfig = result ? {
    success:   { bg: C.success,  label: 'Checked In!',          sub: result.guest?.name ?? '' },
    duplicate: { bg: C.warning,  label: 'Already Checked In',   sub: result.guest?.name ?? '' },
    invalid:   { bg: C.error,    label: 'Invalid Ticket',        sub: 'This code is not recognised' },
    wrong_event: { bg: C.error,  label: 'Wrong Event',           sub: 'This ticket is for a different event' },
    error:     { bg: C.error,    label: 'Could Not Check In',    sub: result.message ?? 'Please try again' },
  }[result.status] : null;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />

      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={handleBarCodeScanned}
      />

      {/* Dark vignette overlay */}
      <View style={styles.overlay} pointerEvents="none">
        {/* Top dimmed strip */}
        <View style={styles.dimTop} />
        {/* Middle row: dim | finder | dim */}
        <View style={styles.middleRow}>
          <View style={styles.dimSide} />
          <View style={styles.finder}>
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
          </View>
          <View style={styles.dimSide} />
        </View>
        {/* Bottom dimmed strip */}
        <View style={styles.dimBottom} />
      </View>

      {/* Top bar */}
      <SafeAreaView style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
          <Text style={styles.closeBtnText}>X  Done</Text>
        </TouchableOpacity>
        <View style={styles.topCenter}>
          <Text style={styles.topTitle}>Scan Tickets</Text>
          <Text style={styles.topSub}>{eventName}</Text>
        </View>
        <View style={styles.statsBox}>
          <Text style={styles.statsNum}>{stats.checkedIn}</Text>
          <Text style={styles.statsOf}>/{stats.total}</Text>
        </View>
      </SafeAreaView>

      {/* Instruction */}
      <View style={styles.instructionWrap} pointerEvents="none">
        <Text style={styles.instruction}>Point the camera at a guest's QR code</Text>
      </View>

      {/* Result panel */}
      {result && resultConfig ? (
        <Animated.View
          style={[
            styles.resultPanel,
            { backgroundColor: resultConfig.bg, opacity: fadeAnim },
          ]}
          pointerEvents="none"
        >
          <Text style={styles.resultLabel}>{resultConfig.label}</Text>
          {resultConfig.sub ? (
            <Text style={styles.resultSub}>{resultConfig.sub}</Text>
          ) : null}
        </Animated.View>
      ) : null}
    </View>
  );
}

const FINDER = 240;
const CORNER = 28;
const BORDER = 4;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg },
  infoText: { color: C.muted, fontSize: 16 },

  // ── Permission screen ──────────────────────────────────────────
  permRoot: {
    flex: 1, backgroundColor: C.bg,
    alignItems: 'center', justifyContent: 'center', padding: 32,
  },
  permTitle: { fontSize: 22, fontWeight: '700', color: C.text, marginBottom: 12, textAlign: 'center' },
  permBody:  { fontSize: 15, color: C.muted, textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  permBtn:   { backgroundColor: C.primary, borderRadius: 14, paddingVertical: 16, paddingHorizontal: 40, marginBottom: 12 },
  permBtnText: { color: C.white, fontSize: 16, fontWeight: '700' },
  permBack:  { padding: 12 },
  permBackText: { color: C.primary, fontSize: 15, fontWeight: '600' },

  // ── Camera overlay ─────────────────────────────────────────────
  overlay: { ...StyleSheet.absoluteFillObject },
  dimTop:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },
  dimBottom: { flex: 2, backgroundColor: 'rgba(0,0,0,0.55)' },
  middleRow: { flexDirection: 'row', height: FINDER },
  dimSide:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },

  finder: {
    width: FINDER,
    height: FINDER,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: CORNER,
    height: CORNER,
    borderColor: C.white,
  },
  cornerTL: { top: 0, left: 0, borderTopWidth: BORDER, borderLeftWidth: BORDER, borderTopLeftRadius: 6 },
  cornerTR: { top: 0, right: 0, borderTopWidth: BORDER, borderRightWidth: BORDER, borderTopRightRadius: 6 },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: BORDER, borderLeftWidth: BORDER, borderBottomLeftRadius: 6 },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: BORDER, borderRightWidth: BORDER, borderBottomRightRadius: 6 },

  // ── Top bar ────────────────────────────────────────────────────
  topBar: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  closeBtn: { padding: 8 },
  closeBtnText: { color: C.white, fontSize: 14, fontWeight: '600' },
  topCenter: { flex: 1, alignItems: 'center' },
  topTitle: { fontSize: 16, fontWeight: '700', color: C.white },
  topSub:   { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  statsBox: { flexDirection: 'row', alignItems: 'baseline', minWidth: 52, justifyContent: 'flex-end' },
  statsNum: { fontSize: 22, fontWeight: '800', color: C.white },
  statsOf:  { fontSize: 14, color: 'rgba(255,255,255,0.7)' },

  // ── Instruction ────────────────────────────────────────────────
  instructionWrap: {
    position: 'absolute',
    left: 0, right: 0,
    top: '55%',
    alignItems: 'center',
  },
  instruction: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    paddingHorizontal: 40,
  },

  // ── Result panel ───────────────────────────────────────────────
  resultPanel: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    padding: 32,
    paddingBottom: 48,
    alignItems: 'center',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  resultLabel: { fontSize: 26, fontWeight: '800', color: C.white, marginBottom: 6 },
  resultSub:   { fontSize: 18, color: 'rgba(255,255,255,0.85)', fontWeight: '500' },
});
