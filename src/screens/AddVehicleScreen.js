import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { TextInput, Button, Text, SegmentedButtons } from 'react-native-paper';
import { addVehicle } from '../services/firebaseService';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { formatNumberWithDots, parseFormattedNumberToInt } from '../utils/formatNumber';

const AddVehicleScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { user } = useAuth();

  const [vehicleType, setVehicleType] = useState('motor');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [currentMileage, setCurrentMileage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    // Validation
    if (!brand.trim() || !model.trim() || !year.trim() || !licensePlate.trim()) {
      Alert.alert('Error', 'Mohon lengkapi semua field yang wajib diisi');
      return;
    }

    if (!user || !user.uid) {
      Alert.alert('Error', 'Anda harus login terlebih dahulu');
      return;
    }

    const yearNum = parseInt(year);
    if (isNaN(yearNum) || yearNum < 1900 || yearNum > new Date().getFullYear() + 1) {
      Alert.alert('Error', 'Tahun kendaraan tidak valid');
      return;
    }

    setLoading(true);
    try {
      const vehicleData = {
        type: vehicleType,
        brand: brand.trim(),
        model: model.trim(),
        year: yearNum,
        licensePlate: licensePlate.trim().toUpperCase(),
        currentMileage: parseFormattedNumberToInt(currentMileage),
      };

      console.log('Adding vehicle with userId:', user.uid);
      console.log('Vehicle data:', vehicleData);

      const vehicleId = await addVehicle(vehicleData, user.uid);
      console.log('Vehicle added successfully with ID:', vehicleId);

      Alert.alert('Sukses', 'Kendaraan berhasil ditambahkan', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('Error adding vehicle:', error);
      Alert.alert('Error', 'Gagal menambahkan kendaraan: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        <Text style={[styles.label, { color: theme.colors.onSurface, fontFamily: 'SpaceGrotesk_500Medium' }]}>Jenis Kendaraan</Text>
        <SegmentedButtons
          value={vehicleType}
          onValueChange={setVehicleType}
          buttons={[
            { value: 'motor', label: 'Motor', checkedColor: '#fff', style: vehicleType === 'motor' ? { backgroundColor: theme.colors.primary } : { backgroundColor: '#EBEBEB' } },
            { value: 'mobil', label: 'Mobil', checkedColor: '#fff', style: vehicleType === 'mobil' ? { backgroundColor: theme.colors.primary } : { backgroundColor: '#EBEBEB' } },
          ]}
          style={styles.segmentedButton}
          theme={{ colors: { secondaryContainer: theme.colors.primary } }}
        />

        <TextInput
          label="Merek *"
          value={brand}
          onChangeText={setBrand}
          mode="outlined"
          style={styles.input}
          placeholder="Contoh: Honda"
          theme={{ colors: { primary: theme.colors.primary, background: '#F1F1F1' }, roundness: 8, fonts: { regular: { fontFamily: 'SpaceGrotesk_400Regular' } } }}
        />

        <TextInput
          label="Model *"
          value={model}
          onChangeText={setModel}
          mode="outlined"
          style={styles.input}
          placeholder="Contoh: Vario 150"
          theme={{ colors: { primary: theme.colors.primary, background: '#F1F1F1' }, roundness: 8, fonts: { regular: { fontFamily: 'SpaceGrotesk_400Regular' } } }}
        />

        <TextInput
          label="Tahun *"
          value={year}
          onChangeText={setYear}
          mode="outlined"
          style={styles.input}
          keyboardType="numeric"
          placeholder="YYYY"
          maxLength={4}
          theme={{ colors: { primary: theme.colors.primary, background: '#F1F1F1' }, roundness: 8, fonts: { regular: { fontFamily: 'SpaceGrotesk_400Regular' } } }}
        />

        <TextInput
          label="Plat Nomor *"
          value={licensePlate}
          onChangeText={setLicensePlate}
          mode="outlined"
          style={styles.input}
          autoCapitalize="characters"
          placeholder="B 1234 CDE"
          theme={{ colors: { primary: theme.colors.primary, background: '#E3F2E7' }, roundness: 8, fonts: { regular: { fontFamily: 'SpaceGrotesk_400Regular' } } }}
        />

        <TextInput
          label="Kilometer Saat Ini"
          value={currentMileage}
          onChangeText={(text) => setCurrentMileage(formatNumberWithDots(text))}
          mode="outlined"
          style={styles.input}
          keyboardType="numeric"
          placeholder="0"
          theme={{ colors: { primary: theme.colors.primary, background: '#F1F1F1' }, roundness: 8, fonts: { regular: { fontFamily: 'SpaceGrotesk_400Regular' } } }}
        />

        <Button
          mode="contained"
          onPress={handleSave}
          loading={loading}
          disabled={loading}
          style={[styles.button, { borderRadius: 8 }]}
          labelStyle={{ fontFamily: 'SpaceGrotesk_700Bold', fontSize: 16 }}
          buttonColor={theme.colors.primary}
        >
          Simpan Kendaraan
        </Button>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '500',
  },
  segmentedButton: {
    marginBottom: 16,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
    paddingVertical: 6,
  },
});

export default AddVehicleScreen;
