import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Alert } from 'react-native';
import { FAB, Card, Title, Paragraph, Button, Chip, IconButton } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { getParts, deletePart, getVehicles } from '../services/firebaseService';
import { format } from 'date-fns';
import { id } from 'date-fns/locale/id';
import { useAuth } from '../contexts/AuthContext';

export default function PartsScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
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

  const getVehicleName = (vehicleId) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    return vehicle ? `${vehicle.brand} ${vehicle.model} (${vehicle.licensePlate})` : 'Unknown';
  };

  const getKmRemaining = (part) => {
    const vehicle = vehicles.find(v => v.id === part.vehicleId);
    if (!vehicle || vehicle.currentKm == null || part.replacementKm == null) {
      return null;
    }
    return part.replacementKm - vehicle.currentKm;
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const renderPart = ({ item }) => {
    const kmRemaining = getKmRemaining(item);
    const needsReplacement = kmRemaining !== null && kmRemaining <= 0;
    const urgent = kmRemaining !== null && kmRemaining > 0 && kmRemaining <= 1000;

    return (
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <View style={styles.cardContent}>
              <Title>{item.name}</Title>
              <Paragraph>{getVehicleName(item.vehicleId)}</Paragraph>
              {item.installedKm && (
                <Paragraph>
                  Terpasang pada: {item.installedKm.toLocaleString('id-ID')} km
                </Paragraph>
              )}
              {item.installedAt && (
                <Paragraph>
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
                <Paragraph>
                  Ganti pada: {item.replacementKm.toLocaleString('id-ID')} km
                </Paragraph>
              )}
              {kmRemaining !== null && (
                <View style={styles.statusRow}>
                  {needsReplacement ? (
                    <Chip icon="alert-circle" style={styles.urgentChip}>
                      Perlu Diganti Segera
                    </Chip>
                  ) : urgent ? (
                    <Chip icon="alert" style={styles.urgentChip}>
                      Sisa: {kmRemaining.toLocaleString('id-ID')} km
                    </Chip>
                  ) : (
                    <Chip icon="information" style={styles.infoChip}>
                      Sisa: {kmRemaining.toLocaleString('id-ID')} km
                    </Chip>
                  )}
                </View>
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
        data={parts}
        renderItem={renderPart}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <Card style={styles.emptyCard}>
            <Card.Content>
              <Paragraph style={styles.emptyText}>
                Belum ada parts. Tambahkan part pertama Anda!
              </Paragraph>
            </Card.Content>
          </Card>
        }
      />
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate('AddPart')}
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
