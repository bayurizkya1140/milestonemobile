import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Alert, Platform } from 'react-native';
import { TextInput, Button, Card, Title, HelperText, Switch, Text } from 'react-native-paper';
import { Picker } from '@react-native-picker/picker';
import { useNavigation, useRoute } from '@react-navigation/native';
import { addPart, getVehicles } from '../services/firebaseService';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Timestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { formatNumberWithDots, parseFormattedNumberToInt } from '../utils/formatNumber';

export default function AddPartScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  const { theme } = useTheme();
  const vehicleIdFromRoute = route.params?.vehicleId;
  
  const [loading, setLoading] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const [formData, setFormData] = useState({
    vehicleId: vehicleIdFromRoute || '',
    name: '',
    installedKm: '',
    installedAt: new Date(),
    replacementKm: '',
    notes: '',
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [needsReplacement, setNeedsReplacement] = useState(false);

  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = async () => {
    try {
      const data = await getVehicles(user.uid);
      setVehicles(data);
    } catch (error) {
      console.error('Error loading vehicles:', error);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.vehicleId || !formData.name) {
      Alert.alert('Error', 'Mohon pilih kendaraan dan isi nama part');
      return;
    }

    // Hanya validasi kilometer jika bukan part yang perlu diganti
    if (!needsReplacement && (!formData.installedKm || !formData.replacementKm)) {
      Alert.alert('Error', 'Mohon isi kilometer terpasang dan kilometer penggantian');
      return;
    }

    try {
      setLoading(true);
      
      const partData = {
        vehicleId: formData.vehicleId,
        name: formData.name,
        notes: formData.notes || null,
        needsReplacement: needsReplacement,
      };

      // Hanya tambahkan data kilometer dan tanggal jika bukan part yang perlu diganti
      if (!needsReplacement) {
        partData.installedKm = parseFormattedNumberToInt(formData.installedKm);
        partData.installedAt = Timestamp.fromDate(formData.installedAt);
        partData.replacementKm = parseFormattedNumberToInt(formData.replacementKm);
      }

      await addPart(partData, user.uid);
      Alert.alert('Sukses', 'Part berhasil ditambahkan', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('Error adding part:', error);
      Alert.alert('Error', 'Gagal menambahkan part');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <Title style={{ color: theme.colors.onSurface }}>Informasi Part</Title>
          
          <View style={styles.pickerContainer}>
            <Title style={[styles.pickerLabel, { color: theme.colors.onSurface }]}>Kendaraan *</Title>
            <View style={{ borderWidth: 1, borderColor: theme.colors.outline, borderRadius: 4, marginBottom: 4 }}>
              <Picker
                selectedValue={formData.vehicleId}
                onValueChange={(itemValue) => handleChange('vehicleId', itemValue)}
                style={{ height: 55, color: theme.colors.onSurface }}
                dropdownIconColor={theme.colors.onSurfaceVariant}
              >
                <Picker.Item label="Pilih Kendaraan" value="" />
                {vehicles.map((vehicle) => (
                  <Picker.Item
                    key={vehicle.id}
                    label={`${vehicle.brand} ${vehicle.model} (${vehicle.licensePlate})`}
                    value={vehicle.id}
                  />
                ))}
              </Picker>
            </View>
          </View>

          <TextInput
            label="Nama Part *"
            value={formData.name}
            onChangeText={(value) => handleChange('name', value)}
            mode="outlined"
            style={styles.input}
            placeholder="Contoh: Oli Mesin, Filter Udara, Ban, dll"
          />

          <View style={[styles.switchContainer, { backgroundColor: theme.colors.infoChipBg }]}>
            <View style={styles.switchTextContainer}>
              <Text style={[styles.switchLabel, { color: theme.colors.infoChipText }]}>Part Perlu Diganti</Text>
              <Text style={[styles.switchDescription, { color: theme.colors.onSurfaceVariant }]}>
                Aktifkan jika part ini perlu diganti dan Anda tidak memiliki data kilometer
              </Text>
            </View>
            <Switch
              value={needsReplacement}
              onValueChange={setNeedsReplacement}
              color={theme.colors.primary}
            />
          </View>

          {!needsReplacement && (
            <>
              <TextInput
                label="Kilometer Terpasang *"
                value={formData.installedKm}
                onChangeText={(value) => handleChange('installedKm', formatNumberWithDots(value))}
                mode="outlined"
                keyboardType="numeric"
                style={styles.input}
                placeholder="Contoh: 10.000"
              />

              <TextInput
                label="Kilometer Penggantian *"
                value={formData.replacementKm}
                onChangeText={(value) => handleChange('replacementKm', formatNumberWithDots(value))}
                mode="outlined"
                keyboardType="numeric"
                style={styles.input}
                placeholder="Contoh: 20.000"
                helperText="Part akan perlu diganti setelah mencapai kilometer ini"
              />

              <Button
                mode="outlined"
                onPress={() => setShowDatePicker(true)}
                style={styles.dateButton}
              >
                Tanggal Terpasang: {formData.installedAt.toLocaleDateString('id-ID')}
              </Button>

              {showDatePicker && (
                <DateTimePicker
                  value={formData.installedAt}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(event, selectedDate) => {
                    if (Platform.OS === 'android') {
                      setShowDatePicker(false);
                    }
                    if (selectedDate) {
                      handleChange('installedAt', selectedDate);
                      if (Platform.OS === 'ios') {
                        setShowDatePicker(false);
                      }
                    } else if (Platform.OS === 'android') {
                      setShowDatePicker(false);
                    }
                  }}
                />
              )}
            </>
          )}

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
  },
  card: {
    margin: 16,
    elevation: 2,
  },
  pickerContainer: {
    marginBottom: 16,
  },
  pickerLabel: {
    fontSize: 16,
    marginBottom: 8,
  },
  picker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  vehicleButton: {
    marginRight: 8,
    marginBottom: 8,
  },
  input: {
    marginBottom: 12,
  },
  dateButton: {
    marginBottom: 12,
  },
  button: {
    marginTop: 8,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  switchTextContainer: {
    flex: 1,
    marginRight: 12,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  switchDescription: {
    fontSize: 12,
    marginTop: 4,
  },
});
