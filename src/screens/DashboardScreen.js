import React, { useState, useEffect, useCallback } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Card, Title, Paragraph, IconButton } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { getVehicles, getServices, getParts, getTaxes } from '../services/firebaseService';
import { useAuth } from '../contexts/AuthContext';

export default function DashboardScreen() {
  const navigation = useNavigation();
  const { user, logout } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [upcomingServices, setUpcomingServices] = useState([]);
  const [partsToReplace, setPartsToReplace] = useState([]);
  const [upcomingTaxes, setUpcomingTaxes] = useState([]);
  const [loading, setLoading] = useState(true);

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

      // Filter parts that need replacement (sisa kilometer <= 1000 ATAU sudah lewat)
      const partsNeedingReplacement = partsData.filter(part => {
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
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Title style={styles.welcomeText}>Selamat Datang!</Title>
        <IconButton
          icon="logout"
          size={24}
          onPress={handleLogout}
          iconColor="#d32f2f"
        />
      </View>

      <TouchableOpacity onPress={() => navigation.navigate('Vehicles')}>
        <Card style={styles.card}>
          <Card.Content>
            <Title>Total Kendaraan</Title>
            <Paragraph style={styles.bigNumber}>{vehicles.length}</Paragraph>
          </Card.Content>
        </Card>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Services')}>
        <Card style={styles.card}>
          <Card.Content>
            <Title>Servis Mendatang</Title>
            <Paragraph style={styles.bigNumber}>{upcomingServices.length}</Paragraph>
          </Card.Content>
        </Card>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Parts')}>
        <Card style={styles.card}>
          <Card.Content>
            <Title>Parts Perlu Diganti</Title>
            <Paragraph style={styles.bigNumber}>{partsToReplace.length}</Paragraph>
          </Card.Content>
        </Card>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Taxes')}>
        <Card style={styles.card}>
          <Card.Content>
            <Title>Pajak Mendatang</Title>
            <Paragraph style={styles.bigNumber}>{upcomingTaxes.length}</Paragraph>
          </Card.Content>
        </Card>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  welcomeText: {
    fontSize: 24,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  bigNumber: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#2196F3',
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
});
