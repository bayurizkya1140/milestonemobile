import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Alert, Text } from 'react-native';
import { FAB, Card, Title, Paragraph, Chip, IconButton } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { getParts, deletePart, getVehicles } from '../services/firebaseService';
import { format } from 'date-fns';
import { id } from 'date-fns/locale/id';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

export default function PartsScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { theme } = useTheme();
  const [parts, setParts] = useState([]);
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
      const [partsData, vehiclesData] = await Promise.all([
        getParts(user.uid),
        getVehicles(user.uid),
      ]);
      setParts(partsData);
      setVehicles(vehiclesData);
    } catch (error) {
      console.error('Error loading data:', error);
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

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
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
            <Paragraph style={{ color: theme.colors.onSurface, fontWeight: 'bold', fontSize: 16, marginBottom: 0 }}>{getVehicleName(item.vehicleId)}</Paragraph>
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

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FlatList
        data={parts}
        renderItem={renderPart}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />
        }
        ListEmptyComponent={
          <Card style={[styles.emptyCard, { backgroundColor: theme.colors.surface }]}>
            <Card.Content>
              <Paragraph style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
                Belum ada parts. Tambahkan part pertama Anda!
              </Paragraph>
            </Card.Content>
          </Card>
        }
      />
      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => navigation.navigate('AddPart')}
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
