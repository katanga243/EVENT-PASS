import React from 'react';
import {
  View, Text, StyleSheet, Share, TouchableOpacity,
  ScrollView,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { C } from '../theme';

export default function TicketViewScreen({ route, navigation }) {
  const { guest, eventName } = route.params;

  async function shareTicket() {
    try {
      await Share.share({
        message:
          `EventPass Ticket\n\nEvent: ${eventName}\nGuest: ${guest.name}\nTicket: ${guest.ticketCode}\n\nPlease show this ticket at the door.`,
      });
    } catch (_) {
      // user dismissed share sheet — no action needed
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Ticket card */}
      <View style={styles.ticket}>
        {/* Top strip */}
        <View style={styles.ticketTop}>
          <Text style={styles.ticketAppName}>EventPass</Text>
          <Text style={styles.ticketEventName}>{eventName}</Text>
        </View>

        {/* Tear line */}
        <View style={styles.tearLine}>
          <View style={styles.circle} />
          <View style={styles.dashes} />
          <View style={[styles.circle, styles.circleRight]} />
        </View>

        {/* QR section */}
        <View style={styles.ticketBottom}>
          <View style={styles.qrWrap}>
            <QRCode
              value={guest.qrToken}
              size={220}
              color={C.text}
              backgroundColor={C.white}
            />
          </View>

          <Text style={styles.guestName}>{guest.name}</Text>
          <Text style={styles.ticketCode}>{guest.ticketCode}</Text>
          <Text style={styles.ticketNote}>Show this code at the door</Text>
        </View>
      </View>

      {/* Status banner */}
      <View style={[
        styles.statusBanner,
        { backgroundColor: guest.checkedIn ? C.successLight : C.primaryLight },
      ]}>
        <Text style={[
          styles.statusText,
          { color: guest.checkedIn ? C.success : C.primary },
        ]}>
          {guest.checkedIn
            ? `Checked in at ${formatTime(guest.checkInTime)}`
            : 'Not yet checked in'}
        </Text>
      </View>

      {/* Actions */}
      <TouchableOpacity
        style={styles.shareBtn}
        onPress={shareTicket}
        activeOpacity={0.85}
      >
        <Text style={styles.shareBtnText}>Share Ticket</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => navigation.goBack()}
        activeOpacity={0.75}
      >
        <Text style={styles.backBtnText}>Back to Event</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function formatTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 40,
    alignItems: 'center',
    backgroundColor: C.bg,
    minHeight: '100%',
  },

  ticket: {
    width: '100%',
    backgroundColor: C.white,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
    marginBottom: 16,
  },

  ticketTop: {
    backgroundColor: C.primary,
    padding: 24,
    alignItems: 'center',
  },
  ticketAppName: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  ticketEventName: {
    fontSize: 22,
    fontWeight: '800',
    color: C.white,
    textAlign: 'center',
  },

  tearLine: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.bg,
    overflow: 'hidden',
  },
  circle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: C.bg,
    marginLeft: -12,
  },
  circleRight: { marginLeft: 0, marginRight: -12 },
  dashes: { flex: 1, height: 1, borderWidth: 1, borderColor: C.border, borderStyle: 'dashed' },

  ticketBottom: {
    padding: 28,
    alignItems: 'center',
  },
  qrWrap: {
    padding: 16,
    backgroundColor: C.white,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  guestName: {
    fontSize: 22,
    fontWeight: '700',
    color: C.text,
    marginBottom: 6,
    textAlign: 'center',
  },
  ticketCode: {
    fontSize: 16,
    fontWeight: '600',
    color: C.primary,
    letterSpacing: 2,
    marginBottom: 8,
  },
  ticketNote: { fontSize: 13, color: C.muted },

  statusBanner: {
    width: '100%',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  statusText: { fontSize: 14, fontWeight: '600' },

  shareBtn: {
    width: '100%',
    backgroundColor: C.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 5,
  },
  shareBtnText: { color: C.white, fontSize: 16, fontWeight: '700' },

  backBtn: {
    width: '100%',
    borderWidth: 2,
    borderColor: C.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  backBtnText: { color: C.primary, fontSize: 16, fontWeight: '600' },
});
