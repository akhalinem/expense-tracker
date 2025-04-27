import { FC } from 'react';
import { StyleSheet } from 'react-native';
import { DrawerHeaderProps } from '@react-navigation/drawer';
import Drawer from 'expo-router/drawer';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { displayCurrency } from '~/utils';
import { transactionsService } from '~/services/transactions';
import { useTheme } from '~/theme';
import ThemedText from '~/components/themed/ThemedText';
import ThemedView from '~/components/themed/ThemedView';
import CustomDrawerContent from '~/components/DrawerContent';

export default function TransactionsLayout() {
    const transactionsQuery = useQuery({
        queryKey: ['transactions'],
        queryFn: transactionsService.getTransactions
    });

    const transactions = transactionsQuery.data ?? [];

    // Calculate total balance across all transactions
    const totalBalance = transactions.reduce((sum, t) => {
        return sum + (t.type === "income" ? t.amount : -t.amount);
    }, 0);

    return (
        <Drawer drawerContent={(props) => <CustomDrawerContent {...props} />}>
            <Drawer.Screen
                name='index'
                options={{
                    title: 'Transactions',
                    header: (drawerHeaderProps) => (
                        <Header {...drawerHeaderProps} totalBalance={totalBalance} />
                    )
                }}
            />
        </Drawer>
    );
}

const Header: FC<DrawerHeaderProps & { totalBalance: number }> = ({ totalBalance, navigation }) => {
    const { theme } = useTheme()
    const insets = useSafeAreaInsets();

    return (
        <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
            <ThemedView>
                <ThemedText style={[styles.balanceLabel, { color: theme.secondary }]}>
                    Balance
                </ThemedText>
                <ThemedText
                    style={[
                        styles.balanceAmount,
                        { color: totalBalance >= 0 ? theme.success : theme.error }
                    ]}>
                    {displayCurrency(totalBalance)}
                </ThemedText>
            </ThemedView>

            <Ionicons name='settings-sharp' size={28} color={theme.text} onPress={navigation.toggleDrawer} />
        </ThemedView>
    )
}

const styles = StyleSheet.create({
    container: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: StyleSheet.hairlineWidth,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    balanceLabel: {
        fontSize: 16,
        marginBottom: 4,
    },
    balanceAmount: {
        fontSize: 24,
        fontWeight: 'bold',
    }
});
