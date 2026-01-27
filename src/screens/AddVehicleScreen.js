import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { TextInput, Button, Card, Title } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { addVehicle } from '../services/firebaseService';

export default function AddVehicleScreen() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    year: '',
    plateNumber: '',
    currentKm: '',
    color: '',
    notes: '',
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.brand || !formData.model || !formData.plateNumber) {
      Alert.alert('Error', 'Mohon isi brand, model, dan nomor plat');
      return;
    }

    try {
      setLoading(true);
      await addVehicle({
        ...formData,
        year: formData.year ? parseInt(formData.year) : null,
        currentKm: formData.currentKm ? parseInt(formData.currentKm) : 0,
      });
      Alert.alert('Sukses', 'Kendaraan berhasil ditambahkan', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('Error adding vehicle:', error);
      Alert.alert('Error', 'Gagal menambahkan kendaraan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Title>Informasi Kendaraan</Title>
          
          <TextInput
            label="Brand *"
            value={formData.brand}
            onChangeText={(value) => handleChange('brand', value)}
            mode="outlined"
            style={styles.input}
          />

          <TextInput
            label="Model *"
            value={formData.model}
            onChangeText={(value) => handleChange('model', value)}
            mode="outlined"
            style={styles.input}
          />

          <TextInput
            label="Tahun"
            value={formData.year}
            onChangeText={(value) => handleChange('year', value)}
            mode="outlined"
            keyboardType="numeric"
            style={styles.input}
          />

          <TextInput
            label="Nomor Plat *"
            value={formData.plateNumber}
            onChangeText={(value) => handleChange('plateNumber', value.toUpperCase())}
            mode="outlined"
            style={styles.input}
          />

          <TextInput
            label="Warna"
            value={formData.color}
            onChangeText={(value) => handleChange('color', value)}
            mode="outlined"
            style={styles.input}
          />

          <TextInput
            label="Kilometer Saat Ini"
            value={formData.currentKm}
            onChangeText={(value) => handleChange('currentKm', value)}
            mode="outlined"
            keyboardType="numeric"
            style={styles.input}
          />

          <TextInput
            label="Catatan"
            value={formData.notes}
            onChangeText={(value) => handleChange('notes', value)}
            mode="outlined"
            multiline
            numberOfLines={4}
            style={styles.input}
          />

          <Button
            mode="contained"
            onPress={handleSubmit}
            loading={loading}
            style={styles.button}
          >
            Simpan
          </Button>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  card: {
    margin: 16,
    elevation: 2,
  },
  input: {
    marginBottom: 12,
  },
  button: {
    marginTop: 8,
  },
});
