export type Theme = 'light' | 'dark';

export interface ThemeColors {
  background: string;
  text: string;
  primary: string;
  secondary: string;
  card: string;
  border: string;
  error: string;
  success: string;
}

export const lightTheme: ThemeColors = {
  background: '#f5f5f5',
  text: '#333333',
  primary: '#2196F3',
  secondary: '#666666',
  card: '#ffffff',
  border: '#e0e0e0',
  error: '#F44336',
  success: '#4CAF50',
};

export const darkTheme: ThemeColors = {
  background: '#121212',
  text: '#ffffff',
  primary: '#90CAF9',
  secondary: '#9e9e9e',
  card: '#1e1e1e',
  border: '#333333',
  error: '#EF9A9A',
  success: '#81C784',
}; 