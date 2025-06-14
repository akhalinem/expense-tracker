import { createContext, useContext } from 'react';

export const theme = {
  light: {
    // Base colors
    background: '#f8fafc',
    surface: '#ffffff',

    // Text colors
    text: '#0f172a',
    textSecondary: '#64748b',

    // Interactive colors
    primary: '#0284c7',
    secondary: '#6b7280',

    // Status colors
    error: '#ef4444',
    success: '#4CAF50',

    // background colors
    categoryBg: 'rgba(255, 255, 255, 0.1)',
    incomeBg: 'rgba(76, 175, 80, 0.1)',
    expenseBg: 'rgba(255, 82, 82, 0.1)',

    // Border colors
    border: '#e2e8f0',

    // Shadow colors
    shadow: '#000000',
  },
  dark: {
    // Base colors
    background: '#0f172a',
    surface: '#1e293b',

    // Text colors
    text: '#f8fafc',
    textSecondary: '#94a3b8',

    // Interactive colors
    primary: '#38bdf8',
    secondary: '#9ca3af',

    // Status colors
    error: '#f87171',
    success: '#4CAF50',

    // background colors
    categoryBg: 'rgba(255, 255, 255, 0.1)',
    incomeBg: 'rgba(76, 175, 80, 0.1)',
    expenseBg: 'rgba(255, 82, 82, 0.1)',

    // Border colors
    border: '#334155',

    // Shadow colors
    shadow: '#000000',
  },
};

export type Theme = typeof theme.light;

export const ThemeContext = createContext<{
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
} | null>(null);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
