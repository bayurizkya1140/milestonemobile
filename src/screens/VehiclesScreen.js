import React, { useState, useCallback } from 'react';
import { View, FlatList, StyleSheet, RefreshControl, Alert, TouchableOpacity, Text } from 'react-native';
import { Card, Title, Paragraph, FAB, Chip, ActivityIndicator, IconButton } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { getVehicles, deleteVehicle } from '../services/firebaseService';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';

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
              await deleteVehicle(vehicleId, user.uid);
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

  const renderVehicle = ({ item }) => {
    const vehicleIcon = item.type === 'motor' ? 'motorbike' : 'car';
    const vehicleLabel = item.type === 'motor' ? 'Motor' : 'Mobil';

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => navigation.navigate('VehicleDetail', { vehicleId: item.id })}
      >
        <View style={[styles.vehicleCard, { backgroundColor: theme.colors.surface, borderRadius: theme.roundness + 4 }]}>
          {/* Header with icon and title */}
          <View style={[styles.vehicleHeader, { backgroundColor: theme.colors.primary, borderTopLeftRadius: theme.roundness + 4, borderTopRightRadius: theme.roundness + 4 }]}>
            <View style={styles.vehicleHeaderLeft}>
              <View style={styles.vehicleIconCircle}>
                <MaterialCommunityIcons name={vehicleIcon} size={24} color="#ffffff" />
              </View>
              <View style={styles.vehicleHeaderText}>
                <Text style={[styles.vehicleName, { fontFamily: 'SpaceGrotesk_700Bold' }]} numberOfLines={1}>
                  {item.brand} {item.model}
                </Text>
                <Text style={[styles.vehiclePlate, { fontFamily: 'SpaceGrotesk_400Regular' }]}>
                  {item.licensePlate}
                </Text>
              </View>
            </View>
            <View style={styles.vehicleHeaderRight}>
              <View style={styles.typeBadge}>
                <Text style={[styles.typeBadgeText, { fontFamily: 'SpaceGrotesk_500Medium' }]}>{vehicleLabel}</Text>
              </View>
            </View>
          </View>

          {/* Body with info rows */}
          <View style={styles.vehicleBody}>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: theme.colors.onSurfaceVariant, fontFamily: 'SpaceGrotesk_400Regular' }]}>
                📅  Tahun
              </Text>
              <Text style={[styles.infoValue, { color: theme.colors.onSurface, fontFamily: 'SpaceGrotesk_500Medium' }]}>
                {item.year}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: theme.colors.onSurfaceVariant, fontFamily: 'SpaceGrotesk_400Regular' }]}>
                🔧  Kilometer
              </Text>
              <Text style={[styles.infoValue, { color: theme.colors.onSurface, fontFamily: 'SpaceGrotesk_500Medium' }]}>
                {item.currentMileage?.toLocaleString('id-ID') || 0} km
              </Text>
            </View>

            {item.color && (
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: theme.colors.onSurfaceVariant, fontFamily: 'SpaceGrotesk_400Regular' }]}>
                  🎨  Warna
                </Text>
                <Text style={[styles.infoValue, { color: theme.colors.onSurface, fontFamily: 'SpaceGrotesk_500Medium' }]}>
                  {item.color}
                </Text>
              </View>
            )}

            {/* Footer: Delete + Tap hint */}
            <View style={styles.vehicleFooter}>
              <TouchableOpacity
                onPress={() => handleDelete(item.id, `${item.brand} ${item.model}`)}
                style={styles.deleteButton}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <MaterialCommunityIcons name="delete-outline" size={18} color="#d32f2f" />
                <Text style={[styles.deleteText, { fontFamily: 'SpaceGrotesk_500Medium' }]}>Hapus</Text>
              </TouchableOpacity>

              <View style={styles.tapHint}>
                <Text style={[styles.tapHintText, { color: theme.colors.primary, fontFamily: 'SpaceGrotesk_500Medium' }]}>
                  Lihat Detail
                </Text>
                <MaterialCommunityIcons name="chevron-right" size={20} color={theme.colors.primary} />
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

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
          <MaterialCommunityIcons name="car-off" size={64} color={theme.colors.onSurfaceVariant} />
          <Text style={[styles.emptyText, { color: theme.colors.onSurface, fontFamily: 'SpaceGrotesk_700Bold' }]}>
            Belum ada kendaraan
          </Text>
          <Text style={[styles.emptySubtext, { color: theme.colors.onSurfaceVariant, fontFamily: 'SpaceGrotesk_400Regular' }]}>
            Tap tombol + untuk menambahkan
          </Text>
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
    paddingHorizontal: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  emptyText: {
    fontSize: 20,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  list: {
    padding: 16,
  },
  // Vehicle Card
  vehicleCard: {
    marginBottom: 14,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  vehicleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  vehicleHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  vehicleIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  vehicleHeaderText: {
    flex: 1,
  },
  vehicleName: {
    color: '#ffffff',
    fontSize: 17,
  },
  vehiclePlate: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    marginTop: 2,
  },
  vehicleHeaderRight: {
    marginLeft: 8,
  },
  typeBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  typeBadgeText: {
    color: '#ffffff',
    fontSize: 12,
  },
  // Body
  vehicleBody: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  infoLabel: {
    fontSize: 13,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  // Footer
  vehicleFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  deleteText: {
    color: '#d32f2f',
    fontSize: 13,
    marginLeft: 4,
  },
  tapHint: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tapHintText: {
    fontSize: 13,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});

export default VehiclesScreen;
