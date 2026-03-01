import React, { useState, useEffect, useCallback } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Card, Title, Paragraph, IconButton, Button, Portal, Modal, TextInput } from 'react-native-paper';
import { Picker } from '@react-native-picker/picker';
import { useNavigation } from '@react-navigation/native';
import { getVehicles, getServices, getParts, getTaxes, updateVehicle } from '../services/firebaseService';
import { formatNumberWithDots, parseFormattedNumberToInt } from '../utils/formatNumber';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

export default function DashboardScreen() {
  const navigation = useNavigation();
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const [vehicles, setVehicles] = useState([]);
  const [upcomingServices, setUpcomingServices] = useState([]);
  const [partsToReplace, setPartsToReplace] = useState([]);
  const [upcomingTaxes, setUpcomingTaxes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showKmModal, setShowKmModal] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [newKm, setNewKm] = useState('');
  const [updatingKm, setUpdatingKm] = useState(false);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadDashboardData();
    });
    loadDashboardData();
    return unsubscribe;
  }, [navigation]);

  const handleLogout = () => {
    Alert.alert(
      'Keluar',
      'Apakah Anda yakin ingin keluar dari akun?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Keluar',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              console.error('Logout error:', error);
            }
          },
        },
      ]
    );
  };

  const handleUpdateKm = async () => {
    if (!selectedVehicleId || !newKm) {
      Alert.alert('Error', 'Pilih kendaraan dan masukkan kilometer terbaru');
      return;
    }

    const kmValue = parseFormattedNumberToInt(newKm);
    if (isNaN(kmValue) || kmValue < 0) {
      Alert.alert('Error', 'Kilometer tidak valid');
      return;
    }

    try {
      setUpdatingKm(true);
      await updateVehicle(selectedVehicleId, { currentMileage: kmValue });
      Alert.alert('Sukses', 'Kilometer berhasil diperbarui');
      setShowKmModal(false);
      setNewKm('');
      setSelectedVehicleId('');
      loadDashboardData();
    } catch (error) {
      console.error('Error updating km:', error);
      Alert.alert('Error', 'Gagal memperbarui kilometer');
    } finally {
      setUpdatingKm(false);
    }
  };

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch all data in parallel for better performance
      const [vehiclesData, servicesData, partsData, taxesData] = await Promise.all([
        getVehicles(user.uid),
        getServices(user.uid),
        getParts(user.uid),
        getTaxes(user.uid)
      ]);
      setVehicles(vehiclesData);

      // Deklarasi now
      const now = new Date();

      // Filter upcoming services (sisa kilometer <= 1000 ATAU sudah lewat)
      const upcoming = servicesData.filter(service => {
        if (!service.vehicleId || service.nextServiceKm == null) return false;
        const vehicle = vehiclesData.find(v => v.id === service.vehicleId);
        if (!vehicle || vehicle.currentMileage == null) return false;
        const kmRemaining = service.nextServiceKm - vehicle.currentMileage;
        // Tampilkan jika sudah lewat (kmRemaining <= 0) ATAU mendekati servis (kmRemaining <= 1000)
        return kmRemaining <= 1000;
      });
      setUpcomingServices(upcoming.slice(0, 5));

      // Filter parts that need replacement (sisa kilometer <= 1000 ATAU sudah lewat ATAU needsReplacement = true)
      const partsNeedingReplacement = partsData.filter(part => {
        // Part yang ditandai perlu diganti (dari switch)
        if (part.needsReplacement === true) return true;

        // Part berdasarkan perhitungan kilometer
        if (!part.vehicleId || !part.replacementKm) return false;
        const vehicle = vehiclesData.find(v => v.id === part.vehicleId);
        if (!vehicle || !vehicle.currentMileage) return false;
        const kmRemaining = part.replacementKm - vehicle.currentMileage;
        // Tampilkan jika sudah lewat (kmRemaining <= 0) ATAU mendekati penggantian (kmRemaining <= 1000)
        return kmRemaining <= 1000;
      });
      setPartsToReplace(partsNeedingReplacement.slice(0, 5));

      // Filter upcoming taxes (next 60 days) AND overdue taxes
      const sixtyDaysFromNow = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
      const upcomingTax = taxesData.filter(tax => {
        if (!tax.dueDate || tax.isPaid) return false;
        try {
          const dueDate = tax.dueDate?.toDate ? tax.dueDate.toDate() : new Date(tax.dueDate);
          // Include overdue (dueDate < now) OR upcoming within 60 days
          return dueDate < now || (dueDate >= now && dueDate <= sixtyDaysFromNow);
        } catch (e) {
          return false;
        }
      });
      setUpcomingTaxes(upcomingTax.slice(0, 5));
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  }, [user.uid]);

  const getVehicleName = useCallback((vehicleId) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    return vehicle ? `${vehicle.brand} ${vehicle.model}` : 'Unknown';
  }, [vehicles]);

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Title style={[styles.welcomeText, { color: theme.colors.primary, fontFamily: 'SpaceGrotesk_700Bold' }]}>Selamat Datang!</Title>
        <View style={styles.headerButtons}>
          <IconButton
            icon="cog"
            size={24}
            onPress={() => navigation.navigate('Settings')}
            iconColor={theme.colors.onSurfaceVariant}
          />
          <IconButton
            icon="logout"
            size={24}
            onPress={handleLogout}
            iconColor="#d32f2f"
          />
        </View>
      </View>

      <Card style={[styles.card, { backgroundColor: theme.colors.surface, borderLeftWidth: 6, borderLeftColor: theme.colors.primary, borderRadius: theme.roundness }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 }}>
          <TouchableOpacity onPress={() => navigation.navigate('Vehicles')} style={{ flex: 1 }}>
            <Title style={{ color: theme.colors.onSurface, fontFamily: 'SpaceGrotesk_700Bold', fontSize: 18 }}>Total Kendaraan</Title>
            <Paragraph style={[styles.bigNumber, { color: theme.colors.primary, fontFamily: 'SpaceGrotesk_700Bold', paddingTop: 0, marginTop: 10 }]}>{vehicles.length}</Paragraph>
          </TouchableOpacity>
          <Button
            mode="contained"
            onPress={() => setShowKmModal(true)}
            style={{ borderRadius: 8 }}
            labelStyle={{ fontFamily: 'SpaceGrotesk_700Bold' }}
          >
            Update KM
          </Button>
        </View>
      </Card>

      <TouchableOpacity onPress={() => navigation.navigate('Services')}>
        <Card style={[styles.card, { backgroundColor: theme.colors.surface, borderLeftWidth: 6, borderLeftColor: theme.colors.primary, borderRadius: theme.roundness }]}>
          <Card.Content>
            <Title style={{ color: theme.colors.onSurface, fontFamily: 'SpaceGrotesk_700Bold', fontSize: 18 }}>Servis Mendatang</Title>
            <Paragraph style={[styles.bigNumber, { color: theme.colors.primary, fontFamily: 'SpaceGrotesk_700Bold' }]}>{upcomingServices.length}</Paragraph>
          </Card.Content>
        </Card>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Parts')}>
        <Card style={[styles.card, { backgroundColor: theme.colors.surface, borderLeftWidth: 6, borderLeftColor: theme.colors.primary, borderRadius: theme.roundness }]}>
          <Card.Content>
            <Title style={{ color: theme.colors.onSurface, fontFamily: 'SpaceGrotesk_700Bold', fontSize: 18 }}>Parts Perlu Diganti</Title>
            <Paragraph style={[styles.bigNumber, { color: theme.colors.primary, fontFamily: 'SpaceGrotesk_700Bold' }]}>{partsToReplace.length}</Paragraph>
          </Card.Content>
        </Card>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Taxes')}>
        <Card style={[styles.card, { backgroundColor: theme.colors.surface, borderLeftWidth: 6, borderLeftColor: theme.colors.primary, borderRadius: theme.roundness }]}>
          <Card.Content>
            <Title style={{ color: theme.colors.onSurface, fontFamily: 'SpaceGrotesk_700Bold', fontSize: 18 }}>Pajak Mendatang</Title>
            <Paragraph style={[styles.bigNumber, { color: theme.colors.primary, fontFamily: 'SpaceGrotesk_700Bold' }]}>{upcomingTaxes.length}</Paragraph>
          </Card.Content>
        </Card>
      </TouchableOpacity>

      <Portal>
        <Modal visible={showKmModal} onDismiss={() => setShowKmModal(false)} contentContainerStyle={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
          <Title style={{ color: theme.colors.onSurface, marginBottom: 16, fontFamily: 'SpaceGrotesk_700Bold' }}>Update Kilometer</Title>

          <View style={{ borderWidth: 1, borderColor: theme.colors.outline, borderRadius: 8, marginBottom: 16 }}>
            <Picker
              selectedValue={selectedVehicleId}
              onValueChange={(itemValue) => {
                setSelectedVehicleId(itemValue);
                const stringVal = itemValue ? itemValue.toString() : '';
                const v = vehicles.find(v => v.id === stringVal);
                if (v && v.currentMileage != null) {
                  setNewKm(formatNumberWithDots(v.currentMileage.toString()));
                } else {
                  setNewKm('');
                }
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

          <TextInput
            label="Kilometer Terbaru"
            value={newKm}
            onChangeText={(text) => setNewKm(formatNumberWithDots(text))}
            mode="outlined"
            keyboardType="numeric"
            style={{ marginBottom: 24 }}
            theme={{ colors: { primary: theme.colors.primary }, roundness: 8 }}
          />

          <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
            <Button onPress={() => setShowKmModal(false)} style={{ marginRight: 8 }}>Batal</Button>
            <Button mode="contained" onPress={handleUpdateKm} loading={updatingKm} style={{ borderRadius: 8 }}>Simpan</Button>
          </View>
        </Modal>
      </Portal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 28,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  bigNumber: {
    fontSize: 40,
    fontWeight: 'bold',
    paddingTop: 10,
    lineHeight: 50,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemCard: {
    marginTop: 8,
    backgroundColor: '#f9f9f9',
  },
  itemTitle: {
    fontWeight: 'bold',
  },
  urgentChip: {
    marginTop: 8,
    backgroundColor: '#ffebee',
  },
  modalContent: {
    padding: 20,
    margin: 20,
    borderRadius: 12,
  },
});
