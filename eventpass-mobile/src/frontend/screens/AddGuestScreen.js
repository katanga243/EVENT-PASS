import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { addGuest } from '../../backend/api';
import { C } from '../theme';

export default function AddGuestScreen({ route, navigation }) {
  const { eventId, eventName } = route.params;
  const [name, setName]     = useState('');
  const [saving, setSaving] = useState(false);

  async function handleAdd() {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter the guest\'s name.');
      return;
    }
    setSaving(true);
    try {
      const guest = await addGuest(eventId, name.trim());
      navigation.replace('TicketView', { guest, eventName });
    } catch (err) {
      Alert.alert('Could not add guest', err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.subtitle}>Event</Text>
          <Text style={styles.eventName}>{eventName}</Text>

          <View style={styles.divider} />

          <Text style={styles.label}>
            Guest Name <Text style={styles.star}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Full name"
            placeholderTextColor={C.muted}
            value={name}
            onChangeText={setName}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={handleAdd}
          />

          <Text style={styles.hint}>
            A unique QR ticket will be generated instantly for this guest.
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.btn, saving && styles.btnDisabled]}
          onPress={handleAdd}
          activeOpacity={0.85}
          disabled={saving}
        >
          <Text style={styles.btnText}>
            {saving ? 'Generating Ticket...' : 'Add Guest & Generate Ticket'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  container: { flex: 1, padding: 16, justifyContent: 'center' },

  card: {
    backgroundColor: C.card,
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },

  subtitle: { fontSize: 12, fontWeight: '600', color: C.muted, letterSpacing: 1, textTransform: 'uppercase' },
  eventName: { fontSize: 20, fontWeight: '700', color: C.text, marginTop: 4, marginBottom: 16 },
  divider: { height: 1, backgroundColor: C.border, marginBottom: 20 },

  label: { fontSize: 13, fontWeight: '600', color: C.text, marginBottom: 8 },
  star: { color: C.error },
  input: {
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: C.text,
    backgroundColor: C.bg,
  },
  hint: {
    fontSize: 13,
    color: C.muted,
    marginTop: 12,
    lineHeight: 18,
  },

  btn: {
    backgroundColor: C.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 5,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: C.white, fontSize: 16, fontWeight: '700' },
});
