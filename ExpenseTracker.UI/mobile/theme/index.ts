import { createContext, useContext } from 'react';

export const theme = {
    light: {
        background: '#f0f0f0',
        card: '#ffffff',
        text: '#000000',
        textSecondary: '#666666',
        shadow: '#000000',
    },
    dark: {
        background: '#1e1e1e',
        card: '#2d2d2d',
        text: '#ffffff',
        textSecondary: '#a0a0a0',
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
