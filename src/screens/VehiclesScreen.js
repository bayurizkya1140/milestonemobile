import React, { useState, useCallback } from 'react';
import { View, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { Card, Title, Paragraph, FAB, Text, Chip, ActivityIndicator } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { getVehicles } from '../services/firebaseService';
import { useAuth } from '../contexts/AuthContext';

const VehiclesScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchVehicles = useCallback(async () => {
    if (!user || !user.uid) {
      console.log('No user logged in');
      setVehicles([]);
      setLoading(false);
      return;
    }

    try {
      console.log('Fetching vehicles for user:', user.uid);
      const data = await getVehicles(user.uid);
      console.log('Vehicles fetched:', data.length);
      setVehicles(data);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchVehicles();
    }, [fetchVehicles])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchVehicles();
  };

  const renderVehicle = ({ item }) => (
    <Card 
      style={styles.card}
      onPress={() => navigation.navigate('VehicleDetail', { vehicleId: item.id })}
    >
      <Card.Content>
        <View style={styles.cardHeader}>
          <Title>{item.brand} {item.model}</Title>
          <Chip icon={item.type === 'motor' ? 'motorbike' : 'car'}>
            {item.type === 'motor' ? 'Motor' : 'Mobil'}
          </Chip>
        </View>
        <Paragraph>Plat: {item.licensePlate}</Paragraph>
        <Paragraph>Tahun: {item.year}</Paragraph>
        <Paragraph>Kilometer: {item.currentMileage?.toLocaleString() || 0} km</Paragraph>
      </Card.Content>
    </Card>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Memuat kendaraan...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {vehicles.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>Belum ada kendaraan</Text>
          <Text style={styles.emptySubtext}>Tap tombol + untuk menambahkan</Text>
        </View>
      ) : (
        <FlatList
          data={vehicles}
          renderItem={renderVehicle}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate('AddVehicle')}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
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
    alignItems: 'center',
    marginBottom: 8,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});

export default VehiclesScreen;
