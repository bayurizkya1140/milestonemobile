import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { TextInput, Button, Card, Title, Text, HelperText } from 'react-native-paper';
import { useAuth } from '../contexts/AuthContext';

export default function ForgotPasswordScreen({ navigation }) {
  const { forgotPassword, error, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState('');
  const [emailSent, setEmailSent] = useState(false);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleResetPassword = async () => {
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

    try {
      setLoading(true);
      await forgotPassword(email.trim());
      setEmailSent(true);
      Alert.alert(
        'Email Terkirim',
        'Link reset password telah dikirim ke email Anda. Silakan cek inbox atau folder spam.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Login'),
          },
        ]
      );
    } catch (error) {
      console.error('Reset password error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logoContainer}>
          <Title style={styles.appTitle}>🔐</Title>
          <Text style={styles.tagline}>Reset Password</Text>
        </View>

        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>Lupa Password?</Title>
            
            <Text style={styles.description}>
              Masukkan alamat email yang terdaftar. Kami akan mengirimkan link untuk mereset password Anda.
            </Text>
            
            <TextInput
              label="Email"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setLocalError('');
                clearError();
                setEmailSent(false);
              }}
              mode="outlined"
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              left={<TextInput.Icon icon="email" />}
              disabled={emailSent}
            />

            {(localError || error) && (
              <HelperText type="error" visible={true} style={styles.errorText}>
                {localError || error}
              </HelperText>
            )}

            {emailSent && (
              <HelperText type="info" visible={true} style={styles.successText}>
                ✓ Email reset password telah dikirim
              </HelperText>
            )}

            <Button
              mode="contained"
              onPress={handleResetPassword}
              loading={loading}
              disabled={loading || emailSent}
              style={styles.button}
              contentStyle={styles.buttonContent}
            >
              {emailSent ? 'Email Terkirim' : 'Kirim Link Reset'}
            </Button>

            <Button
              mode="text"
              onPress={() => navigation.navigate('Login')}
              style={styles.linkButton}
            >
              Kembali ke Login
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
    fontSize: 48,
  },
  tagline: {
    fontSize: 18,
    color: '#666',
    marginTop: 8,
    fontWeight: '600',
  },
  card: {
    elevation: 4,
    borderRadius: 12,
  },
  cardTitle: {
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  input: {
    marginBottom: 12,
  },
  errorText: {
    marginBottom: 8,
  },
  successText: {
    marginBottom: 8,
    color: '#4caf50',
  },
  button: {
    marginTop: 8,
    borderRadius: 8,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  linkButton: {
    marginTop: 16,
  },
});
