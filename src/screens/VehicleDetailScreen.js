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
                  <Button onPress={() => {
                      setNewKm(vehicle?.currentMileage ? formatNumberWithDots(vehicle.currentMileage.toString()) : '');
                      setEditingKm(false);
                    }} compact>Batal</Button>
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

      {/* ============ SERVIS SECTION ============ */}
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
          {(() => {
            const activeServices = services.filter(s => !s.isNextServiceDone);
            return activeServices.length === 0 ? (
              <View style={[styles.emptyState, { backgroundColor: theme.colors.surfaceVariant }]}>
                <Paragraph style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
                  Belum ada servis yang perlu dilakukan
                </Paragraph>
              </View>
            ) : (
              activeServices.slice(0, 3).map((service) => {
                const kmSaatServis = service.kilometer || null;
                const nextServiceKm = service.nextServiceKm || null;
                const currentKm = vehicle.currentMileage || null;
                const kmRemaining = (nextServiceKm && currentKm !== null) ? (nextServiceKm - currentKm) : null;
                const urgent = kmRemaining !== null && kmRemaining > 0 && kmRemaining <= 300;
                const needsService = kmRemaining !== null && kmRemaining <= 0;

                // Progress bar calculation
                let progressWidth = 0;
                if (kmRemaining !== null) {
                  let interval = vehicle?.type === 'motor' ? 2000 : 10000;
                  if (nextServiceKm && service.serviceKm && (nextServiceKm > service.serviceKm)) {
                    interval = nextServiceKm - service.serviceKm;
                  }
                  const pct = ((interval - kmRemaining) / interval) * 100;
                  progressWidth = Math.max(0, Math.min(100, pct));
                }

                const accentColor = needsService ? '#C62828' : urgent ? '#E65100' : theme.colors.primary;

                return (
                  <View key={service.id} style={[styles.miniCard, { backgroundColor: theme.colors.surfaceVariant, borderRadius: theme.roundness }]}>
                    {/* Header */}
                    <View style={[styles.miniCardHeader, { backgroundColor: accentColor, borderTopLeftRadius: theme.roundness, borderTopRightRadius: theme.roundness }]}>
                      <Paragraph style={styles.miniCardTitle}>{service.serviceType}</Paragraph>
                      {needsService && (
                        <View style={styles.statusBadge}>
                          <Paragraph style={styles.statusBadgeText}>⚠ Terlambat</Paragraph>
                        </View>
                      )}
                      {urgent && !needsService && (
                        <View style={[styles.statusBadge, { backgroundColor: 'rgba(255,255,255,0.3)' }]}>
                          <Paragraph style={styles.statusBadgeText}>⚡ Segera</Paragraph>
                        </View>
                      )}
                    </View>

                    {/* Body */}
                    <View style={styles.miniCardBody}>
                      <View style={styles.infoRow}>
                        <Paragraph style={[styles.infoLabel, { color: theme.colors.onSurfaceVariant }]}>📅  Tanggal servis</Paragraph>
                        <Paragraph style={[styles.infoValue, { color: theme.colors.onSurface }]}>
                          {service.serviceDate
                            ? format(service.serviceDate.toDate(), 'dd MMM yyyy', { locale: id })
                            : '-'}
                        </Paragraph>
                      </View>

                      {kmSaatServis !== null && (
                        <View style={styles.infoRow}>
                          <Paragraph style={[styles.infoLabel, { color: theme.colors.onSurfaceVariant }]}>🔧  KM saat servis</Paragraph>
                          <Paragraph style={[styles.infoValue, { color: theme.colors.onSurface }]}>
                            {kmSaatServis.toLocaleString('id-ID')} km
                          </Paragraph>
                        </View>
                      )}

                      {nextServiceKm !== null && (
                        <View style={styles.infoRow}>
                          <Paragraph style={[styles.infoLabel, { color: theme.colors.onSurfaceVariant }]}>🎯  Servis berikutnya</Paragraph>
                          <Paragraph style={[styles.infoValue, { color: theme.colors.onSurface }]}>
                            {nextServiceKm.toLocaleString('id-ID')} km
                          </Paragraph>
                        </View>
                      )}

                      {service.nextServiceDate && (
                        <View style={styles.infoRow}>
                          <Paragraph style={[styles.infoLabel, { color: theme.colors.onSurfaceVariant }]}>📆  Jadwal berikutnya</Paragraph>
                          <Paragraph style={[styles.infoValue, { color: theme.colors.onSurface }]}>
                            {getFormattedDate(service.nextServiceDate) || '-'}
                          </Paragraph>
                        </View>
                      )}

                      {/* Progress bar */}
                      {kmRemaining !== null && (
                        <View style={styles.progressSection}>
                          <View style={styles.progressLabelRow}>
                            <Paragraph style={[styles.progressLabel, { color: accentColor }]}>
                              {needsService
                                ? `Lewat ${Math.abs(kmRemaining).toLocaleString('id-ID')} km`
                                : `Sisa ${kmRemaining.toLocaleString('id-ID')} km`}
                            </Paragraph>
                            <Paragraph style={[styles.progressPercent, { color: theme.colors.onSurfaceVariant }]}>
                              {Math.min(100, Math.round(progressWidth))}%
                            </Paragraph>
                          </View>
                          <View style={[styles.progressTrack, { backgroundColor: theme.colors.outline }]}>
                            <View style={[styles.progressFill, { width: `${progressWidth}%`, backgroundColor: accentColor }]} />
                          </View>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })
            );
          })()}
        </Card.Content>
      </Card>

      {/* ============ PARTS SECTION ============ */}
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
          {(() => {
            const activeParts = parts.filter(p => !p.isReplaced);
            return activeParts.length === 0 ? (
              <View style={[styles.emptyState, { backgroundColor: theme.colors.surfaceVariant }]}>
                <Paragraph style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
                  Belum ada parts yang perlu diganti
                </Paragraph>
              </View>
            ) : (
              activeParts.slice(0, 3).map((part) => {
                let kmRemaining = null;
                if (vehicle.currentMileage != null && part.replacementKm != null) {
                  kmRemaining = part.replacementKm - vehicle.currentMileage;
                }

                const isNeedsReplacement = part.needsReplacement === true;
                const needsReplace = isNeedsReplacement || (kmRemaining !== null && kmRemaining <= 0);
                const urgentPart = kmRemaining !== null && kmRemaining > 0 && kmRemaining <= 1000;

                // Progress calculation
                let progressWidth = 0;
                if (kmRemaining !== null) {
                  let interval = 20000;
                  if (part.replacementKm && part.installedKm) {
                    interval = part.replacementKm - part.installedKm;
                  } else if (vehicle?.type === 'motor') {
                    interval = 10000;
                  } else if (vehicle?.type === 'mobil') {
                    interval = 40000;
                  }
                  const pct = ((interval - kmRemaining) / interval) * 100;
                  progressWidth = Math.max(0, Math.min(100, pct));
                }

                const accentColor = needsReplace ? '#C62828' : urgentPart ? '#E65100' : theme.colors.primary;

                return (
                  <View key={part.id} style={[styles.miniCard, { backgroundColor: theme.colors.surfaceVariant, borderRadius: theme.roundness }]}>
                    {/* Header */}
                    <View style={[styles.miniCardHeader, { backgroundColor: accentColor, borderTopLeftRadius: theme.roundness, borderTopRightRadius: theme.roundness }]}>
                      <Paragraph style={styles.miniCardTitle}>{part.name}</Paragraph>
                      {needsReplace && (
                        <View style={styles.statusBadge}>
                          <Paragraph style={styles.statusBadgeText}>⚠ Ganti!</Paragraph>
                        </View>
                      )}
                      {urgentPart && !needsReplace && (
                        <View style={[styles.statusBadge, { backgroundColor: 'rgba(255,255,255,0.3)' }]}>
                          <Paragraph style={styles.statusBadgeText}>⚡ Segera</Paragraph>
                        </View>
                      )}
                    </View>

                    {/* Body */}
                    <View style={styles.miniCardBody}>
                      {part.installedKm != null && (
                        <View style={styles.infoRow}>
                          <Paragraph style={[styles.infoLabel, { color: theme.colors.onSurfaceVariant }]}>🔩  Terpasang pada</Paragraph>
                          <Paragraph style={[styles.infoValue, { color: theme.colors.onSurface }]}>
                            {part.installedKm.toLocaleString('id-ID')} km
                          </Paragraph>
                        </View>
                      )}

                      {part.replacementKm != null && (
                        <View style={styles.infoRow}>
                          <Paragraph style={[styles.infoLabel, { color: theme.colors.onSurfaceVariant }]}>🎯  Ganti pada</Paragraph>
                          <Paragraph style={[styles.infoValue, { color: theme.colors.onSurface }]}>
                            {part.replacementKm.toLocaleString('id-ID')} km
                          </Paragraph>
                        </View>
                      )}

                      {isNeedsReplacement && part.notes && (
                        <View style={styles.infoRow}>
                          <Paragraph style={[styles.infoLabel, { color: theme.colors.onSurfaceVariant }]}>📝  Catatan</Paragraph>
                          <Paragraph style={[styles.infoValue, { color: theme.colors.onSurface, flex: 1 }]} numberOfLines={2}>
                            {part.notes}
                          </Paragraph>
                        </View>
                      )}

                      {/* Progress bar */}
                      {kmRemaining !== null && (
                        <View style={styles.progressSection}>
                          <View style={styles.progressLabelRow}>
                            <Paragraph style={[styles.progressLabel, { color: accentColor }]}>
                              {kmRemaining <= 0
                                ? `Lewat ${Math.abs(kmRemaining).toLocaleString('id-ID')} km`
                                : `Sisa ${kmRemaining.toLocaleString('id-ID')} km`}
                            </Paragraph>
                            <Paragraph style={[styles.progressPercent, { color: theme.colors.onSurfaceVariant }]}>
                              {Math.min(100, Math.round(progressWidth))}%
                            </Paragraph>
                          </View>
                          <View style={[styles.progressTrack, { backgroundColor: theme.colors.outline }]}>
                            <View style={[styles.progressFill, { width: `${progressWidth}%`, backgroundColor: accentColor }]} />
                          </View>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })
            );
          })()}
        </Card.Content>
      </Card>

      {/* ============ PAJAK SECTION ============ */}
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
            <View style={[styles.emptyState, { backgroundColor: theme.colors.surfaceVariant }]}>
              <Paragraph style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
                Belum ada data pajak
              </Paragraph>
            </View>
          ) : (
            taxes.slice(0, 3).map((tax) => {
              const getTaxFormattedDate = (dateField) => {
                try {
                  if (!dateField) return null;
                  const date = dateField?.toDate ? dateField.toDate() : new Date(dateField);
                  return format(date, 'dd MMM yyyy', { locale: id });
                } catch (e) {
                  return null;
                }
              };

              const taxAccent = tax.isPaid ? theme.colors.primary : '#E65100';

              return (
                <View key={tax.id} style={[styles.miniCard, { backgroundColor: theme.colors.surfaceVariant, borderRadius: theme.roundness }]}>
                  <View style={[styles.miniCardHeader, { backgroundColor: taxAccent, borderTopLeftRadius: theme.roundness, borderTopRightRadius: theme.roundness }]}>
                    <Paragraph style={styles.miniCardTitle}>{tax.type}</Paragraph>
                    <View style={styles.statusBadge}>
                      <Paragraph style={styles.statusBadgeText}>
                        {tax.isPaid ? '✓ Lunas' : '⚠ Belum'}
                      </Paragraph>
                    </View>
                  </View>
                  <View style={styles.miniCardBody}>
                    <View style={styles.infoRow}>
                      <Paragraph style={[styles.infoLabel, { color: theme.colors.onSurfaceVariant }]}>📅  Jatuh Tempo</Paragraph>
                      <Paragraph style={[styles.infoValue, { color: theme.colors.onSurface }]}>
                        {getTaxFormattedDate(tax.dueDate) || 'Tanggal tidak ditentukan'}
                      </Paragraph>
                    </View>
                  </View>
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
  // Empty state
  emptyState: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  // Mini card styles
  miniCard: {
    marginBottom: 12,
    overflow: 'hidden',
    elevation: 1,
  },
  miniCardHeader: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  miniCardTitle: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 15,
    flex: 1,
  },
  statusBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  statusBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  miniCardBody: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  // Info row styles
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
  },
  infoLabel: {
    fontSize: 13,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  // Progress bar styles
  progressSection: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  progressPercent: {
    fontSize: 12,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: 6,
    borderRadius: 3,
  },
  partNotes: {
    marginTop: 8,
    fontSize: 12,
    fontStyle: 'italic',
  },
});
