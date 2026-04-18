import React, { useState, useEffect, useCallback } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Alert, Text } from 'react-native';
import { Card, Title, Paragraph, IconButton, Button, Portal, Modal, TextInput, ActivityIndicator } from 'react-native-paper';
import { Picker } from '@react-native-picker/picker';
import { useNavigation } from '@react-navigation/native';
import { getVehicles, getServices, getParts, getTaxes, updateVehicle } from '../services/firebaseService';
import { formatNumberWithDots, parseFormattedNumberToInt } from '../utils/formatNumber';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function DashboardScreen() {
  const navigation = useNavigation();
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const [vehicles, setVehicles] = useState([]);
  const [upcomingServices, setUpcomingServices] = useState([]);
  const [partsToReplace, setPartsToReplace] = useState([]);
  const [upcomingTaxes, setUpcomingTaxes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showKmModal, setShowKmModal] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [newKm, setNewKm] = useState('');
  const [updatingKm, setUpdatingKm] = useState(false);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadDashboardData();
    });
    loadDashboardData();
    return unsubscribe;
  }, [navigation]);

  const handleLogout = () => {
    Alert.alert(
      'Keluar',
      'Apakah Anda yakin ingin keluar dari akun?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Keluar',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              console.error('Logout error:', error);
            }
          },
        },
      ]
    );
  };

  const handleUpdateKm = async () => {
    if (!selectedVehicleId || !newKm) {
      Alert.alert('Error', 'Pilih kendaraan dan masukkan kilometer terbaru');
      return;
    }

    const kmValue = parseFormattedNumberToInt(newKm);
    if (isNaN(kmValue) || kmValue < 0) {
      Alert.alert('Error', 'Kilometer tidak valid');
      return;
    }

    try {
      setUpdatingKm(true);
      await updateVehicle(selectedVehicleId, { currentMileage: kmValue });
      Alert.alert('Sukses', 'Kilometer berhasil diperbarui');
      setShowKmModal(false);
      setNewKm('');
      setSelectedVehicleId('');
      loadDashboardData();
    } catch (error) {
      console.error('Error updating km:', error);
      Alert.alert('Error', 'Gagal memperbarui kilometer');
    } finally {
      setUpdatingKm(false);
    }
  };

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch all data in parallel for better performance
      const [vehiclesData, servicesData, partsData, taxesData] = await Promise.all([
        getVehicles(user.uid),
        getServices(user.uid),
        getParts(user.uid),
        getTaxes(user.uid)
      ]);
      setVehicles(vehiclesData);

      // Deklarasi now
      const now = new Date();

      // Filter upcoming services (sisa kilometer <= 1000 ATAU sudah lewat, KECUALI yang sudah terlaksana)
      const upcoming = servicesData.filter(service => {
        // Skip servis yang sudah terlaksana
        if (service.isNextServiceDone) return false;
        if (!service.vehicleId || service.nextServiceKm == null) return false;
        const vehicle = vehiclesData.find(v => v.id === service.vehicleId);
        if (!vehicle || vehicle.currentMileage == null) return false;
        const kmRemaining = service.nextServiceKm - vehicle.currentMileage;
        // Tampilkan jika sudah lewat (kmRemaining <= 0) ATAU mendekati servis (kmRemaining <= 1000)
        return kmRemaining <= 1000;
      });
      setUpcomingServices(upcoming.slice(0, 5));

      // Filter parts that need replacement (sisa kilometer <= 1000 ATAU sudah lewat ATAU needsReplacement = true, KECUALI yang sudah diganti)
      const partsNeedingReplacement = partsData.filter(part => {
        // Skip part yang sudah diganti
        if (part.isReplaced) return false;

        // Part yang ditandai perlu diganti (dari switch)
        if (part.needsReplacement === true) return true;

        // Part berdasarkan perhitungan kilometer
        if (!part.vehicleId || !part.replacementKm) return false;
        const vehicle = vehiclesData.find(v => v.id === part.vehicleId);
        if (!vehicle || !vehicle.currentMileage) return false;
        const kmRemaining = part.replacementKm - vehicle.currentMileage;
        // Tampilkan jika sudah lewat (kmRemaining <= 0) ATAU mendekati penggantian (kmRemaining <= 1000)
        return kmRemaining <= 1000;
      });
      setPartsToReplace(partsNeedingReplacement.slice(0, 5));

      // Filter upcoming taxes (next 60 days) AND overdue taxes
      const sixtyDaysFromNow = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
      const upcomingTax = taxesData.filter(tax => {
        if (!tax.dueDate || tax.isPaid) return false;
        try {
          const dueDate = tax.dueDate?.toDate ? tax.dueDate.toDate() : new Date(tax.dueDate);
          // Include overdue (dueDate < now) OR upcoming within 60 days
          return dueDate < now || (dueDate >= now && dueDate <= sixtyDaysFromNow);
        } catch (e) {
          return false;
        }
      });
      setUpcomingTaxes(upcomingTax.slice(0, 5));
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  }, [user.uid]);

  const getVehicleName = useCallback((vehicleId) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    return vehicle ? `${vehicle.brand} ${vehicle.model}` : 'Unknown';
  }, [vehicles]);

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator animating={true} color={theme.colors.primary} size="large" />
      </View>
    );
  }

  // Dashboard stat card component
  const StatCard = ({ icon, title, count, color, onPress, subtitle }) => (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={styles.statCardWrapper}>
      <View style={[styles.statCard, { backgroundColor: theme.colors.surface, borderRadius: theme.roundness + 4 }]}>
        <View style={[styles.statIconContainer, { backgroundColor: color + '18' }]}>
          <MaterialCommunityIcons name={icon} size={28} color={color} />
        </View>
        <Text style={[styles.statCount, { color: color, fontFamily: 'SpaceGrotesk_700Bold' }]}>
          {count}
        </Text>
        <Text style={[styles.statTitle, { color: theme.colors.onSurface, fontFamily: 'SpaceGrotesk_500Medium' }]} numberOfLines={1}>
          {title}
        </Text>
        {subtitle && (
          <Text style={[styles.statSubtitle, { color: theme.colors.onSurfaceVariant, fontFamily: 'SpaceGrotesk_400Regular' }]} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.welcomeLabel, { color: theme.colors.onSurfaceVariant, fontFamily: 'SpaceGrotesk_400Regular' }]}>
            Selamat Datang 👋
          </Text>
          <Title style={[styles.welcomeText, { color: theme.colors.primary, fontFamily: 'SpaceGrotesk_700Bold' }]}>
            Dashboard
          </Title>
        </View>
        <View style={styles.headerButtons}>
          <IconButton
            icon="cog"
            size={24}
            onPress={() => navigation.navigate('Settings')}
            iconColor={theme.colors.onSurfaceVariant}
          />
          <IconButton
            icon="logout"
            size={24}
            onPress={handleLogout}
            iconColor="#d32f2f"
          />
        </View>
      </View>

      {/* Update KM Banner */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => setShowKmModal(true)}
        style={[styles.kmBanner, { backgroundColor: theme.colors.primary, borderRadius: theme.roundness + 4 }]}
      >
        <View style={styles.kmBannerContent}>
          <View style={styles.kmBannerLeft}>
            <View style={styles.kmBannerIcon}>
              <MaterialCommunityIcons name="speedometer" size={32} color="#ffffff" />
            </View>
            <View>
              <Text style={[styles.kmBannerTitle, { fontFamily: 'SpaceGrotesk_700Bold' }]}>
                Update Kilometer
              </Text>
              <Text style={[styles.kmBannerSubtitle, { fontFamily: 'SpaceGrotesk_400Regular' }]}>
                Perbarui odometer kendaraan Anda
              </Text>
            </View>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color="rgba(255,255,255,0.7)" />
        </View>
      </TouchableOpacity>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <StatCard
          icon="car"
          title="Kendaraan"
          count={vehicles.length}
          color={theme.colors.primary}
          onPress={() => navigation.navigate('Vehicles')}
          subtitle="Total terdaftar"
        />
        <StatCard
          icon="wrench-clock"
          title="Servis"
          count={upcomingServices.length}
          color={upcomingServices.length > 0 ? '#E65100' : theme.colors.primary}
          onPress={() => navigation.navigate('Services')}
          subtitle="Perlu perhatian"
        />
        <StatCard
          icon="cog-sync"
          title="Parts"
          count={partsToReplace.length}
          color={partsToReplace.length > 0 ? '#C62828' : theme.colors.primary}
          onPress={() => navigation.navigate('Parts')}
          subtitle="Perlu diganti"
        />
        <StatCard
          icon="file-document-outline"
          title="Pajak"
          count={upcomingTaxes.length}
          color={upcomingTaxes.length > 0 ? '#E65100' : theme.colors.primary}
          onPress={() => navigation.navigate('Taxes')}
          subtitle="Mendatang"
        />
      </View>

      {/* Alerts Section */}
      {(upcomingServices.length > 0 || partsToReplace.length > 0 || upcomingTaxes.length > 0) && (
        <View style={styles.alertsSection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.onSurface, fontFamily: 'SpaceGrotesk_700Bold' }]}>
            ⚡ Perlu Perhatian
          </Text>

          {upcomingServices.map((service) => {
            const vehicle = vehicles.find(v => v.id === service.vehicleId);
            const kmRemaining = vehicle && service.nextServiceKm
              ? service.nextServiceKm - (vehicle.currentMileage || 0)
              : null;
            const isOverdue = kmRemaining !== null && kmRemaining <= 0;

            return (
              <TouchableOpacity
                key={service.id}
                activeOpacity={0.7}
                onPress={() => navigation.navigate('Services')}
                style={[styles.alertCard, { backgroundColor: theme.colors.surface, borderRadius: theme.roundness }]}
              >
                <View style={[styles.alertAccent, { backgroundColor: isOverdue ? '#C62828' : '#E65100' }]} />
                <View style={styles.alertContent}>
                  <View style={styles.alertTop}>
                    <View style={[styles.alertIconBg, { backgroundColor: isOverdue ? '#FFEBEA' : '#FFF3E0' }]}>
                      <MaterialCommunityIcons
                        name="wrench"
                        size={18}
                        color={isOverdue ? '#C62828' : '#E65100'}
                      />
                    </View>
                    <View style={styles.alertTextContainer}>
                      <Text style={[styles.alertTitle, { color: theme.colors.onSurface, fontFamily: 'SpaceGrotesk_500Medium' }]} numberOfLines={1}>
                        {service.serviceType}
                      </Text>
                      <Text style={[styles.alertSubtitle, { color: theme.colors.onSurfaceVariant, fontFamily: 'SpaceGrotesk_400Regular' }]} numberOfLines={1}>
                        {getVehicleName(service.vehicleId)}
                      </Text>
                    </View>
                  </View>
                  {kmRemaining !== null && (
                    <View style={[styles.alertBadge, { backgroundColor: isOverdue ? '#FFEBEA' : '#FFF3E0' }]}>
                      <Text style={[styles.alertBadgeText, { color: isOverdue ? '#C62828' : '#E65100', fontFamily: 'SpaceGrotesk_500Medium' }]}>
                        {isOverdue
                          ? `Lewat ${Math.abs(kmRemaining).toLocaleString('id-ID')} km`
                          : `${kmRemaining.toLocaleString('id-ID')} km lagi`}
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}

          {partsToReplace.map((part) => {
            const vehicle = vehicles.find(v => v.id === part.vehicleId);
            const kmRemaining = vehicle && part.replacementKm
              ? part.replacementKm - (vehicle.currentMileage || 0)
              : null;
            const isOverdue = part.needsReplacement || (kmRemaining !== null && kmRemaining <= 0);

            return (
              <TouchableOpacity
                key={part.id}
                activeOpacity={0.7}
                onPress={() => navigation.navigate('Parts')}
                style={[styles.alertCard, { backgroundColor: theme.colors.surface, borderRadius: theme.roundness }]}
              >
                <View style={[styles.alertAccent, { backgroundColor: '#C62828' }]} />
                <View style={styles.alertContent}>
                  <View style={styles.alertTop}>
                    <View style={[styles.alertIconBg, { backgroundColor: '#FFEBEA' }]}>
                      <MaterialCommunityIcons name="cog" size={18} color="#C62828" />
                    </View>
                    <View style={styles.alertTextContainer}>
                      <Text style={[styles.alertTitle, { color: theme.colors.onSurface, fontFamily: 'SpaceGrotesk_500Medium' }]} numberOfLines={1}>
                        {part.name}
                      </Text>
                      <Text style={[styles.alertSubtitle, { color: theme.colors.onSurfaceVariant, fontFamily: 'SpaceGrotesk_400Regular' }]} numberOfLines={1}>
                        {getVehicleName(part.vehicleId)}
                      </Text>
                    </View>
                  </View>
                  <View style={[styles.alertBadge, { backgroundColor: '#FFEBEA' }]}>
                    <Text style={[styles.alertBadgeText, { color: '#C62828', fontFamily: 'SpaceGrotesk_500Medium' }]}>
                      {part.needsReplacement
                        ? 'Perlu diganti'
                        : kmRemaining !== null
                          ? kmRemaining <= 0
                            ? `Lewat ${Math.abs(kmRemaining).toLocaleString('id-ID')} km`
                            : `${kmRemaining.toLocaleString('id-ID')} km lagi`
                          : 'Segera'}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}

          {upcomingTaxes.map((tax) => {
            let isOverdue = false;
            try {
              const dueDate = tax.dueDate?.toDate ? tax.dueDate.toDate() : new Date(tax.dueDate);
              isOverdue = dueDate < new Date();
            } catch (e) {}

            return (
              <TouchableOpacity
                key={tax.id}
                activeOpacity={0.7}
                onPress={() => navigation.navigate('Taxes')}
                style={[styles.alertCard, { backgroundColor: theme.colors.surface, borderRadius: theme.roundness }]}
              >
                <View style={[styles.alertAccent, { backgroundColor: isOverdue ? '#C62828' : '#E65100' }]} />
                <View style={styles.alertContent}>
                  <View style={styles.alertTop}>
                    <View style={[styles.alertIconBg, { backgroundColor: isOverdue ? '#FFEBEA' : '#FFF3E0' }]}>
                      <MaterialCommunityIcons
                        name="file-document-outline"
                        size={18}
                        color={isOverdue ? '#C62828' : '#E65100'}
                      />
                    </View>
                    <View style={styles.alertTextContainer}>
                      <Text style={[styles.alertTitle, { color: theme.colors.onSurface, fontFamily: 'SpaceGrotesk_500Medium' }]} numberOfLines={1}>
                        {tax.type}
                      </Text>
                      <Text style={[styles.alertSubtitle, { color: theme.colors.onSurfaceVariant, fontFamily: 'SpaceGrotesk_400Regular' }]} numberOfLines={1}>
                        {getVehicleName(tax.vehicleId)}
                      </Text>
                    </View>
                  </View>
                  <View style={[styles.alertBadge, { backgroundColor: isOverdue ? '#FFEBEA' : '#FFF3E0' }]}>
                    <Text style={[styles.alertBadgeText, { color: isOverdue ? '#C62828' : '#E65100', fontFamily: 'SpaceGrotesk_500Medium' }]}>
                      {isOverdue ? 'Terlambat' : 'Segera'}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* KM Modal */}
      <Portal>
        <Modal visible={showKmModal} onDismiss={() => {
            setShowKmModal(false);
            setNewKm('');
            setSelectedVehicleId('');
          }} contentContainerStyle={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
          <Title style={{ color: theme.colors.onSurface, marginBottom: 16, fontFamily: 'SpaceGrotesk_700Bold' }}>Update Kilometer</Title>

          <View style={{ borderWidth: 1, borderColor: theme.colors.outline, borderRadius: 8, marginBottom: 16 }}>
            <Picker
              selectedValue={selectedVehicleId}
              onValueChange={(itemValue) => {
                setSelectedVehicleId(itemValue);
                const stringVal = itemValue ? itemValue.toString() : '';
                const v = vehicles.find(v => v.id === stringVal);
                if (v && v.currentMileage != null) {
                  setNewKm(formatNumberWithDots(v.currentMileage.toString()));
                } else {
                  setNewKm('');
                }
              }}
              style={{ height: 55, color: theme.colors.onSurface }}
              dropdownIconColor={theme.colors.onSurfaceVariant}
            >
              <Picker.Item label="Pilih Kendaraan" value="" />
              {vehicles.map((vehicle) => (
                <Picker.Item
                  key={vehicle.id}
                  label={`${vehicle.brand} ${vehicle.model} (${vehicle.licensePlate})`}
                  value={vehicle.id}
                />
              ))}
            </Picker>
          </View>

          <TextInput
            label="Kilometer Terbaru"
            value={newKm}
            onChangeText={(text) => setNewKm(formatNumberWithDots(text))}
            mode="outlined"
            keyboardType="numeric"
            style={{ marginBottom: 24 }}
            theme={{ colors: { primary: theme.colors.primary }, roundness: 8 }}
          />

          <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
            <Button onPress={() => {
              setShowKmModal(false);
              setNewKm('');
              setSelectedVehicleId('');
            }} style={{ marginRight: 8 }}>Batal</Button>
            <Button mode="contained" onPress={handleUpdateKm} loading={updatingKm} style={{ borderRadius: 8 }}>Simpan</Button>
          </View>
        </Modal>
      </Portal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  welcomeLabel: {
    fontSize: 14,
    marginBottom: 2,
  },
  welcomeText: {
    fontSize: 28,
    marginTop: 0,
  },
  // KM Update Banner
  kmBanner: {
    marginBottom: 20,
    elevation: 3,
    overflow: 'hidden',
  },
  kmBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  kmBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  kmBannerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  kmBannerTitle: {
    color: '#ffffff',
    fontSize: 16,
  },
  kmBannerSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginTop: 2,
  },
  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
    marginBottom: 8,
  },
  statCardWrapper: {
    width: '50%',
    padding: 6,
  },
  statCard: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  statIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statCount: {
    fontSize: 36,
    lineHeight: 42,
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  statSubtitle: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 2,
  },
  // Alerts Section
  alertsSection: {
    marginTop: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 12,
  },
  alertCard: {
    flexDirection: 'row',
    marginBottom: 10,
    elevation: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  alertAccent: {
    width: 4,
  },
  alertContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  alertTop: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  alertIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  alertTextContainer: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 14,
  },
  alertSubtitle: {
    fontSize: 12,
    marginTop: 1,
  },
  alertBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  alertBadgeText: {
    fontSize: 11,
  },
  // Modal
  modalContent: {
    padding: 20,
    margin: 20,
    borderRadius: 12,
  },
});
