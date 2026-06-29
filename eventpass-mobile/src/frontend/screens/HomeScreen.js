import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, Alert, Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getEvents, deleteEvent, logout } from '../../backend/api';
import { C } from '../theme';

export default function HomeScreen({ navigation }) {
  const [events, setEvents] = useState([]);
  const [counts, setCounts] = useState({});

  useFocusEffect(
    useCallback(() => {
      load();
    }, [])
  );

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={handleLogout} style={{ paddingHorizontal: 4 }}>
          <Text style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 14 }}>Log out</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  async function load() {
    try {
      const evts = await getEvents();
      setEvents(evts);
      const map = {};
      for (const ev of evts) {
        map[ev.id] = { total: ev.capacity, checkedIn: ev.checkedIn };
      }
      setCounts(map);
    } catch (err) {
      if (err.code === 'SESSION_EXPIRED') {
        Alert.alert('Session expired', err.message, [
          { text: 'OK', onPress: () => navigation.reset({ index: 0, routes: [{ name: 'Login' }] }) },
        ]);
        return;
      }
      Alert.alert('Could not load events', err.message);
    }
  }

  async function performLogout() {
    try {
      await logout();
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    } catch (err) {
      Alert.alert('Could not log out', err.message ?? 'Please try again.');
    }
  }

  function handleLogout() {
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to log out?')) {
        performLogout();
      }
      return;
    }

    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: performLogout,
      },
    ]);
  }

  function confirmDelete(ev) {
    async function performDelete() {
      try {
        await deleteEvent(ev.id);
        load();
      } catch (err) {
        Alert.alert('Could not delete event', err.message);
      }
    }

    if (Platform.OS === 'web') {
      if (window.confirm(`Delete "${ev.name}"? All guests will also be removed.`)) {
        performDelete();
      }
      return;
    }

    Alert.alert(
      'Delete Event',
      `Delete "${ev.name}"? All guests will also be removed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: performDelete,
        },
      ]
    );
  }

  function renderItem({ item }) {
    const c = counts[item.id] ?? { total: 0, checkedIn: 0 };
    const pct = item.capacity > 0 ? c.checkedIn / item.capacity : 0;

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.82}
        onPress={() =>
          navigation.navigate('EventDetail', {
            eventId: item.id,
            eventName: item.name,
          })
        }
        onLongPress={() => confirmDelete(item)}
      >
        <View style={styles.cardTop}>
          <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
          <View style={styles.pill}>
            <Text style={styles.pillText}>{c.checkedIn}/{item.capacity}</Text>
          </View>
        </View>

        {(item.date || item.location) ? (
          <View style={styles.meta}>
            {item.date ? <Text style={styles.metaText}>{item.date}</Text> : null}
            {item.date && item.location ? (
              <Text style={styles.metaDot}> · </Text>
            ) : null}
            {item.location ? <Text style={styles.metaText}>{item.location}</Text> : null}
          </View>
        ) : null}

        <View style={styles.bar}>
          <View style={[styles.fill, { width: `${Math.min(pct * 100, 100)}%` }]} />
        </View>

        <Text style={styles.hint}>Hold to delete</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.root}>
      <FlatList
        data={events}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={
          events.length === 0 ? styles.emptyCont : styles.list
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Text style={styles.emptyIconText}>EP</Text>
            </View>
            <Text style={styles.emptyTitle}>No events yet</Text>
            <Text style={styles.emptyBody}>
              Create your first event and start issuing QR tickets to your guests.
            </Text>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('CreateEvent')}
      >
        <Text style={styles.fabText}>+ New Event</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  list: { padding: 16, paddingBottom: 100 },
  emptyCont: { flex: 1 },

  card: {
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  name: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: C.text,
    marginRight: 8,
  },
  pill: {
    backgroundColor: C.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  pillText: { fontSize: 13, fontWeight: '600', color: C.primary },

  meta: { flexDirection: 'row', marginTop: 6, flexWrap: 'wrap' },
  metaText: { fontSize: 13, color: C.muted },
  metaDot: { fontSize: 13, color: C.muted },

  bar: {
    height: 6,
    backgroundColor: C.border,
    borderRadius: 3,
    marginTop: 12,
    overflow: 'hidden',
  },
  fill: { height: 6, backgroundColor: C.primary, borderRadius: 3 },
  hint: { fontSize: 11, color: C.muted, marginTop: 6, textAlign: 'right' },

  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 80,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: C.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyIconText: { fontSize: 20, fontWeight: '800', color: C.primary },
  emptyTitle: { fontSize: 22, fontWeight: '700', color: C.text, marginBottom: 8 },
  emptyBody: {
    fontSize: 15,
    color: C.muted,
    textAlign: 'center',
    lineHeight: 22,
  },

  fab: {
    position: 'absolute',
    bottom: 28,
    left: 24,
    right: 24,
    backgroundColor: C.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  fabText: { color: C.white, fontSize: 16, fontWeight: '700' },
});
