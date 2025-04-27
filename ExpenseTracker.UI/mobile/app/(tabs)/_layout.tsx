import { useTheme } from '~/theme';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { boolean } from 'drizzle-orm/gel-core';


export default function RootLayout() {
    const { theme } = useTheme()

    return (
        <Tabs
            initialRouteName='transactions'

            screenOptions={{
                tabBarActiveTintColor: theme.primary,
                tabBarInactiveTintColor: theme.textSecondary,
                tabBarStyle: {
                    backgroundColor: theme.background,
                    borderTopColor: theme.border
                },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    href: null
                }}
                redirect
            />

            <Tabs.Screen
                name="transactions"
                options={{
                    title: "Recent Transactions",
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="wallet-outline" size={size} color={color} />
                    ),
                    headerShown: false,
                }}
            />

            <Tabs.Screen
                name="analytics"
                options={{
                    title: "Analytics",
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="bar-chart-outline" size={size} color={color} />
                    ),
                    headerShown: false,
                }}
            />
        </Tabs>
    );
}
