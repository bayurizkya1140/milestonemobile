import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';

const THEME_STORAGE_KEY = '@milestone_theme_preference';

// Custom light theme
const CustomLightTheme = {
  ...MD3LightTheme,
  dark: false,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#2196F3',
    background: '#f5f5f5',
    surface: '#ffffff',
    surfaceVariant: '#f0f0f0',
    onSurface: '#1a1a1a',
    onSurfaceVariant: '#666666',
    outline: '#cccccc',
    // Custom colors for chips
    urgentChipBg: '#ffebee',
    urgentChipText: '#c62828',
    infoChipBg: '#e3f2fd',
    infoChipText: '#1565c0',
    successChipBg: '#e8f5e9',
    successChipText: '#2e7d32',
    warningChipBg: '#fff3e0',
    warningChipText: '#e65100',
  },
};

// Custom dark theme
const CustomDarkTheme = {
  ...MD3DarkTheme,
  dark: true,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#64B5F6',
    background: '#121212',
    surface: '#1e1e1e',
    surfaceVariant: '#2d2d2d',
    onSurface: '#e0e0e0',
    onSurfaceVariant: '#aaaaaa',
    outline: '#444444',
    // Custom colors for chips
    urgentChipBg: '#4a1c1c',
    urgentChipText: '#ff8a80',
    infoChipBg: '#1a3a5c',
    infoChipText: '#90caf9',
    successChipBg: '#1b4332',
    successChipText: '#95d5b2',
    warningChipBg: '#4a3c1c',
    warningChipText: '#ffcc80',
  },
};

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const systemColorScheme = useColorScheme();
  const [themePreference, setThemePreference] = useState('system'); // 'light', 'dark', or 'system'
  const [isLoading, setIsLoading] = useState(true);

  // Load saved theme preference
  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme) {
        setThemePreference(savedTheme);
      }
    } catch (error) {
      console.error('Error loading theme preference:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setTheme = async (theme) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, theme);
      setThemePreference(theme);
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  // Determine actual theme based on preference
  const isDark = useMemo(() => {
    if (themePreference === 'system') {
      return systemColorScheme === 'dark';
    }
    return themePreference === 'dark';
  }, [themePreference, systemColorScheme]);

  const theme = useMemo(() => {
    return isDark ? CustomDarkTheme : CustomLightTheme;
  }, [isDark]);

  const value = {
    theme,
    isDark,
    themePreference,
    setTheme,
    isLoading,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
