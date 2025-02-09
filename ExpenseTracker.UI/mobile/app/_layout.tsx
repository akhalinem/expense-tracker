import { Stack } from "expo-router";
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useColorScheme } from 'react-native';
import { useState, useEffect } from 'react';
import { theme, ThemeContext } from '../theme';

const queryClient = new QueryClient();

export default function RootLayout() {
    const systemColorScheme = useColorScheme();
    const [isDark, setIsDark] = useState(systemColorScheme === 'dark');

    useEffect(() => {
        setIsDark(systemColorScheme === 'dark');
    }, [systemColorScheme]);

    const toggleTheme = () => setIsDark(!isDark);

    const themeValue = {
        theme: isDark ? theme.dark : theme.light,
        isDark,
        toggleTheme,
    };

    return (
        <QueryClientProvider client={queryClient}>
            <ThemeContext.Provider value={themeValue}>
                <SafeAreaProvider>
                    <Stack>
                        <Stack.Screen
                            name="index"
                            options={{
                                headerShown: false,
                            }}
                        />
                    </Stack>
                </SafeAreaProvider>
            </ThemeContext.Provider>
        </QueryClientProvider>
    );
}
