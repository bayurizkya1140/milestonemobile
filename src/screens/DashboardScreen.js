import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Card, Title, Paragraph, Button, Chip } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { getVehicles } from '../services/firebaseService';
import { getServices } from '../services/firebaseService';
import { getParts } from '../services/firebaseService';
import { getTaxes } from '../services/firebaseService';
import { format } from 'date-fns';
import { id } from 'date-fns/locale/id';

export default function DashboardScreen() {
  const navigation = useNavigation();
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

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const vehiclesData = await getVehicles();
      setVehicles(vehiclesData);

      const servicesData = await getServices();
      const partsData = await getParts();
      const taxesData = await getTaxes();

      // Deklarasi now
      const now = new Date();

      // Filter upcoming services (sisa kilometer <= 300)
      const upcoming = servicesData.filter(service => {
        if (!service.vehicleId || service.nextServiceKm == null) return false;
        const vehicle = vehiclesData.find(v => v.id === service.vehicleId);
        if (!vehicle || vehicle.currentKm == null) return false;
        const kmRemaining = service.nextServiceKm - vehicle.currentKm;
        return kmRemaining > 0 && kmRemaining <= 300;
      });
      setUpcomingServices(upcoming.slice(0, 5));

      // Filter parts that need replacement
      const partsNeedingReplacement = partsData.filter(part => {
        if (!part.vehicleId || !part.replacementKm) return false;
        const vehicle = vehiclesData.find(v => v.id === part.vehicleId);
        if (!vehicle || !vehicle.currentKm) return false;
        const kmRemaining = part.replacementKm - (vehicle.currentKm - part.installedKm);
        return kmRemaining <= 5000 && kmRemaining > 0;
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
  };

  const getVehicleName = (vehicleId) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    return vehicle ? `${vehicle.brand} ${vehicle.model}` : 'Unknown';
  };

  return (
    <ScrollView style={styles.container}>
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
