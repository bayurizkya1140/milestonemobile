import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { TextInput, Button, Card, Title, Text, HelperText } from 'react-native-paper';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

export default function RegisterScreen({ navigation }) {
  const { register, error, clearError } = useAuth();
  const { theme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [localError, setLocalError] = useState('');

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleRegister = async () => {
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

    if (password.length < 6) {
      setLocalError('Password minimal 6 karakter');
      return;
    }

    if (password !== confirmPassword) {
      setLocalError('Konfirmasi password tidak cocok');
      return;
    }

    try {
      setLoading(true);
      await register(email.trim(), password);
      Alert.alert(
        'Registrasi Berhasil',
        'Akun Anda telah berhasil dibuat. Selamat datang di Milestone!',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Register error:', error);
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
          <Title style={[styles.appTitle, { color: theme.colors.primary }]}>🚗 Milestone</Title>
          <Text style={[styles.tagline, { color: theme.colors.onSurfaceVariant }]}>Buat akun baru</Text>
        </View>

        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Title style={[styles.cardTitle, { color: theme.colors.onSurface }]}>Daftar</Title>
            
            <TextInput
              label="Email"
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
              left={<TextInput.Icon icon="email" />}
            />

            <TextInput
              label="Password"
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
              left={<TextInput.Icon icon="lock" />}
              right={
                <TextInput.Icon 
                  icon={showPassword ? "eye-off" : "eye"} 
                  onPress={() => setShowPassword(!showPassword)}
                />
              }
            />
            <HelperText type="info" visible={true}>
              Password minimal 6 karakter
            </HelperText>

            <TextInput
              label="Konfirmasi Password"
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                setLocalError('');
                clearError();
              }}
              mode="outlined"
              style={styles.input}
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
              left={<TextInput.Icon icon="lock-check" />}
              right={
                <TextInput.Icon 
                  icon={showConfirmPassword ? "eye-off" : "eye"} 
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                />
              }
            />

            {(localError || error) && (
              <HelperText type="error" visible={true} style={styles.errorText}>
                {localError || error}
              </HelperText>
            )}

            <Button
              mode="contained"
              onPress={handleRegister}
              loading={loading}
              disabled={loading}
              style={styles.button}
              contentStyle={styles.buttonContent}
            >
              Daftar
            </Button>
          </Card.Content>
        </Card>

        <View style={styles.loginContainer}>
          <Text style={[styles.loginText, { color: theme.colors.onSurfaceVariant }]}>Sudah punya akun?</Text>
          <Button
            mode="outlined"
            onPress={() => navigation.navigate('Login')}
            style={styles.loginButton}
          >
            Masuk
          </Button>
        </View>
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
    marginBottom: 4,
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
  loginContainer: {
    alignItems: 'center',
    marginTop: 24,
  },
  loginText: {
    marginBottom: 8,
  },
  loginButton: {
    borderRadius: 8,
  },
});
