import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Alert, Text, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { FAB, Card, Title, Paragraph, Chip, IconButton, ActivityIndicator } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { getServices, deleteService, getVehicles, updateService } from '../services/firebaseService';
import { format } from 'date-fns';
import { id } from 'date-fns/locale/id';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function ServicesScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { theme } = useTheme();
  const [services, setServices] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState(null);


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

      // Auto-select first vehicle if none selected or previously selected vehicle no longer exists
      if (vehiclesData.length > 0) {
        setSelectedVehicleId(prev => {
          if (!prev || !vehiclesData.find(v => v.id === prev)) {
            return vehiclesData[0].id;
          }
          return prev;
        });
      } else {
        setSelectedVehicleId(null);
      }
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

  const handleNextServiceDone = async (item) => {
    try {
      if (item.isNextServiceDone) return;

      await updateService(item.id, { isNextServiceDone: true });

      setServices(prev => prev.map(s => s.id === item.id ? { ...s, isNextServiceDone: true } : s));

      navigation.navigate('AddService', { vehicleId: item.vehicleId });
    } catch (error) {
      console.error('Error updating service status:', error);
      Alert.alert('Error', 'Gagal memperbarui status servis');
    }
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

  // Filter services based on selected vehicle
  const filteredServices = useMemo(() => {
    if (!selectedVehicleId) return [];
    return services.filter(s => s.vehicleId === selectedVehicleId);
  }, [services, selectedVehicleId]);

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

  // Get service count per vehicle
  const serviceCountMap = useMemo(() => {
    const map = new Map();
    services.forEach(s => {
      map.set(s.vehicleId, (map.get(s.vehicleId) || 0) + 1);
    });
    return map;
  }, [services]);

  const renderVehicleSelector = () => {
    if (vehicles.length === 0) return null;

    return (
      <View style={styles.vehicleSelectorContainer}>
        <Text style={[styles.selectorLabel, { color: theme.colors.onSurfaceVariant, fontFamily: 'SpaceGrotesk_500Medium' }]}>
          Pilih Kendaraan
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.vehicleScrollContent}
        >
          {vehicles.map((vehicle) => {
            const isSelected = selectedVehicleId === vehicle.id;
            const serviceCount = serviceCountMap.get(vehicle.id) || 0;
            const vehicleIcon = vehicle.type === 'motor' ? 'motorbike' : 'car';

            return (
              <TouchableOpacity
                key={vehicle.id}
                activeOpacity={0.7}
                onPress={() => setSelectedVehicleId(vehicle.id)}
                style={[
                  styles.vehicleCard,
                  {
                    backgroundColor: isSelected ? theme.colors.primary : theme.colors.surface,
                    borderColor: isSelected ? theme.colors.primary : theme.colors.outline,
                    borderWidth: isSelected ? 2 : 1,
                    borderRadius: theme.roundness + 4,
                  },
                ]}
              >
                <View style={[
                  styles.vehicleIconContainer,
                  {
                    backgroundColor: isSelected ? 'rgba(255,255,255,0.2)' : theme.colors.surfaceVariant,
                  }
                ]}>
                  <MaterialCommunityIcons
                    name={vehicleIcon}
                    size={24}
                    color={isSelected ? '#ffffff' : theme.colors.primary}
                  />
                </View>
                <Text
                  style={[
                    styles.vehicleName,
                    {
                      color: isSelected ? '#ffffff' : theme.colors.onSurface,
                      fontFamily: 'SpaceGrotesk_700Bold',
                    },
                  ]}
                  numberOfLines={1}
                >
                  {vehicle.brand} {vehicle.model}
                </Text>
                <Text
                  style={[
                    styles.vehiclePlate,
                    {
                      color: isSelected ? 'rgba(255,255,255,0.8)' : theme.colors.onSurfaceVariant,
                      fontFamily: 'SpaceGrotesk_400Regular',
                    },
                  ]}
                  numberOfLines={1}
                >
                  {vehicle.licensePlate}
                </Text>
                <View style={styles.mileageRow}>
                  <MaterialCommunityIcons
                    name="speedometer"
                    size={12}
                    color={isSelected ? 'rgba(255,255,255,0.9)' : theme.colors.primary}
                  />
                  <Text
                    style={[
                      styles.vehicleMileage,
                      {
                        color: isSelected ? 'rgba(255,255,255,0.9)' : theme.colors.primary,
                        fontFamily: 'SpaceGrotesk_500Medium',
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {vehicle.currentMileage != null ? `${vehicle.currentMileage.toLocaleString('id-ID')} km` : '- km'}
                  </Text>
                </View>
                <View style={[
                  styles.serviceCountBadge,
                  {
                    backgroundColor: isSelected ? 'rgba(255,255,255,0.25)' : theme.colors.surfaceVariant,
                  }
                ]}>
                  <Text style={[
                    styles.serviceCountText,
                    {
                      color: isSelected ? '#ffffff' : theme.colors.onSurfaceVariant,
                      fontFamily: 'SpaceGrotesk_500Medium',
                    }
                  ]}>
                    {serviceCount} servis
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  const renderService = ({ item }) => {
    const kmRemaining = getKmRemaining(item);
    const urgent = kmRemaining !== null && kmRemaining > 0 && kmRemaining <= 300;
    const needsService = kmRemaining !== null && kmRemaining <= 0;

    const vehicle = vehicleMap.get(item.vehicleId);

    // Logika bar diperbarui: menggunakan interval sebenarnya dari selisih KM servis jika tersedia
    let progressWidth = 0;
    if (kmRemaining !== null) {
      // Default interval sebagai fallback
      let interval = vehicle?.type === 'motor' ? 2000 : 10000;

      // Jika ada data KM servis sebelumnya dan servis berikutnya, gunakan jarak aslinya sebagai interval penuh
      if (item.nextServiceKm && item.serviceKm && (item.nextServiceKm > item.serviceKm)) {
        interval = item.nextServiceKm - item.serviceKm;
      }

      const percentageCompleted = ((interval - kmRemaining) / interval) * 100;
      progressWidth = Math.max(0, Math.min(100, percentageCompleted));
    }

    return (
      <Card style={[styles.card, { backgroundColor: theme.colors.surface, overflow: 'hidden', borderRadius: theme.roundness }]}>
        <View style={{ backgroundColor: theme.colors.primary, paddingHorizontal: 16, paddingVertical: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title style={{ color: '#ffffff', fontFamily: 'SpaceGrotesk_700Bold', fontSize: 18, marginVertical: 0, flex: 1 }} numberOfLines={2}>{item.serviceType}</Title>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {item.isNextServiceDone ? (
              <View
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.3)',
                  borderWidth: 1,
                  borderColor: '#ffffff',
                  borderRadius: 16,
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  marginRight: 4,
                  flexDirection: 'row',
                  alignItems: 'center'
                }}
              >
                <MaterialCommunityIcons name="check" size={14} color="#ffffff" style={{ marginRight: 4 }} />
                <Text style={{ color: '#ffffff', fontSize: 10, fontFamily: 'SpaceGrotesk_500Medium' }}>
                  Terlaksana
                </Text>
              </View>
            ) : (
              <IconButton
                icon="check-circle-outline"
                size={22}
                iconColor="#ffffff"
                style={{ margin: 0, marginRight: 4 }}
                onPress={() => handleNextServiceDone(item)}
              />
            )}
            <IconButton icon="delete" size={20} iconColor="#ffffff" style={{ margin: 0 }} onPress={() => handleDelete(item.id)} />
          </View>
        </View>
        <Card.Content style={{ paddingTop: 16 }}>
          <View style={styles.cardContent}>
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

  if (loading && vehicles.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator animating={true} color={theme.colors.primary} size="large" />
      </View>
    );
  }

  // No vehicles state
  if (!loading && vehicles.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.noVehicleContainer}>
          <MaterialCommunityIcons name="car-off" size={64} color={theme.colors.onSurfaceVariant} />
          <Text style={[styles.noVehicleTitle, { color: theme.colors.onSurface, fontFamily: 'SpaceGrotesk_700Bold' }]}>
            Belum Ada Kendaraan
          </Text>
          <Text style={[styles.noVehicleSubtitle, { color: theme.colors.onSurfaceVariant, fontFamily: 'SpaceGrotesk_400Regular' }]}>
            Tambahkan kendaraan terlebih dahulu untuk mulai mencatat servis
          </Text>
          <TouchableOpacity
            style={[styles.addVehicleButton, { backgroundColor: theme.colors.primary, borderRadius: theme.roundness }]}
            onPress={() => navigation.navigate('Vehicles')}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="plus" size={20} color="#ffffff" />
            <Text style={[styles.addVehicleButtonText, { fontFamily: 'SpaceGrotesk_700Bold' }]}>
              Tambah Kendaraan
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FlatList
        data={filteredServices}
        renderItem={renderService}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />
        }
        ListHeaderComponent={renderVehicleSelector()}
        ListEmptyComponent={
          <Card style={[styles.emptyCard, { backgroundColor: theme.colors.surface, borderRadius: theme.roundness }]}>
            <Card.Content style={{ alignItems: 'center', paddingVertical: 24 }}>
              <MaterialCommunityIcons name="wrench-outline" size={48} color={theme.colors.onSurfaceVariant} style={{ marginBottom: 12 }} />
              <Paragraph style={[styles.emptyText, { color: theme.colors.onSurfaceVariant, fontFamily: 'SpaceGrotesk_500Medium' }]}>
                Belum ada servis untuk kendaraan ini.
              </Paragraph>
              <Paragraph style={[styles.emptyText, { color: theme.colors.onSurfaceVariant, fontFamily: 'SpaceGrotesk_400Regular', fontSize: 13, marginTop: 4 }]}>
                Tekan tombol + untuk menambahkan servis.
              </Paragraph>
            </Card.Content>
          </Card>
        }
      />
      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => navigation.navigate('AddService', { vehicleId: selectedVehicleId })}
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
    paddingTop: 0,
  },
  vehicleSelectorContainer: {
    paddingTop: 16,
    paddingBottom: 12,
  },
  selectorLabel: {
    fontSize: 14,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  vehicleScrollContent: {
    paddingRight: 8,
    gap: 10,
  },
  vehicleCard: {
    width: 140,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  vehicleIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  vehicleName: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 2,
  },
  vehiclePlate: {
    fontSize: 11,
    textAlign: 'center',
    marginBottom: 4,
  },
  mileageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 4,
  },
  vehicleMileage: {
    fontSize: 11,
  },
  serviceCountBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  serviceCountText: {
    fontSize: 11,
  },
  card: {
    marginBottom: 12,
    elevation: 2,
  },
  cardContent: {
    flex: 1,
  },
  statusRow: {
    marginTop: 4,
    marginBottom: 4,
  },
  cost: {
    fontWeight: 'bold',
  },
  notes: {
    fontStyle: 'italic',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  emptyCard: {
    marginTop: 16,
    elevation: 1,
  },
  emptyText: {
    textAlign: 'center',
  },
  noVehicleContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  noVehicleTitle: {
    fontSize: 20,
    marginTop: 16,
    marginBottom: 8,
  },
  noVehicleSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  addVehicleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    gap: 8,
  },
  addVehicleButtonText: {
    color: '#ffffff',
    fontSize: 15,
  },
});
