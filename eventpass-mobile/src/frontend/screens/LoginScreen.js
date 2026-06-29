import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Image,
  StyleSheet, KeyboardAvoidingView, Platform, Alert, ImageBackground,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { login } from '../../backend/api';
import { C, F } from '../theme';

export default function LoginScreen({ navigation }) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [signingIn, setSigningIn] = useState(false);

  async function handleLogin() {
    if (!email.trim() || !password) {
      Alert.alert('Required', 'Please enter your email and password.');
      return;
    }
    setSigningIn(true);
    try {
      await login(email.trim(), password);
      navigation.replace('Home');
    } catch (err) {
      Alert.alert('Sign in failed', err.message);
    } finally {
      setSigningIn(false);
    }
  }

  return (
    <ImageBackground
      source={require('../../../assets/hero.jpg')}
      style={styles.bg}
      resizeMode="cover"
    >
      <LinearGradient
        colors={['rgba(10,12,30,0.55)', 'rgba(10,12,30,0.75)', 'rgba(10,12,30,0.94)']}
        style={styles.overlay}
      />
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.container}>
          <View style={styles.brand}>
            <Image
              source={require('../../../assets/logo-badge.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.title}>EventPass</Text>
            <Text style={styles.subtitle}>Sign in with your organiser account</Text>
          </View>

          <BlurView intensity={40} tint="light" style={styles.card}>
            <View style={styles.cardInner}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="you@example.com"
                placeholderTextColor="rgba(255,255,255,0.5)"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                returnKeyType="next"
              />

              <Text style={[styles.label, { marginTop: 16 }]}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor="rgba(255,255,255,0.5)"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />

              <TouchableOpacity
                style={[styles.btn, signingIn && styles.btnDisabled]}
                onPress={handleLogin}
                activeOpacity={0.85}
                disabled={signingIn}
              >
                <Text style={styles.btnText}>{signingIn ? 'Signing in...' : 'Sign in'}</Text>
              </TouchableOpacity>
            </View>
          </BlurView>
        </View>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: C.text },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  root: { flex: 1 },
  container: { flex: 1, padding: 24, justifyContent: 'center' },

  brand: { alignItems: 'center', marginBottom: 36 },
  logo: { width: 76, height: 76, marginBottom: 16 },
  title: {
    fontFamily: F.display,
    fontSize: 30,
    color: C.white,
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  subtitle: { fontFamily: F.body, fontSize: 14, color: 'rgba(255,255,255,0.75)', textAlign: 'center' },

  card: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  cardInner: {
    padding: 22,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  label: { fontFamily: F.bodyMed, fontSize: 13, color: 'rgba(255,255,255,0.85)', marginBottom: 6 },
  input: {
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: F.body,
    fontSize: 15,
    color: C.white,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },

  btn: {
    marginTop: 24,
    backgroundColor: C.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 6,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { fontFamily: F.bodyBold, color: C.white, fontSize: 16 },
});
