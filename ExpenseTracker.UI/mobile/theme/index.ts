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

        // Border colors
        border: '#e2e8f0',
        borderFocused: '#0284c7',

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

        // Border colors
        border: '#334155',
        borderFocused: '#38bdf8',

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
