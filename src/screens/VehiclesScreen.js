import React, { useState, useCallback } from 'react';
import { View, FlatList, StyleSheet, RefreshControl, Alert } from 'react-native';
import { Card, Title, Paragraph, FAB, Text, Chip, ActivityIndicator, IconButton } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { getVehicles, deleteVehicle } from '../services/firebaseService';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

const VehiclesScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { theme } = useTheme();
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

  const handleDelete = (vehicleId, vehicleName) => {
    Alert.alert(
      'Hapus Kendaraan',
      `Apakah Anda yakin ingin menghapus ${vehicleName}?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteVehicle(vehicleId);
              fetchVehicles();
            } catch (error) {
              console.error('Error deleting vehicle:', error);
              Alert.alert('Error', 'Gagal menghapus kendaraan');
            }
          },
        },
      ]
    );
  };

  const renderVehicle = ({ item }) => (
    <Card 
      style={[styles.card, { backgroundColor: theme.colors.surface }]}
      onPress={() => navigation.navigate('VehicleDetail', { vehicleId: item.id })}
    >
      <Card.Content>
        <View style={styles.cardHeader}>
          <View style={styles.cardContent}>
            <Title style={{ color: theme.colors.onSurface }}>{item.brand} {item.model}</Title>
            <Paragraph style={{ color: theme.colors.onSurfaceVariant }}>Plat: {item.licensePlate}</Paragraph>
            <Paragraph style={{ color: theme.colors.onSurfaceVariant }}>Tahun: {item.year}</Paragraph>
            <Paragraph style={{ color: theme.colors.onSurfaceVariant }}>Kilometer: {item.currentMileage?.toLocaleString() || 0} km</Paragraph>
          </View>
          <View style={styles.actions}>
            <Chip 
              icon={item.type === 'motor' ? 'motorbike' : 'car'}
              style={{ backgroundColor: theme.colors.surfaceVariant }}
              textStyle={{ color: theme.colors.onSurfaceVariant }}
            >
              {item.type === 'motor' ? 'Motor' : 'Mobil'}
            </Chip>
            <IconButton
              icon="delete"
              size={24}
              onPress={() => handleDelete(item.id, `${item.brand} ${item.model}`)}
              iconColor="#d32f2f"
            />
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.onSurfaceVariant }]}>Memuat kendaraan...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {vehicles.length === 0 ? (
        <View style={styles.centered}>
          <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>Belum ada kendaraan</Text>
          <Text style={[styles.emptySubtext, { color: theme.colors.onSurfaceVariant }]}>Tap tombol + untuk menambahkan</Text>
        </View>
      ) : (
        <FlatList
          data={vehicles}
          renderItem={renderVehicle}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />
          }
        />
      )}
      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => navigation.navigate('AddVehicle')}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  emptyText: {
    fontSize: 18,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
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
  actions: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});

export default VehiclesScreen;
