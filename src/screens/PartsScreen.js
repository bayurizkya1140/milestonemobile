import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Alert, Text, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { FAB, Card, Title, Paragraph, Chip, IconButton, ActivityIndicator } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { getParts, deletePart, getVehicles } from '../services/firebaseService';
import { format } from 'date-fns';
import { id } from 'date-fns/locale/id';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function PartsScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { theme } = useTheme();
  const [parts, setParts] = useState([]);
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
      const [partsData, vehiclesData] = await Promise.all([
        getParts(user.uid),
        getVehicles(user.uid),
      ]);
      setParts(partsData);
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
        'Gagal memuat data part.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleDelete = async (partId) => {
    Alert.alert(
      'Hapus Part',
      'Apakah Anda yakin ingin menghapus part ini?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePart(partId);
              loadData();
            } catch (error) {
              console.error('Error deleting part:', error);
              Alert.alert('Error', 'Gagal menghapus part');
            }
          },
        },
      ]
    );
  };

  // Create a vehicle map for O(1) lookups
  const vehicleMap = useMemo(() => {
    const map = new Map();
    vehicles.forEach(v => map.set(v.id, v));
    return map;
  }, [vehicles]);

  const getVehicleName = useCallback((vehicleId) => {
    const vehicle = vehicleMap.get(vehicleId);
    return vehicle ? `${vehicle.brand} ${vehicle.model} (${vehicle.licensePlate})` : 'Unknown';
  }, [vehicleMap]);

  const getKmRemaining = useCallback((part) => {
    const vehicle = vehicleMap.get(part.vehicleId);
    if (!vehicle || vehicle.currentMileage == null || part.replacementKm == null) {
      return null;
    }
    return part.replacementKm - vehicle.currentMileage;
  }, [vehicleMap]);

  // Filter parts based on selected vehicle
  const filteredParts = useMemo(() => {
    if (!selectedVehicleId) return [];
    return parts.filter(p => p.vehicleId === selectedVehicleId);
  }, [parts, selectedVehicleId]);

  // Get part count per vehicle
  const partCountMap = useMemo(() => {
    const map = new Map();
    parts.forEach(p => {
      map.set(p.vehicleId, (map.get(p.vehicleId) || 0) + 1);
    });
    return map;
  }, [parts]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

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
            const partCount = partCountMap.get(vehicle.id) || 0;
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
                    {partCount} part
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  const renderPart = ({ item }) => {
    const kmRemaining = getKmRemaining(item);
    const needsReplacement = item.needsReplacement === true || (kmRemaining !== null && kmRemaining <= 0);
    const urgent = kmRemaining !== null && kmRemaining > 0 && kmRemaining <= 300;

    // Menghitung progress width
    const vehicle = vehicleMap.get(item.vehicleId);
    let progressWidth = 0;

    // Asumsi interval untuk part (contoh: 20000 km, atau bisa dihitung thengan item.replacementKm - item.installedKm)
    let interval = 20000; // default interval
    if (item.replacementKm && item.installedKm) {
      interval = item.replacementKm - item.installedKm;
    } else if (vehicle?.type === 'motor') {
      interval = 10000;
    } else if (vehicle?.type === 'mobil') {
      interval = 40000;
    }

    if (kmRemaining !== null) {
      const percentageCompleted = ((interval - kmRemaining) / interval) * 100;
      progressWidth = Math.max(0, Math.min(100, percentageCompleted));
    }

    return (
      <Card style={[styles.card, { backgroundColor: theme.colors.surface, overflow: 'hidden', borderRadius: theme.roundness }]}>
        <View style={{ backgroundColor: theme.colors.primary, paddingHorizontal: 16, paddingVertical: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title style={{ color: '#ffffff', fontFamily: 'SpaceGrotesk_700Bold', fontSize: 18, marginVertical: 0 }}>{item.name}</Title>
          <IconButton icon="delete" size={20} iconColor="#ffffff" style={{ margin: 0 }} onPress={() => handleDelete(item.id)} />
        </View>
        <Card.Content style={{ paddingTop: 16 }}>
          <View style={styles.cardContent}>
            {item.installedKm && (
              <Paragraph style={{ color: theme.colors.onSurfaceVariant, marginTop: 0 }}>
                Terpasang pada: <Text style={{ fontWeight: 'bold' }}>{item.installedKm.toLocaleString('id-ID')} km</Text>
              </Paragraph>
            )}
            {item.installedAt && (
              <Paragraph style={{ color: theme.colors.onSurfaceVariant, marginTop: 0 }}>
                Tanggal: {(() => {
                  try {
                    const date = item.installedAt?.toDate ? item.installedAt.toDate() : new Date(item.installedAt);
                    return format(date, 'dd MMM yyyy', { locale: id });
                  } catch (e) {
                    return 'Tanggal tidak valid';
                  }
                })()}
              </Paragraph>
            )}
            {item.replacementKm && (
              <Paragraph style={{ color: theme.colors.onSurfaceVariant, marginTop: 0 }}>
                Ganti pada: <Text style={{ fontWeight: 'bold' }}>{item.replacementKm.toLocaleString('id-ID')} km</Text>
              </Paragraph>
            )}

            <View style={styles.statusRow}>
              {item.needsReplacement === true ? (
                <Chip icon="alert-circle" style={{ backgroundColor: '#FAD4D4', borderRadius: 16 }} textStyle={{ color: '#D32F2F', fontFamily: 'SpaceGrotesk_500Medium' }}>
                  Perlu Diganti Segera
                </Chip>
              ) : kmRemaining !== null ? (
                needsReplacement ? (
                  <Chip icon="alert-circle" style={{ backgroundColor: '#FAD4D4', borderRadius: 16 }} textStyle={{ color: '#D32F2F', fontFamily: 'SpaceGrotesk_500Medium' }}>
                    Sudah Lewat Penggantian
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
                )
              ) : null}
            </View>

            {item.notes && (
              <Paragraph style={[styles.notes, { color: theme.colors.onSurfaceVariant }]}>{item.notes}</Paragraph>
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
            Tambahkan kendaraan terlebih dahulu untuk mulai mencatat part
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
        data={filteredParts}
        renderItem={renderPart}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />
        }
        ListHeaderComponent={renderVehicleSelector()}
        ListEmptyComponent={
          <Card style={[styles.emptyCard, { backgroundColor: theme.colors.surface, borderRadius: theme.roundness }]}>
            <Card.Content style={{ alignItems: 'center', paddingVertical: 24 }}>
              <MaterialCommunityIcons name="cogs" size={48} color={theme.colors.onSurfaceVariant} style={{ marginBottom: 12 }} />
              <Paragraph style={[styles.emptyText, { color: theme.colors.onSurfaceVariant, fontFamily: 'SpaceGrotesk_500Medium' }]}>
                Belum ada part untuk kendaraan ini.
              </Paragraph>
              <Paragraph style={[styles.emptyText, { color: theme.colors.onSurfaceVariant, fontFamily: 'SpaceGrotesk_400Regular', fontSize: 13, marginTop: 4 }]}>
                Tekan tombol + untuk menambahkan part.
              </Paragraph>
            </Card.Content>
          </Card>
        }
      />
      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => navigation.navigate('AddPart', { vehicleId: selectedVehicleId })}
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
    marginTop: 8,
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
