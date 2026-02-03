import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Title, RadioButton, Text, Divider } from 'react-native-paper';
import { useTheme } from '../contexts/ThemeContext';

export default function SettingsScreen() {
  const { theme, themePreference, setTheme } = useTheme();

  const themeOptions = [
    { value: 'light', label: 'Terang', description: 'Selalu gunakan tema terang' },
    { value: 'dark', label: 'Gelap', description: 'Selalu gunakan tema gelap' },
    { value: 'system', label: 'Sistem', description: 'Ikuti pengaturan tema sistem' },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <Title style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
            Tampilan
          </Title>
          <Divider style={{ marginBottom: 16, backgroundColor: theme.colors.outline }} />
          
          <Text style={[styles.label, { color: theme.colors.onSurface }]}>Tema Aplikasi</Text>
          
          <RadioButton.Group onValueChange={setTheme} value={themePreference}>
            {themeOptions.map((option) => (
              <View 
                key={option.value} 
                style={[
                  styles.radioItem,
                  { 
                    backgroundColor: themePreference === option.value 
                      ? theme.colors.surfaceVariant 
                      : 'transparent',
                    borderColor: theme.colors.outline,
                  }
                ]}
              >
                <RadioButton.Item
                  label={option.label}
                  value={option.value}
                  labelStyle={{ color: theme.colors.onSurface }}
                  style={styles.radioButton}
                />
                <Text style={[styles.description, { color: theme.colors.onSurfaceVariant }]}>
                  {option.description}
                </Text>
              </View>
            ))}
          </RadioButton.Group>
        </Card.Content>
      </Card>

      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <Title style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
            Tentang Aplikasi
          </Title>
          <Divider style={{ marginBottom: 16, backgroundColor: theme.colors.outline }} />
          
          <View style={styles.aboutItem}>
            <Text style={[styles.aboutLabel, { color: theme.colors.onSurfaceVariant }]}>Versi</Text>
            <Text style={[styles.aboutValue, { color: theme.colors.onSurface }]}>1.1.0</Text>
          </View>
          
          <View style={styles.aboutItem}>
            <Text style={[styles.aboutLabel, { color: theme.colors.onSurfaceVariant }]}>Nama Aplikasi</Text>
            <Text style={[styles.aboutValue, { color: theme.colors.onSurface }]}>Milestone Mobile</Text>
          </View>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    margin: 16,
    marginBottom: 8,
    elevation: 2,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  radioItem: {
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  radioButton: {
    paddingVertical: 4,
  },
  description: {
    fontSize: 12,
    marginLeft: 52,
    marginTop: -8,
    marginBottom: 12,
  },
  aboutItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  aboutLabel: {
    fontSize: 14,
  },
  aboutValue: {
    fontSize: 14,
    fontWeight: '500',
  },
});
