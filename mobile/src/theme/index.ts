import { MD3LightTheme, MD3DarkTheme, type MD3Theme } from 'react-native-paper';

export const lightTheme: MD3Theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#1976D2',    // Material Blue 700
    primaryContainer: '#BBDEFB',
    secondary: '#455A64',   // Blue Grey 700
    secondaryContainer: '#CFD8DC',
    error: '#D32F2F',
    errorContainer: '#FFCDD2',
    background: '#FAFAFA',
    surface: '#FFFFFF',
    surfaceVariant: '#F5F5F5',
    onPrimary: '#FFFFFF',
    onSecondary: '#FFFFFF',
    onBackground: '#212121',
    onSurface: '#212121',
    outline: '#BDBDBD',
  },
};

export const darkTheme: MD3Theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#90CAF9',    // Material Blue 200
    primaryContainer: '#1565C0',
    secondary: '#B0BEC5',  // Blue Grey 200
    secondaryContainer: '#37474F',
    error: '#EF9A9A',
    errorContainer: '#B71C1C',
    background: '#121212',
    surface: '#1E1E1E',
    surfaceVariant: '#2C2C2C',
    onPrimary: '#000000',
    onSecondary: '#000000',
    onBackground: '#FFFFFF',
    onSurface: '#FFFFFF',
    outline: '#757575',
  },
};

export const theme = lightTheme;
