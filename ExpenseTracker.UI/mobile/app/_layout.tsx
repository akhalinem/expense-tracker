import { useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Drawer } from 'expo-router/drawer';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { displayMonth } from '~/utils';
import { theme, ThemeContext } from '~/theme';
import { PeriodContext, PeriodProvider } from '~/contexts/PeriodContext';
import CustomDrawerContent from '~/components/DrawerContent';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnMount: false
        }
    }
});

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
                            <PeriodProvider>
                                <PeriodContext.Consumer>
                                    {({ selectedPeriod: { month, year } }) =>
                                        <Drawer
                                            drawerContent={(props) => <CustomDrawerContent {...props} />}
                                            screenOptions={{
                                                swipeEdgeWidth: 100,
                                                drawerStyle: {
                                                    maxWidth: 300,
                                                    width: '45%'
                                                }
                                            }}
                                        >
                                            <Drawer.Screen
                                                name="index"
                                                options={{
                                                    title: `Expenses for ${displayMonth(month, year)}`,
                                                    lazy: false,
                                                    headerStyle: {
                                                        backgroundColor: themeValue.theme.background,
                                                    },
                                                    headerTitleStyle: {
                                                        color: themeValue.theme.text
                                                    },
                                                    headerTintColor: themeValue.theme.primary
                                                }}
                                            />
                                        </Drawer>
                                    }
                                </PeriodContext.Consumer>
                            </PeriodProvider>
                        </BottomSheetModalProvider>
                    </GestureHandlerRootView>
                </SafeAreaProvider>
            </ThemeContext.Provider>
        </QueryClientProvider>
    );
}
