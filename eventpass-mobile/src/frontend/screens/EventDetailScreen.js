import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getEvents, getGuests } from '../../backend/api';
import { C } from '../theme';

export default function EventDetailScreen({ route, navigation }) {
  const { eventId } = route.params;

  const [event, setEvent]   = useState(null);
  const [guests, setGuests] = useState([]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [eventId])
  );

  async function load() {
    try {
      const evts = await getEvents();
      setEvent(evts.find(e => e.id === eventId) ?? null);
      const g = await getGuests(eventId);
      setGuests(g);
    } catch (err) {
      if (err.code === 'SESSION_EXPIRED') {
        Alert.alert('Session expired', err.message, [
          { text: 'OK', onPress: () => navigation.reset({ index: 0, routes: [{ name: 'Login' }] }) },
        ]);
        return;
      }
      Alert.alert('Could not load event', err.message);
    }
  }

  if (!event) return null;

  const checkedIn = guests.filter(g => g.checkedIn).length;
  const pct = event.capacity > 0 ? checkedIn / event.capacity : 0;

  function renderGuest({ item }) {
    return (
      <TouchableOpacity
        style={styles.guestRow}
        activeOpacity={0.75}
        onPress={() =>
          navigation.navigate('TicketView', { guest: item, eventName: event.name })
        }
      >
        <View style={styles.guestLeft}>
          <View style={[styles.avatar, { backgroundColor: item.checkedIn ? C.successLight : C.primaryLight }]}>
            <Text style={[styles.avatarText, { color: item.checkedIn ? C.success : C.primary }]}>
              {item.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View>
            <Text style={styles.guestName}>{item.name}</Text>
            <Text style={styles.guestCode}>{item.ticketCode}</Text>
          </View>
        </View>
        <View style={[
          styles.statusBadge,
          { backgroundColor: item.checkedIn ? C.successLight : C.border },
        ]}>
          <Text style={[
            styles.statusText,
            { color: item.checkedIn ? C.success : C.muted },
          ]}>
            {item.checkedIn ? 'In' : 'Pending'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  const ListHeader = (
    <>
      {/* Event info card */}
      <View style={styles.infoCard}>
        {event.date ? (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Date</Text>
            <Text style={styles.infoValue}>{event.date}</Text>
          </View>
        ) : null}
        {event.location ? (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Location</Text>
            <Text style={styles.infoValue}>{event.location}</Text>
          </View>
        ) : null}
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Capacity</Text>
          <Text style={styles.infoValue}>{event.capacity} guests</Text>
        </View>
      </View>

      {/* Live counter */}
      <View style={styles.counterCard}>
        <View style={styles.counterNumbers}>
          <Text style={styles.counterBig}>{checkedIn}</Text>
          <Text style={styles.counterOf}> / {event.capacity}</Text>
        </View>
        <Text style={styles.counterLabel}>guests checked in</Text>
        <View style={styles.bar}>
          <View style={[styles.fill, { width: `${Math.min(pct * 100, 100)}%` }]} />
        </View>
        <Text style={styles.pctText}>{Math.round(pct * 100)}% arrived</Text>
      </View>

      {/* Action buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.actionBtnOutline]}
          activeOpacity={0.8}
          onPress={() =>
            navigation.navigate('AddGuest', { eventId, eventName: event.name })
          }
        >
          <Text style={styles.actionBtnOutlineText}>+ Add Guest</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, styles.actionBtnFill]}
          activeOpacity={0.8}
          onPress={() =>
            navigation.navigate('Scanner', { eventId, eventName: event.name })
          }
        >
          <Text style={styles.actionBtnFillText}>Scan QR</Text>
        </TouchableOpacity>
      </View>

      {guests.length > 0 ? (
        <Text style={styles.sectionTitle}>
          Guest List ({guests.length})
        </Text>
      ) : null}
    </>
  );

  return (
    <View style={styles.root}>
      <FlatList
        data={guests}
        keyExtractor={item => item.id}
        renderItem={renderGuest}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.noGuests}>
            <Text style={styles.noGuestsText}>
              No guests added yet. Tap "+ Add Guest" above to get started.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  list: { padding: 16, paddingBottom: 40 },

  infoCard: {
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  infoLabel: { fontSize: 14, color: C.muted },
  infoValue: { fontSize: 14, fontWeight: '600', color: C.text },

  counterCard: {
    backgroundColor: C.primary,
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  counterNumbers: { flexDirection: 'row', alignItems: 'flex-end' },
  counterBig: { fontSize: 56, fontWeight: '800', color: C.white, lineHeight: 60 },
  counterOf: { fontSize: 24, fontWeight: '600', color: 'rgba(255,255,255,0.7)', marginBottom: 6 },
  counterLabel: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 2, marginBottom: 16 },
  bar: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: { height: 8, backgroundColor: C.white, borderRadius: 4 },
  pctText: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 8 },

  actions: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  actionBtn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  actionBtnOutline: {
    borderWidth: 2,
    borderColor: C.primary,
    backgroundColor: C.card,
  },
  actionBtnOutlineText: { color: C.primary, fontWeight: '700', fontSize: 15 },
  actionBtnFill: {
    backgroundColor: C.primary,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  actionBtnFillText: { color: C.white, fontWeight: '700', fontSize: 15 },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: C.text,
    marginBottom: 10,
  },

  guestRow: {
    backgroundColor: C.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  guestLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: { fontSize: 16, fontWeight: '700' },
  guestName: { fontSize: 15, fontWeight: '600', color: C.text },
  guestCode: { fontSize: 12, color: C.muted, marginTop: 2 },

  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: { fontSize: 12, fontWeight: '600' },

  noGuests: { paddingVertical: 20 },
  noGuestsText: { fontSize: 14, color: C.muted, textAlign: 'center', lineHeight: 20 },
});
