import React, { useRef } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer, DefaultTheme as NavigationDefaultTheme, DarkTheme as NavigationDarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider as PaperProvider } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import ErrorBoundary from './src/components/ErrorBoundary';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';

// Auth Screens
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';

// Main Screens
import DashboardScreen from './src/screens/DashboardScreen';
import VehiclesScreen from './src/screens/VehiclesScreen';
import ServicesScreen from './src/screens/ServicesScreen';
import PartsScreen from './src/screens/PartsScreen';
import TaxesScreen from './src/screens/TaxesScreen';
import AddVehicleScreen from './src/screens/AddVehicleScreen';
import AddServiceScreen from './src/screens/AddServiceScreen';
import AddPartScreen from './src/screens/AddPartScreen';
import AddTaxScreen from './src/screens/AddTaxScreen';
import VehicleDetailScreen from './src/screens/VehicleDetailScreen';
import SettingsScreen from './src/screens/SettingsScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();
const AuthStackNavigator = createStackNavigator();

// Auth Navigation Stack
function AuthStackScreen() {
  return (
    <AuthStackNavigator.Navigator screenOptions={{ headerShown: false }}>
      <AuthStackNavigator.Screen name="Login" component={LoginScreen} />
      <AuthStackNavigator.Screen name="Register" component={RegisterScreen} />
      <AuthStackNavigator.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </AuthStackNavigator.Navigator>
  );
}

function VehiclesStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="VehiclesList" 
        component={VehiclesScreen}
        options={{ title: 'Kendaraan Saya' }}
      />
      <Stack.Screen 
        name="AddVehicle" 
        component={AddVehicleScreen}
        options={{ title: 'Tambah Kendaraan' }}
      />
      <Stack.Screen 
        name="VehicleDetail" 
        component={VehicleDetailScreen}
        options={{ title: 'Detail Kendaraan' }}
      />
    </Stack.Navigator>
  );
}

function ServicesStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="ServicesList" 
        component={ServicesScreen}
        options={{ title: 'Servis Kendaraan' }}
      />
      <Stack.Screen 
        name="AddService" 
        component={AddServiceScreen}
        options={{ title: 'Tambah Servis' }}
      />
    </Stack.Navigator>
  );
}

function PartsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="PartsList" 
        component={PartsScreen}
        options={{ title: 'Parts & Komponen' }}
      />
      <Stack.Screen 
        name="AddPart" 
        component={AddPartScreen}
        options={{ title: 'Tambah Part' }}
      />
    </Stack.Navigator>
  );
}

function TaxesStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="TaxesList" 
        component={TaxesScreen}
        options={{ title: 'Pajak Kendaraan' }}
      />
      <Stack.Screen 
        name="AddTax" 
        component={AddTaxScreen}
        options={{ title: 'Tambah Pajak' }}
      />
    </Stack.Navigator>
  );
}

function DashboardStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="DashboardMain" 
        component={DashboardScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{ title: 'Pengaturan' }}
      />
    </Stack.Navigator>
  );
}

// Main App with Bottom Tabs
function MainApp() {
  const { theme, isDark } = useTheme();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Dashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Vehicles') {
            iconName = focused ? 'car' : 'car-outline';
          } else if (route.name === 'Services') {
            iconName = focused ? 'construct' : 'construct-outline';
          } else if (route.name === 'Parts') {
            iconName = focused ? 'settings' : 'settings-outline';
          } else if (route.name === 'Taxes') {
            iconName = focused ? 'document-text' : 'document-text-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: isDark ? '#888888' : 'gray',
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.outline,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardStack} />
      <Tab.Screen 
        name="Vehicles" 
        component={VehiclesStack} 
        options={{ unmountOnBlur: true }}
      />
      <Tab.Screen name="Services" component={ServicesStack} />
      <Tab.Screen name="Parts" component={PartsStack} />
      <Tab.Screen name="Taxes" component={TaxesStack} />
    </Tab.Navigator>
  );
}

// Loading Screen
function LoadingScreen() {
  const { theme, isLoading: themeLoading } = useTheme();
  
  return (
    <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
    </View>
  );
}

// Root Navigator that handles auth state
function RootNavigator() {
  const { user, loading } = useAuth();
  const { theme, isDark, isLoading: themeLoading } = useTheme();

  // Create navigation theme based on current theme
  const navigationTheme = isDark ? {
    ...NavigationDarkTheme,
    colors: {
      ...NavigationDarkTheme.colors,
      primary: theme.colors.primary,
      background: theme.colors.background,
      card: theme.colors.surface,
      text: theme.colors.onSurface,
      border: theme.colors.outline,
    },
  } : {
    ...NavigationDefaultTheme,
    colors: {
      ...NavigationDefaultTheme.colors,
      primary: theme.colors.primary,
      background: theme.colors.background,
      card: theme.colors.surface,
      text: theme.colors.onSurface,
      border: theme.colors.outline,
    },
  };

  if (loading || themeLoading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer theme={navigationTheme}>
      {user ? <MainApp /> : <AuthStackScreen />}
    </NavigationContainer>
  );
}

function AppContent() {
  const { theme } = useTheme();
  
  return (
    <PaperProvider theme={theme}>
      <RootNavigator />
    </PaperProvider>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ThemeProvider>
          <AppContent />
        </ThemeProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
