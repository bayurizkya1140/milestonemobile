import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { FAB, Card, Title, Paragraph, Button, IconButton } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { getVehicles, deleteVehicle } from '../services/firebaseService';

export default function VehiclesScreen({ navigation }) {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Untuk mencegah auto-redirect ke detail kendaraan saat kembali ke Vehicles
  const lastOpenedVehicleId = useRef(null);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadVehicles();
    });
    loadVehicles();
    return unsubscribe;
  }, [navigation]);

  const loadVehicles = async () => {
    try {
      setLoading(true);
      const data = await getVehicles();
      setVehicles(data);
    } catch (error) {
      console.error('Error loading vehicles:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleDelete = async (vehicleId) => {
    try {
      await deleteVehicle(vehicleId);
      loadVehicles();
    } catch (error) {
      console.error('Error deleting vehicle:', error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadVehicles();
  };

  const renderVehicle = ({ item }) => (
    <Card
      style={styles.card}
      onPress={() => {
        lastOpenedVehicleId.current = item.id;
        navigation.navigate('VehicleDetail', { vehicleId: item.id });
      }}
    >
      <Card.Content>
        <View style={styles.cardHeader}>
          <View style={styles.cardContent}>
            <Title>{item.brand} {item.model}</Title>
            <Paragraph>{item.year} • {item.plateNumber}</Paragraph>
            {item.currentKm && (
              <Paragraph style={styles.kmText}>
                Kilometer: {item.currentKm.toLocaleString('id-ID')} km
              </Paragraph>
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

  return (
    <View style={styles.container}>
      <FlatList
        data={vehicles}
        renderItem={renderVehicle}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <Card style={styles.emptyCard}>
            <Card.Content>
              <Paragraph style={styles.emptyText}>
                Belum ada kendaraan. Tambahkan kendaraan pertama Anda!
              </Paragraph>
            </Card.Content>
          </Card>
        }
      />
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate('AddVehicle')}
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
  kmText: {
    marginTop: 8,
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
