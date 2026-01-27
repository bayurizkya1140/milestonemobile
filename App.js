import React, { useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider as PaperProvider } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

// Screens
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

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

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

export default function App() {
  const navigationRef = React.useRef();

  return (
    <PaperProvider>
      <NavigationContainer ref={navigationRef}>
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
            tabBarActiveTintColor: '#2196F3',
            tabBarInactiveTintColor: 'gray',
            headerShown: false,
          })}
        >
          <Tab.Screen name="Dashboard" component={DashboardScreen} />
          <Tab.Screen 
            name="Vehicles" 
            component={VehiclesStack} 
            options={{ unmountOnBlur: true }}
          />
          <Tab.Screen name="Services" component={ServicesStack} />
          <Tab.Screen name="Parts" component={PartsStack} />
          <Tab.Screen name="Taxes" component={TaxesStack} />
        </Tab.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
}
