import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Alert } from 'react-native';
import { FAB, Card, Title, Paragraph, Chip, IconButton } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { getTaxes, deleteTax, updateTax, getVehicles } from '../services/firebaseService';
import { format } from 'date-fns';
import { id } from 'date-fns/locale/id';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

export default function TaxesScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { theme } = useTheme();
  const [taxes, setTaxes] = useState([]);
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
      const [taxesData, vehiclesData] = await Promise.all([
        getTaxes(user.uid),
        getVehicles(user.uid),
      ]);
      setTaxes(taxesData);
      setVehicles(vehiclesData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleDelete = async (taxId) => {
    Alert.alert(
      'Hapus Pajak',
      'Apakah Anda yakin ingin menghapus data pajak ini?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTax(taxId);
              loadData();
            } catch (error) {
              console.error('Error deleting tax:', error);
              Alert.alert('Error', 'Gagal menghapus data pajak');
            }
          },
        },
      ]
    );
  };

  const handleMarkAsPaid = async (taxId) => {
    try {
      await updateTax(taxId, { isPaid: true, paidDate: new Date() });
      loadData();
      Alert.alert('Sukses', 'Status pajak telah diperbarui');
    } catch (error) {
      console.error('Error updating tax:', error);
      Alert.alert('Error', 'Gagal memperbarui status pajak');
    }
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

  const isOverdue = useCallback((dueDate) => {
    if (!dueDate) return false;
    try {
      const date = dueDate?.toDate ? dueDate.toDate() : new Date(dueDate);
      return date < new Date();
    } catch (e) {
      return false;
    }
  }, []);

  const isUpcoming = useCallback((dueDate) => {
    if (!dueDate) return false;
    try {
      const due = dueDate?.toDate ? dueDate.toDate() : new Date(dueDate);
      const now = new Date();
      const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      return due >= now && due <= sevenDaysFromNow;
    } catch (e) {
      return false;
    }
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const renderTax = ({ item }) => {
    const overdue = !item.isPaid && isOverdue(item.dueDate);
    const upcoming = !item.isPaid && isUpcoming(item.dueDate);

    return (
      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <View style={styles.cardContent}>
              <Title style={{ color: theme.colors.onSurface }}>{item.type}</Title>
              <Paragraph style={{ color: theme.colors.onSurfaceVariant }}>{getVehicleName(item.vehicleId)}</Paragraph>
              {item.dueDate && (
                <Paragraph style={{ color: theme.colors.onSurfaceVariant }}>
                  Jatuh Tempo: {(() => {
                    try {
                      const date = item.dueDate?.toDate ? item.dueDate.toDate() : new Date(item.dueDate);
                      return format(date, 'dd MMM yyyy', { locale: id });
                    } catch (e) {
                      return 'Tanggal tidak valid';
                    }
                  })()}
                </Paragraph>
              )}
              {item.amount && (
                <Paragraph style={[styles.amount, { color: theme.colors.primary }]}>
                  Jumlah: Rp {item.amount.toLocaleString('id-ID')}
                </Paragraph>
              )}
              <View style={styles.statusRow}>
                {item.isPaid ? (
                  <Chip icon="check-circle" style={{ backgroundColor: theme.colors.successChipBg }} textStyle={{ color: theme.colors.successChipText }}>
                    Sudah Dibayar
                  </Chip>
                ) : overdue ? (
                  <Chip icon="alert-circle" style={{ backgroundColor: theme.colors.urgentChipBg }} textStyle={{ color: theme.colors.urgentChipText }}>
                    Terlambat
                  </Chip>
                ) : upcoming ? (
                  <Chip icon="alert" style={{ backgroundColor: theme.colors.warningChipBg }} textStyle={{ color: theme.colors.warningChipText }}>
                    Segera Jatuh Tempo
                  </Chip>
                ) : (
                  <Chip icon="clock-outline" style={{ backgroundColor: theme.colors.infoChipBg }} textStyle={{ color: theme.colors.infoChipText }}>
                    Belum Dibayar
                  </Chip>
                )}
              </View>
              {item.notes && (
                <Paragraph style={[styles.notes, { color: theme.colors.onSurfaceVariant }]}>{item.notes}</Paragraph>
              )}
            </View>
            <View style={styles.actions}>
              {!item.isPaid && (
                <IconButton
                  icon="check-circle"
                  size={24}
                  onPress={() => handleMarkAsPaid(item.id)}
                  iconColor="#4caf50"
                />
              )}
              <IconButton
                icon="delete"
                size={24}
                onPress={() => handleDelete(item.id)}
                iconColor="#d32f2f"
              />
            </View>
          </View>
        </Card.Content>
      </Card>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FlatList
        data={taxes}
        renderItem={renderTax}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />
        }
        ListEmptyComponent={
          <Card style={[styles.emptyCard, { backgroundColor: theme.colors.surface }]}>
            <Card.Content>
              <Paragraph style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
                Belum ada data pajak. Tambahkan data pajak pertama Anda!
              </Paragraph>
            </Card.Content>
          </Card>
        }
      />
      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => navigation.navigate('AddTax')}
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
  paidChip: {
  },
  overdueChip: {
  },
  upcomingChip: {
  },
  pendingChip: {
  },
  amount: {
    marginTop: 8,
    fontWeight: 'bold',
  },
  notes: {
    marginTop: 8,
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'column',
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
