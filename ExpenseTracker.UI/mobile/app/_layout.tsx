import { useState, useEffect } from 'react';
import { Text, useColorScheme, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Drawer } from 'expo-router/drawer';
import { useDrizzleStudio } from 'expo-drizzle-studio-plugin';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator'
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { db, expoSqliteDb } from '~/services/db';
import migrations from '~/drizzle/migrations';
import { theme, ThemeContext } from '~/theme';
import CustomDrawerContent from '~/components/DrawerContent';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnMount: false
        }
    }
});

export default function RootLayout() {
    const migration = useMigrations(db, migrations);

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

    useDrizzleStudio(expoSqliteDb);

    if (migration.error) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text>Migration error: {migration.error.message}</Text>
            </View>
        );
    }

    if (!migration.success) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text>Migration is in progress...</Text>
            </View>
        );
    }

    return (
        <QueryClientProvider client={queryClient}>
            <ThemeContext.Provider value={themeValue}>
                <SafeAreaProvider>
                    <GestureHandlerRootView style={{ flex: 1 }}>
                        <BottomSheetModalProvider>
                            <Drawer drawerContent={(props) => <CustomDrawerContent {...props} />}>
                                <Drawer.Screen name="index" />
                            </Drawer>
                        </BottomSheetModalProvider>
                    </GestureHandlerRootView>
                </SafeAreaProvider>
            </ThemeContext.Provider >
        </QueryClientProvider >
    );
}
