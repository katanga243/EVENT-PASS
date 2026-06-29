import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, KeyboardAvoidingView,
  Platform, Alert,
} from 'react-native';
import { createEvent } from '../../backend/api';
import { C } from '../theme';

export default function CreateEventScreen({ navigation }) {
  const [name, setName]         = useState('');
  const [date, setDate]         = useState('');
  const [location, setLocation] = useState('');
  const [capacity, setCapacity] = useState('');
  const [saving, setSaving]     = useState(false);

  async function handleCreate() {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter an event name.');
      return;
    }
    const cap = parseInt(capacity, 10);
    if (!capacity || isNaN(cap) || cap < 1) {
      Alert.alert('Required', 'Please enter a valid capacity (minimum 1).');
      return;
    }

    setSaving(true);
    try {
      const event = await createEvent({
        name: name.trim(),
        date: date.trim(),
        location: location.trim(),
        capacity: cap,
      });
      navigation.replace('EventDetail', { eventId: event.id, eventName: event.name });
    } catch (err) {
      Alert.alert('Could not create event', err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <Field
            label="Event Name"
            placeholder="e.g. Annual Community Gala"
            value={name}
            onChangeText={setName}
            required
          />
          <Field
            label="Date"
            placeholder="e.g. 20 Jun 2026"
            value={date}
            onChangeText={setDate}
          />
          <Field
            label="Location"
            placeholder="e.g. Community Hall, Block B"
            value={location}
            onChangeText={setLocation}
          />
          <Field
            label="Capacity"
            placeholder="e.g. 50"
            value={capacity}
            onChangeText={setCapacity}
            keyboardType="numeric"
            required
          />
        </View>

        <TouchableOpacity
          style={[styles.btn, saving && styles.btnDisabled]}
          onPress={handleCreate}
          activeOpacity={0.85}
          disabled={saving}
        >
          <Text style={styles.btnText}>
            {saving ? 'Creating...' : 'Create Event'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ label, required, ...inputProps }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>
        {label}
        {required ? <Text style={styles.star}> *</Text> : null}
      </Text>
      <TextInput
        style={styles.input}
        placeholderTextColor={C.muted}
        autoCapitalize="sentences"
        returnKeyType="next"
        {...inputProps}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40 },

  card: {
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 20,
  },

  field: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', color: C.text, marginBottom: 6 },
  star: { color: C.error },
  input: {
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: C.text,
    backgroundColor: C.bg,
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
