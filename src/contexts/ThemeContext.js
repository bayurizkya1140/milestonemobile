import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MD3LightTheme, MD3DarkTheme, configureFonts } from 'react-native-paper';

const THEME_STORAGE_KEY = '@milestone_theme_preference';

const fontConfig = {
  fontFamily: 'SpaceGrotesk_400Regular',
};

const customFonts = configureFonts({ config: fontConfig });

const CustomLightTheme = {
  ...MD3LightTheme,
  dark: false,
  roundness: 8,
  fonts: customFonts,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#1F4E34',
    background: '#F9F8F4',
    surface: '#FFFFFF',
    surfaceVariant: '#EBEBEB',
    onSurface: '#1A1A1A',
    onSurfaceVariant: '#555555',
    outline: '#E0E0E0',
    // Custom colors for chips
    urgentChipBg: '#FFEBEA',
    urgentChipText: '#C62828',
    infoChipBg: '#E3F2FD',
    infoChipText: '#1565C0',
    successChipBg: '#D1E6DA',
    successChipText: '#1F4E34',
    warningChipBg: '#FFF3E0',
    warningChipText: '#E65100',
  },
};

// Custom dark theme
const CustomDarkTheme = {
  ...MD3DarkTheme,
  dark: true,
  roundness: 8,
  fonts: customFonts,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#2E7A52', // Lighter green for dark mode visibility
    background: '#121212',
    surface: '#1E1E1E',
    surfaceVariant: '#2D2D2D',
    onSurface: '#E0E0E0',
    onSurfaceVariant: '#AAAAAA',
    outline: '#444444',
    // Custom colors for chips
    urgentChipBg: '#4A1C1C',
    urgentChipText: '#FF8A80',
    infoChipBg: '#1A3A5C',
    infoChipText: '#90CAF9',
    successChipBg: '#153A26',
    successChipText: '#A1D9B8',
    warningChipBg: '#4A3C1C',
    warningChipText: '#FFCC80',
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
