import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { TextInput, Button, Card, Title, HelperText } from 'react-native-paper';
import { Picker } from '@react-native-picker/picker';
import { useNavigation, useRoute } from '@react-navigation/native';
import { addService, getVehicles } from '../services/firebaseService';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Platform } from 'react-native';
import { Timestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { formatNumberWithDots, parseFormattedNumberToInt, parseFormattedNumberToFloat } from '../utils/formatNumber';

export default function AddServiceScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  const { theme } = useTheme();
  const vehicleIdFromRoute = route.params?.vehicleId;
  
  const [loading, setLoading] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const [formData, setFormData] = useState({
    vehicleId: vehicleIdFromRoute || '',
    serviceType: '',
    serviceDate: new Date(),
    nextServiceDate: null,
    nextServiceKm: '',
    cost: '',
    notes: '',
  });
  const [vehicleError, setVehicleError] = useState(false);
  const [showServiceDatePicker, setShowServiceDatePicker] = useState(false);
  const [showNextServiceDatePicker, setShowNextServiceDatePicker] = useState(false);

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
    if (!formData.vehicleId || !formData.serviceType) {
      if (!formData.vehicleId) setVehicleError(true);
      Alert.alert('Error', 'Mohon pilih kendaraan dan isi jenis servis');
      return;
    }

    try {
      setLoading(true);
      const serviceData = {
        vehicleId: formData.vehicleId,
        serviceType: formData.serviceType,
        serviceDate: Timestamp.fromDate(formData.serviceDate),
        cost: formData.cost ? parseFormattedNumberToFloat(formData.cost) : null,
        notes: formData.notes || null,
      };

      if (formData.nextServiceDate) {
        serviceData.nextServiceDate = Timestamp.fromDate(formData.nextServiceDate);
      }

      if (formData.nextServiceKm) {
        serviceData.nextServiceKm = parseFormattedNumberToInt(formData.nextServiceKm);
      }

      await addService(serviceData, user.uid);
      Alert.alert('Sukses', 'Servis berhasil ditambahkan', [
        { 
          text: 'OK', 
          onPress: () => {
            // Go back - ServicesScreen akan auto refresh karena ada focus listener
            navigation.goBack();
          }
        }
      ]);
    } catch (error) {
      console.error('Error adding service:', error);
      Alert.alert('Error', 'Gagal menambahkan servis');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <Title style={{ color: theme.colors.onSurface }}>Informasi Servis</Title>
          
          <View style={styles.pickerContainer}>
            <Title style={[styles.pickerLabel, { color: theme.colors.onSurface }]}>Kendaraan *</Title>
            <View style={{ borderWidth: 1, borderColor: vehicleError ? 'red' : theme.colors.outline, borderRadius: 4, marginBottom: 4 }}>
              <Picker
                selectedValue={formData.vehicleId}
                onValueChange={(itemValue) => {
                  handleChange('vehicleId', itemValue);
                  setVehicleError(false);
                }}
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
            {vehicleError && (
              <HelperText type="error" visible={vehicleError}>
                Kendaraan wajib dipilih
              </HelperText>
            )}
          </View>

          <TextInput
            label="Jenis Servis *"
            value={formData.serviceType}
            onChangeText={(value) => handleChange('serviceType', value)}
            mode="outlined"
            style={styles.input}
            placeholder="Contoh: Servis Rutin, Ganti Oli, dll"
          />

          <Button
            mode="outlined"
            onPress={() => setShowServiceDatePicker(true)}
            style={styles.dateButton}
          >
            Tanggal Servis: {formData.serviceDate.toLocaleDateString('id-ID')}
          </Button>

          {showServiceDatePicker && (
            <DateTimePicker
              value={formData.serviceDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, selectedDate) => {
                if (Platform.OS === 'android') {
                  setShowServiceDatePicker(false);
                }
                if (selectedDate) {
                  handleChange('serviceDate', selectedDate);
                  if (Platform.OS === 'ios') {
                    setShowServiceDatePicker(false);
                  }
                } else if (Platform.OS === 'android') {
                  setShowServiceDatePicker(false);
                }
              }}
            />
          )}



          <Button
            mode="outlined"
            onPress={() => setShowNextServiceDatePicker(true)}
            style={styles.dateButton}
          >
            Servis Berikutnya: {formData.nextServiceDate 
              ? formData.nextServiceDate.toLocaleDateString('id-ID')
              : 'Pilih Tanggal (Opsional)'}
          </Button>

          {showNextServiceDatePicker && (
            <DateTimePicker
              value={formData.nextServiceDate || new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, selectedDate) => {
                if (Platform.OS === 'android') {
                  setShowNextServiceDatePicker(false);
                }
                if (selectedDate) {
                  handleChange('nextServiceDate', selectedDate);
                  if (Platform.OS === 'ios') {
                    setShowNextServiceDatePicker(false);
                  }
                } else if (Platform.OS === 'android') {
                  setShowNextServiceDatePicker(false);
                }
              }}
            />
          )}

          <TextInput
            label="Servis Berikutnya pada Kilometer"
            value={formData.nextServiceKm}
            onChangeText={(value) => handleChange('nextServiceKm', formatNumberWithDots(value))}
            mode="outlined"
            keyboardType="numeric"
            style={styles.input}
            placeholder="Contoh: 50.000"
          />

          <TextInput
            label="Biaya"
            value={formData.cost}
            onChangeText={(value) => handleChange('cost', formatNumberWithDots(value))}
            mode="outlined"
            keyboardType="numeric"
            style={styles.input}
            placeholder="Contoh: 500.000"
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
});
