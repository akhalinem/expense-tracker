import { useState, useEffect } from 'react';
import { Text, useColorScheme, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Stack } from 'expo-router';
import { useDrizzleStudio } from 'expo-drizzle-studio-plugin';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { db, expoSqliteDb } from '~/services/db';
import migrations from '~/drizzle/migrations';
import { theme, ThemeContext } from '~/theme';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnMount: false,
    },
  },
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
            <Stack>
              <Stack.Screen
                name="(tabs)"
                options={{
                  headerShown: false,
                }}
              />

              <Stack.Screen
                name="categories/index"
                options={{
                  headerTintColor: themeValue.theme.text,
                  headerStyle: {
                    backgroundColor: themeValue.theme.background,
                  },
                }}
              />

              <Stack.Screen
                name="categories/new"
                options={{
                  presentation: 'modal',
                  headerTintColor: themeValue.theme.text,
                  headerStyle: {
                    backgroundColor: themeValue.theme.background,
                  },
                }}
              />

              <Stack.Screen
                name="categories/edit"
                options={{
                  presentation: 'modal',
                  headerTintColor: themeValue.theme.text,
                  headerStyle: {
                    backgroundColor: themeValue.theme.background,
                  },
                }}
              />

              <Stack.Screen
                name="new-transaction"
                options={{
                  headerTintColor: themeValue.theme.text,
                  headerBackButtonDisplayMode: 'minimal',
                  headerTitle: 'New Transaction',
                  headerStyle: {
                    backgroundColor: themeValue.theme.background,
                  },
                  presentation: 'modal',
                }}
              />
              <Stack.Screen
                name="edit-transaction"
                options={{
                  headerTintColor: themeValue.theme.text,
                  headerBackButtonDisplayMode: 'minimal',
                  headerTitle: 'Edit Transaction',
                  headerStyle: {
                    backgroundColor: themeValue.theme.background,
                  },
                  presentation: 'modal',
                }}
              />
            </Stack>
          </GestureHandlerRootView>
        </SafeAreaProvider>
      </ThemeContext.Provider>
    </QueryClientProvider>
  );
}
