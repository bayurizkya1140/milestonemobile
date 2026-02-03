import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Alert } from 'react-native';
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
    const urgent = kmRemaining !== null && kmRemaining > 0 && kmRemaining <= 1000;

    return (
      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <View style={styles.cardContent}>
              <Title style={{ color: theme.colors.onSurface }}>{item.name}</Title>
              <Paragraph style={{ color: theme.colors.onSurfaceVariant }}>{getVehicleName(item.vehicleId)}</Paragraph>
              {item.installedKm && (
                <Paragraph style={{ color: theme.colors.onSurfaceVariant }}>
                  Terpasang pada: {item.installedKm.toLocaleString('id-ID')} km
                </Paragraph>
              )}
              {item.installedAt && (
                <Paragraph style={{ color: theme.colors.onSurfaceVariant }}>
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
                <Paragraph style={{ color: theme.colors.onSurfaceVariant }}>
                  Ganti pada: {item.replacementKm.toLocaleString('id-ID')} km
                </Paragraph>
              )}
              <View style={styles.statusRow}>
                {item.needsReplacement === true ? (
                  <Chip icon="alert-circle" style={{ backgroundColor: theme.colors.urgentChipBg }} textStyle={{ color: theme.colors.urgentChipText }}>
                    Perlu Diganti
                  </Chip>
                ) : kmRemaining !== null ? (
                  needsReplacement ? (
                    <Chip icon="alert-circle" style={{ backgroundColor: theme.colors.urgentChipBg }} textStyle={{ color: theme.colors.urgentChipText }}>
                      Perlu Diganti Segera
                    </Chip>
                  ) : urgent ? (
                    <Chip icon="alert" style={{ backgroundColor: theme.colors.warningChipBg }} textStyle={{ color: theme.colors.warningChipText }}>
                      Sisa: {kmRemaining.toLocaleString('id-ID')} km
                    </Chip>
                  ) : (
                    <Chip icon="information" style={{ backgroundColor: theme.colors.infoChipBg }} textStyle={{ color: theme.colors.infoChipText }}>
                      Sisa: {kmRemaining.toLocaleString('id-ID')} km
                    </Chip>
                  )
                ) : null}
              </View>
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
