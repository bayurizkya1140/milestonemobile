import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
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

      // Filter upcoming taxes (next 60 days)
      const sixtyDaysFromNow = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
      const upcomingTax = taxesData.filter(tax => {
        if (!tax.dueDate || tax.isPaid) return false;
        const dueDate = tax.dueDate.toDate();
        return dueDate >= now && dueDate <= sixtyDaysFromNow;
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
      <Card style={styles.card}>
        <Card.Content>
          <Title>Total Kendaraan</Title>
          <Paragraph style={styles.bigNumber}>{vehicles.length}</Paragraph>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.headerRow}>
            <Title>Servis Mendatang</Title>
            <Button 
              mode="text" 
              onPress={() => navigation.navigate('Services')}
              compact
            >
              Lihat Semua
            </Button>
          </View>
          {upcomingServices.length === 0 ? (
            <Paragraph>Tidak ada servis mendatang</Paragraph>
          ) : (
            upcomingServices.map((service) => {
              const vehicle = vehicles.find(v => v.id === service.vehicleId);
              const kmRemaining = vehicle && vehicle.currentKm != null
                ? service.nextServiceKm - vehicle.currentKm
                : null;
              return (
                <Card key={service.id} style={styles.itemCard}>
                  <Card.Content>
                    <Paragraph style={styles.itemTitle}>
                      {getVehicleName(service.vehicleId)}
                    </Paragraph>
                    <Paragraph>
                      {service.nextServiceDate 
                        ? format(service.nextServiceDate.toDate(), 'dd MMM yyyy', { locale: id })
                        : 'Tanggal tidak ditentukan'}
                    </Paragraph>
                    {kmRemaining !== null && (
                      <Paragraph>
                        Sisa: {kmRemaining.toLocaleString('id-ID')} km sebelum servis berikutnya
                      </Paragraph>
                    )}
                    {kmRemaining !== null && kmRemaining <= 100 && (
                      <Chip icon="alert" style={styles.urgentChip}>
                        Segera Servis
                      </Chip>
                    )}
                    {kmRemaining !== null && kmRemaining > 100 && kmRemaining <= 300 && (
                      <Chip icon="alert" style={styles.urgentChip}>
                        Segera Servis
                      </Chip>
                    )}
                  </Card.Content>
                </Card>
              );
            })
          )}
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.headerRow}>
            <Title>Parts Perlu Diganti</Title>
            <Button 
              mode="text" 
              onPress={() => navigation.navigate('Parts')}
              compact
            >
              Lihat Semua
            </Button>
          </View>
          {partsToReplace.length === 0 ? (
            <Paragraph>Tidak ada parts yang perlu diganti</Paragraph>
          ) : (
            partsToReplace.map((part) => {
              const vehicle = vehicles.find(v => v.id === part.vehicleId);
              const kmRemaining = vehicle && vehicle.currentKm 
                ? part.replacementKm - (vehicle.currentKm - part.installedKm)
                : 0;
              return (
                <Card key={part.id} style={styles.itemCard}>
                  <Card.Content>
                    <Paragraph style={styles.itemTitle}>
                      {part.name} - {getVehicleName(part.vehicleId)}
                    </Paragraph>
                    <Paragraph>
                      Sisa: {kmRemaining.toLocaleString('id-ID')} km
                    </Paragraph>
                    {kmRemaining <= 1000 && (
                      <Chip icon="alert" style={styles.urgentChip}>
                        Perlu Diganti Segera
                      </Chip>
                    )}
                  </Card.Content>
                </Card>
              );
            })
          )}
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.headerRow}>
            <Title>Pajak Mendatang</Title>
            <Button 
              mode="text" 
              onPress={() => navigation.navigate('Taxes')}
              compact
            >
              Lihat Semua
            </Button>
          </View>
          {upcomingTaxes.length === 0 ? (
            <Paragraph>Tidak ada pajak mendatang</Paragraph>
          ) : (
            upcomingTaxes.map((tax) => {
              const vehicle = vehicles.find(v => v.id === tax.vehicleId);
              const dueDate = tax.dueDate ? tax.dueDate.toDate() : null;
              const now = new Date();
              const daysRemaining = dueDate ? Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24)) : null;
              return (
                <Card key={tax.id} style={styles.itemCard}>
                  <Card.Content>
                    <Paragraph style={styles.itemTitle}>
                      {getVehicleName(tax.vehicleId)} - {tax.type}
                    </Paragraph>
                    <Paragraph>
                      Jatuh Tempo: {dueDate ? format(dueDate, 'dd MMM yyyy', { locale: id }) : '-'}
                    </Paragraph>
                    {daysRemaining != null && daysRemaining <= 7 && daysRemaining >= 0 && (
                      <Chip icon="alert" style={styles.urgentChip}>
                        Pajak jatuh tempo kurang dari 7 hari!
                      </Chip>
                    )}
                  </Card.Content>
                </Card>
              );
            })
          )}
        </Card.Content>
      </Card>
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
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2196F3',
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
