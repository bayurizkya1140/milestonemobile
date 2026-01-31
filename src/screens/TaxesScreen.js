import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Alert } from 'react-native';
import { FAB, Card, Title, Paragraph, Button, Chip, IconButton } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { getTaxes, deleteTax, updateTax, getVehicles } from '../services/firebaseService';
import { format } from 'date-fns';
import { id } from 'date-fns/locale/id';

export default function TaxesScreen() {
  const navigation = useNavigation();
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
        getTaxes(),
        getVehicles(),
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

  const getVehicleName = (vehicleId) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    return vehicle ? `${vehicle.brand} ${vehicle.model} (${vehicle.plateNumber})` : 'Unknown';
  };

  const isOverdue = (dueDate) => {
    if (!dueDate) return false;
    try {
      const date = dueDate?.toDate ? dueDate.toDate() : new Date(dueDate);
      return date < new Date();
    } catch (e) {
      return false;
    }
  };

  const isUpcoming = (dueDate) => {
    if (!dueDate) return false;
    try {
      const due = dueDate?.toDate ? dueDate.toDate() : new Date(dueDate);
      const now = new Date();
      const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      return due >= now && due <= sevenDaysFromNow;
    } catch (e) {
      return false;
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const renderTax = ({ item }) => {
    const overdue = !item.isPaid && isOverdue(item.dueDate);
    const upcoming = !item.isPaid && isUpcoming(item.dueDate);

    return (
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <View style={styles.cardContent}>
              <Title>{item.type}</Title>
              <Paragraph>{getVehicleName(item.vehicleId)}</Paragraph>
              {item.dueDate && (
                <Paragraph>
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
                <Paragraph style={styles.amount}>
                  Jumlah: Rp {item.amount.toLocaleString('id-ID')}
                </Paragraph>
              )}
              <View style={styles.statusRow}>
                {item.isPaid ? (
                  <Chip icon="check-circle" style={styles.paidChip}>
                    Sudah Dibayar
                  </Chip>
                ) : overdue ? (
                  <Chip icon="alert-circle" style={styles.overdueChip}>
                    Terlambat
                  </Chip>
                ) : upcoming ? (
                  <Chip icon="alert" style={styles.upcomingChip}>
                    Segera Jatuh Tempo
                  </Chip>
                ) : (
                  <Chip icon="clock-outline" style={styles.pendingChip}>
                    Belum Dibayar
                  </Chip>
                )}
              </View>
              {item.notes && (
                <Paragraph style={styles.notes}>{item.notes}</Paragraph>
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
    <View style={styles.container}>
      <FlatList
        data={taxes}
        renderItem={renderTax}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <Card style={styles.emptyCard}>
            <Card.Content>
              <Paragraph style={styles.emptyText}>
                Belum ada data pajak. Tambahkan data pajak pertama Anda!
              </Paragraph>
            </Card.Content>
          </Card>
        }
      />
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate('AddTax')}
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
  paidChip: {
    backgroundColor: '#e8f5e9',
  },
  overdueChip: {
    backgroundColor: '#ffebee',
  },
  upcomingChip: {
    backgroundColor: '#fff3e0',
  },
  pendingChip: {
    backgroundColor: '#e3f2fd',
  },
  amount: {
    marginTop: 8,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  notes: {
    marginTop: 8,
    fontStyle: 'italic',
    color: '#666',
  },
  actions: {
    flexDirection: 'column',
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
