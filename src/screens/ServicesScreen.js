import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Alert } from 'react-native';
import { FAB, Card, Title, Paragraph, Button, Chip, IconButton } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { getServices, deleteService, getVehicles } from '../services/firebaseService';
import { format } from 'date-fns';
import { id } from 'date-fns/locale/id';
import { useAuth } from '../contexts/AuthContext';

export default function ServicesScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [services, setServices] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadData();
    });
    loadData();
    return unsubscribe;
  }, [navigation]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [servicesData, vehiclesData] = await Promise.all([
        getServices(user.uid),
        getVehicles(user.uid),
      ]);
      console.log('Loaded services:', servicesData.length);
      setServices(servicesData);
      setVehicles(vehiclesData);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert(
        'Error', 
        'Gagal memuat data servis. Pastikan Firestore sudah diaktifkan dan index sudah dibuat jika diperlukan.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleDelete = async (serviceId) => {
    Alert.alert(
      'Hapus Servis',
      'Apakah Anda yakin ingin menghapus servis ini?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteService(serviceId);
              loadData();
            } catch (error) {
              console.error('Error deleting service:', error);
              Alert.alert('Error', 'Gagal menghapus servis');
            }
          },
        },
      ]
    );
  };

  const getVehicleName = (vehicleId) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    return vehicle ? `${vehicle.brand} ${vehicle.model} (${vehicle.licensePlate})` : 'Unknown';
  };

  const isUpcoming = (nextServiceDate) => {
    if (!nextServiceDate) return false;
    const nextDate = nextServiceDate.toDate();
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    return nextDate >= now && nextDate <= thirtyDaysFromNow;
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const getCurrentKm = (vehicleId) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    return vehicle && vehicle.currentKm ? vehicle.currentKm : null;
  };

  const getKmRemaining = (item) => {
    if (!item.nextServiceKm) return null;
    const currentKm = getCurrentKm(item.vehicleId);
    if (currentKm === null) return null;
    return item.nextServiceKm - currentKm;
  };

  const renderService = ({ item }) => {
    const kmRemaining = getKmRemaining(item);
    const urgent = kmRemaining !== null && kmRemaining > 0 && kmRemaining <= 300;
    const needsService = kmRemaining !== null && kmRemaining <= 0;
    return (
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <View style={styles.cardContent}>
              <Title>{item.serviceType}</Title>
              <Paragraph>{getVehicleName(item.vehicleId)}</Paragraph>
              {item.serviceDate && (
                <Paragraph>
                  Tanggal: {(() => {
                    try {
                      const date = item.serviceDate?.toDate ? item.serviceDate.toDate() : new Date(item.serviceDate);
                      return format(date, 'dd MMM yyyy', { locale: id });
                    } catch (e) {
                      return 'Tanggal tidak valid';
                    }
                  })()}
                </Paragraph>
              )}
              {item.nextServiceKm && (
                <Paragraph>
                  Kilometer servis berikutnya: {item.nextServiceKm.toLocaleString('id-ID')} km
                </Paragraph>
              )}
              {kmRemaining !== null && (
                <View style={styles.statusRow}>
                  {needsService ? (
                    <Chip icon="alert-circle" style={styles.urgentChip}>
                      Sudah Lewat Servis
                    </Chip>
                  ) : urgent ? (
                    <Chip icon="alert" style={styles.urgentChip}>
                      Kurang dari 300 km sebelum servis berikutnya!
                    </Chip>
                  ) : (
                    <Chip icon="information" style={styles.infoChip}>
                      Sisa: {kmRemaining.toLocaleString('id-ID')} km
                    </Chip>
                  )}
                </View>
              )}
              {item.cost && (
                <Paragraph style={styles.cost}>
                  Biaya: Rp {item.cost.toLocaleString('id-ID')}
                </Paragraph>
              )}
              {item.notes && (
                <Paragraph style={styles.notes}>{item.notes}</Paragraph>
              )}
            </View>
            <IconButton
              icon="delete"
              size={24}
              onPress={() => handleDelete(item.id)}
              iconColor="#d32f2f"
            />
          </View>
        </Card.Content>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={services}
        renderItem={renderService}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <Card style={styles.emptyCard}>
            <Card.Content>
              <Paragraph style={styles.emptyText}>
                Belum ada servis. Tambahkan servis pertama Anda!
              </Paragraph>
            </Card.Content>
          </Card>
        }
      />
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate('AddService')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  list: {
    padding: 16,
  },
  card: {
    marginBottom: 12,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardContent: {
    flex: 1,
  },
  statusRow: {
    marginTop: 8,
  },
  urgentChip: {
    backgroundColor: '#ffebee',
  },
  infoChip: {
    backgroundColor: '#e3f2fd',
  },
  nextServiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  upcomingChip: {
    marginLeft: 8,
    backgroundColor: '#fff3e0',
  },
  cost: {
    marginTop: 8,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  notes: {
    marginTop: 8,
    fontStyle: 'italic',
    color: '#666',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#2196F3',
  },
  emptyCard: {
    marginTop: 32,
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
  },
});
