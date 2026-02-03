import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { Card, Title, Paragraph, Button, TextInput, Chip } from 'react-native-paper';
import { useRoute, useNavigation } from '@react-navigation/native';
import { getVehicles, updateVehicle } from '../services/firebaseService';
import { getServices } from '../services/firebaseService';
import { getParts } from '../services/firebaseService';
import { getTaxes } from '../services/firebaseService';
import { format } from 'date-fns';
import { id } from 'date-fns/locale/id';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { formatNumberWithDots, parseFormattedNumberToInt } from '../utils/formatNumber';

// Helper function to format date from Firestore Timestamp
const getFormattedDate = (timestamp) => {
  if (!timestamp) return null;
  try {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return format(date, 'd MMMM yyyy', { locale: id });
  } catch (error) {
    return null;
  }
};

export default function VehicleDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { user } = useAuth();
  const { theme } = useTheme();
  const { vehicleId } = route.params;
  const [vehicle, setVehicle] = useState(null);
  const [services, setServices] = useState([]);
  const [parts, setParts] = useState([]);
  const [taxes, setTaxes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingKm, setEditingKm] = useState(false);
  const [newKm, setNewKm] = useState('');

  useEffect(() => {
    loadVehicleData();
  }, [vehicleId]);

  const loadVehicleData = async () => {
    try {
      setLoading(true);
      const vehicles = await getVehicles(user.uid);
      const vehicleData = vehicles.find(v => v.id === vehicleId);
      setVehicle(vehicleData);
      setNewKm(vehicleData?.currentMileage ? formatNumberWithDots(vehicleData.currentMileage) : '');

      const [servicesData, partsData, taxesData] = await Promise.all([
        getServices(user.uid, vehicleId),
        getParts(user.uid, vehicleId),
        getTaxes(user.uid, vehicleId),
      ]);

      setServices(servicesData);
      setParts(partsData);
      setTaxes(taxesData);
    } catch (error) {
      console.error('Error loading vehicle data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateKm = async () => {
    const parsedKm = parseFormattedNumberToInt(newKm);
    if (!newKm || parsedKm === 0) {
      Alert.alert('Error', 'Mohon masukkan kilometer yang valid');
      return;
    }

    try {
      await updateVehicle(vehicleId, { currentMileage: parsedKm });
      setEditingKm(false);
      loadVehicleData();
      Alert.alert('Sukses', 'Kilometer berhasil diperbarui');
    } catch (error) {
      console.error('Error updating km:', error);
      Alert.alert('Error', 'Gagal memperbarui kilometer');
    }
  };

  if (loading || !vehicle) {
    return null;
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <Title style={{ color: theme.colors.onSurface }}>{vehicle.brand} {vehicle.model}</Title>
          <Paragraph style={{ color: theme.colors.onSurfaceVariant }}>{vehicle.year} • {vehicle.licensePlate}</Paragraph>
          {vehicle.color && <Paragraph style={{ color: theme.colors.onSurfaceVariant }}>Warna: {vehicle.color}</Paragraph>}
          
          <View style={[styles.kmSection, { backgroundColor: theme.colors.surfaceVariant }]}>
            <View style={styles.kmRow}>
              <Paragraph style={[styles.kmLabel, { color: theme.colors.onSurface }]}>Kilometer Saat Ini:</Paragraph>
              {!editingKm ? (
                <>
                  <Paragraph style={[styles.kmValue, { color: theme.colors.primary }]}>
                    {vehicle.currentMileage?.toLocaleString('id-ID') || 0} km
                  </Paragraph>
                  <Button onPress={() => setEditingKm(true)} compact>
                    Edit
                  </Button>
                </>
              ) : (
                <View style={styles.kmEditRow}>
                  <TextInput
                    value={newKm}
                    onChangeText={(text) => setNewKm(formatNumberWithDots(text))}
                    keyboardType="numeric"
                    mode="outlined"
                    style={[styles.kmInput, { backgroundColor: theme.colors.surface }]}
                  />
                  <Button onPress={handleUpdateKm} compact>Simpan</Button>
                  <Button onPress={() => setEditingKm(false)} compact>Batal</Button>
                </View>
              )}
            </View>
          </View>

          {vehicle.notes && (
            <View style={styles.notesSection}>
              <Paragraph style={[styles.notesLabel, { color: theme.colors.onSurface }]}>Catatan:</Paragraph>
              <Paragraph style={{ color: theme.colors.onSurfaceVariant }}>{vehicle.notes}</Paragraph>
            </View>
          )}
        </Card.Content>
      </Card>

      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <View style={styles.sectionHeader}>
            <Title style={{ color: theme.colors.onSurface }}>Servis Terakhir</Title>
            <Button 
              mode="text" 
              onPress={() => navigation.navigate('Services', { screen: 'AddService', params: { vehicleId } })}
              compact
            >
              Tambah
            </Button>
          </View>
          {services.length === 0 ? (
            <Paragraph style={{ color: theme.colors.onSurfaceVariant }}>Belum ada servis</Paragraph>
          ) : (
            services.slice(0, 3).map((service) => {
              // Ambil kilometer saat servis, kilometer servis berikutnya, dan sisa kilometer
              const kmSaatServis = service.kilometer || null;
              const nextServiceKm = service.nextServiceKm || null;
              const currentKm = vehicle.currentMileage || null;
              const kmRemaining = (nextServiceKm && currentKm !== null) ? (nextServiceKm - currentKm) : null;
              const urgent = kmRemaining !== null && kmRemaining > 0 && kmRemaining <= 300;
              const needsService = kmRemaining !== null && kmRemaining <= 0;
              return (
                <View key={service.id} style={[styles.item, { borderBottomColor: theme.colors.outline }]}>
                  <Paragraph style={[styles.itemTitle, { color: theme.colors.onSurface }]}>{service.serviceType}</Paragraph>
                  <Paragraph style={{ color: theme.colors.onSurfaceVariant }}>
                    {service.serviceDate 
                      ? format(service.serviceDate.toDate(), 'dd MMM yyyy', { locale: id })
                      : 'Tanggal tidak ditentukan'}
                  </Paragraph>
                  {kmSaatServis !== null && (
                    <Paragraph style={{ color: theme.colors.onSurfaceVariant }}>
                      Kilometer saat servis: {kmSaatServis.toLocaleString('id-ID')} km
                    </Paragraph>
                  )}
                  {nextServiceKm !== null && (
                    <Paragraph style={{ color: theme.colors.onSurfaceVariant }}>
                      Kilometer servis berikutnya: {nextServiceKm.toLocaleString('id-ID')} km
                    </Paragraph>
                  )}
                  {kmRemaining !== null && (
                    <View style={{marginTop: 4}}>
                      {needsService ? (
                        <Chip icon="alert-circle" style={{ backgroundColor: theme.colors.urgentChipBg }} textStyle={{ color: theme.colors.urgentChipText }}>
                          Sudah Lewat Servis
                        </Chip>
                      ) : urgent ? (
                        <Chip icon="alert" style={{ backgroundColor: theme.colors.urgentChipBg }} textStyle={{ color: theme.colors.urgentChipText }}>
                          Kurang dari 300 km sebelum servis berikutnya!
                        </Chip>
                      ) : (
                        <Chip icon="information" style={{ backgroundColor: theme.colors.infoChipBg }} textStyle={{ color: theme.colors.infoChipText }}>
                          Sisa: {kmRemaining.toLocaleString('id-ID')} km
                        </Chip>
                      )}
                    </View>
                  )}
                  {service.nextServiceDate && (
                    <Paragraph style={[styles.nextService, { color: theme.colors.onSurfaceVariant }]}>
                      Servis berikutnya: {getFormattedDate(service.nextServiceDate) || 'Tanggal tidak ditentukan'}
                    </Paragraph>
                  )}
                </View>
              );
            })
          )}
        </Card.Content>
      </Card>

      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <View style={styles.sectionHeader}>
            <Title style={{ color: theme.colors.onSurface }}>Parts & Komponen</Title>
            <Button 
              mode="text" 
              onPress={() => navigation.navigate('Parts', { screen: 'AddPart', params: { vehicleId } })}
              compact
            >
              Tambah
            </Button>
          </View>
          {parts.length === 0 ? (
            <Paragraph style={{ color: theme.colors.onSurfaceVariant }}>Belum ada parts</Paragraph>
          ) : (
            parts.slice(0, 3).map((part) => {
              let kmRemaining = null;
              if (
                vehicle.currentMileage != null &&
                part.replacementKm != null
              ) {
                kmRemaining = part.replacementKm - vehicle.currentMileage;
              }
              
              // Cek apakah part ditandai perlu diganti (dari switch)
              const isNeedsReplacement = part.needsReplacement === true;
              
              return (
                <View key={part.id} style={[styles.item, { borderBottomColor: theme.colors.outline }]}>
                  <Paragraph style={[styles.itemTitle, { color: theme.colors.onSurface }]}>{part.name}</Paragraph>
                  
                  {/* Tampilkan peringatan untuk part yang perlu diganti */}
                  {isNeedsReplacement ? (
                    <View>
                      <Chip icon="alert-circle" style={{ backgroundColor: theme.colors.urgentChipBg }} textStyle={{ color: theme.colors.urgentChipText }}>
                        Part Perlu Diganti!
                      </Chip>
                      {part.notes && (
                        <Paragraph style={[styles.partNotes, { color: theme.colors.onSurfaceVariant }]}>Catatan: {part.notes}</Paragraph>
                      )}
                    </View>
                  ) : (
                    <>
                      <Paragraph style={{ color: theme.colors.onSurfaceVariant }}>
                        Terpasang: {part.installedKm?.toLocaleString('id-ID')} km
                      </Paragraph>
                      <Paragraph style={{ color: theme.colors.onSurfaceVariant }}>
                        Ganti pada: {part.replacementKm != null ? part.replacementKm.toLocaleString('id-ID') : ''} km
                      </Paragraph>
                      {kmRemaining != null && (
                        kmRemaining <= 0 ? (
                          <Chip icon="alert-circle" style={{ backgroundColor: theme.colors.urgentChipBg }} textStyle={{ color: theme.colors.urgentChipText }}>
                            Perlu Diganti Segera
                          </Chip>
                        ) : kmRemaining <= 1000 ? (
                          <Chip icon="alert" style={{ backgroundColor: theme.colors.warningChipBg }} textStyle={{ color: theme.colors.warningChipText }}>
                            Sisa: {kmRemaining.toLocaleString('id-ID')} km
                          </Chip>
                        ) : (
                          <Chip icon="information" style={{ backgroundColor: theme.colors.infoChipBg }} textStyle={{ color: theme.colors.infoChipText }}>
                            Sisa: {kmRemaining.toLocaleString('id-ID')} km
                          </Chip>
                        )
                      )}
                    </>
                  )}
                </View>
              );
            })
          )}
        </Card.Content>
      </Card>

      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <View style={styles.sectionHeader}>
            <Title style={{ color: theme.colors.onSurface }}>Pajak</Title>
            <Button 
              mode="text" 
              onPress={() => navigation.navigate('Taxes', { screen: 'AddTax', params: { vehicleId } })}
              compact
            >
              Tambah
            </Button>
          </View>
          {taxes.length === 0 ? (
            <Paragraph style={{ color: theme.colors.onSurfaceVariant }}>Belum ada data pajak</Paragraph>
          ) : (
            taxes.slice(0, 3).map((tax) => {
              // Safe date parsing for tax
              const getTaxFormattedDate = (dateField) => {
                try {
                  if (!dateField) return null;
                  const date = dateField?.toDate ? dateField.toDate() : new Date(dateField);
                  return format(date, 'dd MMM yyyy', { locale: id });
                } catch (e) {
                  return null;
                }
              };
              
              return (
              <View key={tax.id} style={[styles.item, { borderBottomColor: theme.colors.outline }]}>
                <Paragraph style={[styles.itemTitle, { color: theme.colors.onSurface }]}>{tax.type}</Paragraph>
                <Paragraph style={{ color: theme.colors.onSurfaceVariant }}>
                  Jatuh Tempo: {getTaxFormattedDate(tax.dueDate) || 'Tanggal tidak ditentukan'}
                </Paragraph>
                {tax.isPaid ? (
                  <Chip icon="check-circle" style={{ backgroundColor: theme.colors.successChipBg }} textStyle={{ color: theme.colors.successChipText }}>Sudah Dibayar</Chip>
                ) : (
                  <Chip icon="alert" style={{ backgroundColor: theme.colors.warningChipBg }} textStyle={{ color: theme.colors.warningChipText }}>Belum Dibayar</Chip>
                )}
              </View>
            );
            })
          )}
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    margin: 16,
    marginBottom: 8,
    elevation: 2,
  },
  kmSection: {
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
  },
  kmRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  kmLabel: {
    fontWeight: 'bold',
  },
  kmValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  kmEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
  },
  kmInput: {
    flexGrow: 1,
    minWidth: 80,
    marginRight: 8,
  },
  notesSection: {
    marginTop: 16,
  },
  notesLabel: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  item: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  itemTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  nextService: {
    fontSize: 12,
    marginTop: 4,
  },
  urgentChip: {
    marginTop: 8,
  },
  infoChip: {
    marginTop: 8,
  },
  paidChip: {
    marginTop: 8,
  },
  unpaidChip: {
    marginTop: 8,
  },
  partNotes: {
    marginTop: 8,
    fontSize: 12,
    fontStyle: 'italic',
  },
});
