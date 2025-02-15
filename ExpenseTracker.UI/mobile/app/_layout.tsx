import { useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Stack } from "expo-router";
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { theme, ThemeContext } from '~/theme';

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
                    <GestureHandlerRootView style={{ flex: 1 }}>
                        <BottomSheetModalProvider>
                            <Stack>
                                <Stack.Screen
                                    name="index"
                                    options={{
                                        headerShown: false,
                                    }}
                                />
                            </Stack>
                        </BottomSheetModalProvider>
                    </GestureHandlerRootView>
                </SafeAreaProvider>
            </ThemeContext.Provider>
        </QueryClientProvider>
    );
}
