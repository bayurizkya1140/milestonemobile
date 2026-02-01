import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Alert, Platform } from 'react-native';
import { TextInput, Button, Card, Title, HelperText } from 'react-native-paper';
import { Picker } from '@react-native-picker/picker';
import { useNavigation, useRoute } from '@react-navigation/native';
import { addTax, getVehicles } from '../services/firebaseService';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Timestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

export default function AddTaxScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  const vehicleIdFromRoute = route.params?.vehicleId;
  
  const [loading, setLoading] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const [formData, setFormData] = useState({
    vehicleId: vehicleIdFromRoute || '',
    type: 'Pajak Tahunan',
    dueDate: new Date(),
    amount: '',
    isPaid: false,
    notes: '',
  });
  const [showDatePicker, setShowDatePicker] = useState(false);

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
    if (!formData.vehicleId || !formData.type) {
      Alert.alert('Error', 'Mohon pilih kendaraan dan isi jenis pajak');
      return;
    }

    try {
      setLoading(true);
      await addTax({
        vehicleId: formData.vehicleId,
        type: formData.type,
        dueDate: Timestamp.fromDate(formData.dueDate),
        amount: formData.amount ? parseFloat(formData.amount) : null,
        isPaid: formData.isPaid,
        notes: formData.notes || null,
      }, user.uid);
      Alert.alert('Sukses', 'Data pajak berhasil ditambahkan', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('Error adding tax:', error);
      Alert.alert('Error', 'Gagal menambahkan data pajak');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Title>Informasi Pajak</Title>
          
          <View style={styles.pickerContainer}>
            <Title style={styles.pickerLabel}>Kendaraan *</Title>
            <View style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 4, marginBottom: 4 }}>
              <Picker
                selectedValue={formData.vehicleId}
                onValueChange={(itemValue) => handleChange('vehicleId', itemValue)}
                style={{ height: 55 }}
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

          <View style={styles.pickerContainer}>
            <Title style={styles.pickerLabel}>Jenis Pajak *</Title>
            <View style={styles.picker}>
              <Button
                mode={formData.type === 'Pajak Tahunan' ? "contained" : "outlined"}
                onPress={() => handleChange('type', 'Pajak Tahunan')}
                style={styles.taxButton}
              >
                Pajak Tahunan
              </Button>
              <Button
                mode={formData.type === 'Pajak 5 Tahunan' ? "contained" : "outlined"}
                onPress={() => handleChange('type', 'Pajak 5 Tahunan')}
                style={styles.taxButton}
              >
                Pajak 5 Tahunan
              </Button>
            </View>
          </View>

          <Button
            mode="outlined"
            onPress={() => setShowDatePicker(true)}
            style={styles.dateButton}
          >
            Jatuh Tempo: {formData.dueDate.toLocaleDateString('id-ID')}
          </Button>

          {showDatePicker && (
            <DateTimePicker
              value={formData.dueDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, selectedDate) => {
                if (Platform.OS === 'android') {
                  setShowDatePicker(false);
                }
                if (selectedDate) {
                  handleChange('dueDate', selectedDate);
                  if (Platform.OS === 'ios') {
                    setShowDatePicker(false);
                  }
                } else if (Platform.OS === 'android') {
                  setShowDatePicker(false);
                }
              }}
            />
          )}

          <TextInput
            label="Jumlah Pajak"
            value={formData.amount}
            onChangeText={(value) => handleChange('amount', value)}
            mode="outlined"
            keyboardType="numeric"
            style={styles.input}
            placeholder="Contoh: 500000"
          />

          <View style={styles.checkboxContainer}>
            <Button
              mode={!formData.isPaid ? "contained" : "outlined"}
              onPress={() => handleChange('isPaid', false)}
              style={styles.checkboxButton}
            >
              Belum Dibayar
            </Button>
            <Button
              mode={formData.isPaid ? "contained" : "outlined"}
              onPress={() => handleChange('isPaid', true)}
              style={styles.checkboxButton}
            >
              Sudah Dibayar
            </Button>
          </View>

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
  pickerContainer: {
    marginBottom: 16,
  },
  pickerLabel: {
    fontSize: 16,
    marginBottom: 8,
  },
  picker: {
    flexDirection: 'row',
    marginHorizontal: -4,
    marginBottom: 8,
  },
  vehicleButton: {
    marginRight: 8,
    marginBottom: 8,
  },
  taxButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  input: {
    marginBottom: 12,
  },
  dateButton: {
    marginBottom: 12,
  },
  checkboxContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    marginHorizontal: -4,
  },
  checkboxButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  button: {
    marginTop: 8,
  },
});
