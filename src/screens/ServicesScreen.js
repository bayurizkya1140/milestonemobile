import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Alert, Text } from 'react-native';
import { FAB, Card, Title, Paragraph, Chip, IconButton } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { getServices, deleteService, getVehicles } from '../services/firebaseService';
import { format } from 'date-fns';
import { id } from 'date-fns/locale/id';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

export default function ServicesScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { theme } = useTheme();
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

  // Create a vehicle map for O(1) lookups instead of O(n) find operations
  const vehicleMap = useMemo(() => {
    const map = new Map();
    vehicles.forEach(v => map.set(v.id, v));
    return map;
  }, [vehicles]);

  const getVehicleName = useCallback((vehicleId) => {
    const vehicle = vehicleMap.get(vehicleId);
    return vehicle ? `${vehicle.brand} ${vehicle.model} (${vehicle.licensePlate})` : 'Unknown';
  }, [vehicleMap]);

  const isUpcoming = useCallback((nextServiceDate) => {
    if (!nextServiceDate) return false;
    const nextDate = nextServiceDate.toDate();
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    return nextDate >= now && nextDate <= thirtyDaysFromNow;
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const getCurrentKm = useCallback((vehicleId) => {
    const vehicle = vehicleMap.get(vehicleId);
    return vehicle && vehicle.currentMileage ? vehicle.currentMileage : null;
  }, [vehicleMap]);

  const getKmRemaining = useCallback((item) => {
    if (!item.nextServiceKm) return null;
    const currentKm = getCurrentKm(item.vehicleId);
    if (currentKm === null) return null;
    return item.nextServiceKm - currentKm;
  }, [getCurrentKm]);

  const renderService = ({ item }) => {
    const kmRemaining = getKmRemaining(item);
    const urgent = kmRemaining !== null && kmRemaining > 0 && kmRemaining <= 300;
    const needsService = kmRemaining !== null && kmRemaining <= 0;

    // Hitung progress width (100 = full) berdasarkan estimasi interval per kendaraan
    const vehicle = vehicleMap.get(item.vehicleId);
    const interval = vehicle?.type === 'motor' ? 2000 : 10000;

    // Logika bar diperbarui: makin sedikit sisanya, makin panjang bar hijaunya (mendekati 100%)
    let progressWidth = 0;
    if (kmRemaining !== null) {
      const percentageCompleted = ((interval - kmRemaining) / interval) * 100;
      progressWidth = Math.max(0, Math.min(100, percentageCompleted));
    }

    return (
      <Card style={[styles.card, { backgroundColor: theme.colors.surface, overflow: 'hidden', borderRadius: theme.roundness }]}>
        <View style={{ backgroundColor: theme.colors.primary, paddingHorizontal: 16, paddingVertical: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title style={{ color: '#ffffff', fontFamily: 'SpaceGrotesk_700Bold', fontSize: 18, marginVertical: 0 }}>{item.serviceType}</Title>
          <IconButton icon="delete" size={20} iconColor="#ffffff" style={{ margin: 0 }} onPress={() => handleDelete(item.id)} />
        </View>
        <Card.Content style={{ paddingTop: 16 }}>
          <View style={styles.cardContent}>
            <Paragraph style={{ color: theme.colors.onSurface, fontWeight: 'bold', fontSize: 16, marginBottom: 0 }}>{getVehicleName(item.vehicleId)}</Paragraph>
            {item.serviceDate && (
              <Paragraph style={{ color: theme.colors.onSurfaceVariant, marginTop: 0 }}>
                Tanggal servis: {(() => {
                  try {
                    const date = item.serviceDate?.toDate ? item.serviceDate.toDate() : new Date(item.serviceDate);
                    return format(date, 'dd MMM yyyy', { locale: id });
                  } catch (e) {
                    return 'Tanggal tidak valid';
                  }
                })()}
              </Paragraph>
            )}
            {item.serviceKm && (
              <Paragraph style={{ color: theme.colors.onSurfaceVariant }}>
                KM saat servis: <Text style={{ fontWeight: 'bold' }}>{item.serviceKm.toLocaleString('id-ID')} km</Text>
              </Paragraph>
            )}
            {item.cost && (
              <Paragraph style={[styles.cost, { color: theme.colors.onSurface }]}>
                Biaya: <Text style={{ fontWeight: 'bold' }}>Rp {item.cost.toLocaleString('id-ID')}</Text>
              </Paragraph>
            )}
            {item.notes && (
              <Paragraph style={[styles.notes, { color: theme.colors.onSurfaceVariant }]}>{item.notes}</Paragraph>
            )}
            {kmRemaining !== null && (
              <View style={styles.statusRow}>
                {needsService ? (
                  <Chip icon="alert-circle" style={{ backgroundColor: '#FAD4D4', borderRadius: 16 }} textStyle={{ color: '#D32F2F', fontFamily: 'SpaceGrotesk_500Medium' }}>
                    Sudah Lewat Servis
                  </Chip>
                ) : urgent ? (
                  <Chip icon="alert" style={{ backgroundColor: '#FFF3E0', borderRadius: 16 }} textStyle={{ color: '#E65100', fontFamily: 'SpaceGrotesk_500Medium' }}>
                    Hanya {kmRemaining.toLocaleString('id-ID')} km lagi
                  </Chip>
                ) : (
                  <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F4F1EA', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, width: '100%' }}>
                    <Text style={{ color: theme.colors.primary, fontFamily: 'SpaceGrotesk_500Medium', marginRight: 12 }}>Sisa: {kmRemaining.toLocaleString('id-ID')} km</Text>
                    <View style={{ height: 8, flex: 1, backgroundColor: '#E0E0E0', borderRadius: 4, overflow: 'hidden' }}>
                      <View style={{ height: 8, width: `${progressWidth}%`, backgroundColor: theme.colors.primary, borderRadius: 4 }} />
                    </View>
                  </View>
                )}
              </View>
            )}
            {item.nextServiceKm && (
              <Paragraph style={{ color: theme.colors.onSurfaceVariant }}>
                Kilometer servis berikutnya: <Text style={{ fontWeight: 'bold' }}>{item.nextServiceKm.toLocaleString('id-ID')} km</Text>
              </Paragraph>
            )}
            {item.nextServiceType && (
              <Paragraph style={{ color: theme.colors.onSurfaceVariant }}>
                Jenis servis berikutnya: <Text style={{ fontWeight: 'bold' }}>{item.nextServiceType}</Text>
              </Paragraph>
            )}
          </View>
        </Card.Content>
      </Card>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FlatList
        data={services}
        renderItem={renderService}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />
        }
        ListEmptyComponent={
          <Card style={[styles.emptyCard, { backgroundColor: theme.colors.surface }]}>
            <Card.Content>
              <Paragraph style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
                Belum ada servis. Tambahkan servis pertama Anda!
              </Paragraph>
            </Card.Content>
          </Card>
        }
      />
      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => navigation.navigate('AddService')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    marginBottom: 4,
  },
  urgentChip: {
  },
  infoChip: {
  },
  nextServiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  upcomingChip: {
    marginLeft: 8,
  },
  cost: {
    marginTop: 8,
    fontWeight: 'bold',
  },
  notes: {
    marginTop: 8,
    fontStyle: 'italic',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  emptyCard: {
    marginTop: 32,
  },
  emptyText: {
    textAlign: 'center',
  },
});
