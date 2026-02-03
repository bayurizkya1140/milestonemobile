import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Alert } from 'react-native';
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
    return (
      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <View style={styles.cardContent}>
              <Title style={{ color: theme.colors.onSurface }}>{item.serviceType}</Title>
              <Paragraph style={{ color: theme.colors.onSurfaceVariant }}>{getVehicleName(item.vehicleId)}</Paragraph>
              {item.serviceDate && (
                <Paragraph style={{ color: theme.colors.onSurfaceVariant }}>
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
                <Paragraph style={{ color: theme.colors.onSurfaceVariant }}>
                  Kilometer servis berikutnya: {item.nextServiceKm.toLocaleString('id-ID')} km
                </Paragraph>
              )}
              {kmRemaining !== null && (
                <View style={styles.statusRow}>
                  {needsService ? (
                    <Chip icon="alert-circle" style={{ backgroundColor: theme.colors.urgentChipBg }} textStyle={{ color: theme.colors.urgentChipText }}>
                      Sudah Lewat Servis
                    </Chip>
                  ) : urgent ? (
                    <Chip icon="alert" style={{ backgroundColor: theme.colors.urgentChipBg }} textStyle={{ color: theme.colors.urgentChipText }}>
                      Kurang dari 300 km sebelum servis berikutnya!
                    </Chip>
                  ) : (
                    <Chip icon="information" style={{ backgroundColor: theme.colors.infoChipBg }} textStyle={{ color: theme.colors.infoChipText }}>
                      Sisa: {kmRemaining.toLocaleString('id-ID')} km
                    </Chip>
                  )}
                </View>
              )}
              {item.cost && (
                <Paragraph style={[styles.cost, { color: theme.colors.primary }]}>
                  Biaya: Rp {item.cost.toLocaleString('id-ID')}
                </Paragraph>
              )}
              {item.notes && (
                <Paragraph style={[styles.notes, { color: theme.colors.onSurfaceVariant }]}>{item.notes}</Paragraph>
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
