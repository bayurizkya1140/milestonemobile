import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { TextInput, Button, Card, Title, Text, HelperText } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

export default function LoginScreen({ navigation }) {
  const { login, error, clearError } = useAuth();
  const { theme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleLogin = async () => {
    clearError();
    setLocalError('');

    if (!email.trim()) {
      setLocalError('Email tidak boleh kosong');
      return;
    }

    if (!validateEmail(email)) {
      setLocalError('Format email tidak valid');
      return;
    }

    if (!password) {
      setLocalError('Password tidak boleh kosong');
      return;
    }

    try {
      setLoading(true);
      await login(email.trim(), password);
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logoContainer}>
          <Title style={{ fontSize: 48, marginBottom: 8 }}><Ionicons name="car" size={64} color={theme.colors.primary} /></Title>
          <Title style={[styles.appTitle, { color: theme.colors.primary, fontFamily: 'SpaceGrotesk_700Bold' }]}>Milestone</Title>
          <Text style={[styles.tagline, { color: theme.colors.onSurfaceVariant, fontFamily: 'SpaceGrotesk_500Medium' }]}>Kelola kendaraan Anda dengan mudah</Text>
        </View>

        <Card style={[styles.card, { backgroundColor: theme.colors.surface, borderRadius: theme.roundness * 2 }]}>
          <Card.Content>
            <Title style={[styles.cardTitle, { color: theme.colors.primary, fontFamily: 'SpaceGrotesk_700Bold', fontSize: 24, marginTop: 8 }]}>Masuk</Title>

            <TextInput
              label={null}
              placeholder="Email"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setLocalError('');
                clearError();
              }}
              mode="outlined"
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              left={<TextInput.Icon icon="email" color={theme.colors.primary} />}
              theme={{ colors: { primary: theme.colors.primary, background: '#F1F1F1' }, roundness: 8, fonts: { regular: { fontFamily: 'SpaceGrotesk_400Regular' } } }}
            />

            <TextInput
              label={null}
              placeholder="Password"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setLocalError('');
                clearError();
              }}
              mode="outlined"
              style={styles.input}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              left={<TextInput.Icon icon="lock" color={theme.colors.primary} />}
              right={
                <TextInput.Icon
                  icon={showPassword ? "eye-off" : "eye"}
                  onPress={() => setShowPassword(!showPassword)}
                  color={theme.colors.primary}
                />
              }
              theme={{ colors: { primary: theme.colors.primary, background: '#F1F1F1' }, roundness: 8, fonts: { regular: { fontFamily: 'SpaceGrotesk_400Regular' } } }}
            />

            {(localError || error) && (
              <HelperText type="error" visible={true} style={styles.errorText}>
                {localError || error}
              </HelperText>
            )}

            <Button
              mode="contained"
              onPress={handleLogin}
              loading={loading}
              disabled={loading}
              style={styles.button}
              contentStyle={styles.buttonContent}
              labelStyle={{ fontFamily: 'SpaceGrotesk_700Bold', fontSize: 16 }}
              buttonColor={theme.colors.primary}
            >
              Masuk
            </Button>

            <Button
              mode="text"
              onPress={() => navigation.navigate('ForgotPassword')}
              style={styles.linkButton}
              labelStyle={{ fontFamily: 'SpaceGrotesk_500Medium', color: theme.colors.onSurfaceVariant }}
            >
              Lupa Password?
            </Button>

            <View style={styles.registerContainer}>
              <Text style={[styles.registerText, { color: theme.colors.onSurfaceVariant, fontFamily: 'SpaceGrotesk_400Regular' }]}>Belum punya akun?</Text>
              <Button
                mode="outlined"
                onPress={() => navigation.navigate('Register')}
                style={styles.registerButton}
                labelStyle={{ fontFamily: 'SpaceGrotesk_500Medium' }}
                textColor={theme.colors.primary}
              >
                Daftar Sekarang
              </Button>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 16,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  appTitle: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  tagline: {
    fontSize: 14,
    marginTop: 8,
  },
  card: {
    elevation: 4,
    borderRadius: 12,
  },
  cardTitle: {
    textAlign: 'center',
    marginBottom: 16,
  },
  input: {
    marginBottom: 12,
  },
  errorText: {
    marginBottom: 8,
  },
  button: {
    marginTop: 8,
    borderRadius: 8,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  linkButton: {
    marginTop: 8,
  },
  registerContainer: {
    alignItems: 'center',
    marginTop: 24,
  },
  registerText: {
    marginBottom: 8,
  },
  registerButton: {
    borderRadius: 8,
  },
});
