import { ScrollView, Pressable, StyleSheet, View } from 'react-native';
import { DrawerContentComponentProps, DrawerContentScrollView } from '@react-navigation/drawer';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { IBudget } from '~/types';
import { displayMonth } from '~/utils';
import { budgetsService } from '~/services/budgets';
import { exportData } from '~/services/export';
import { useTheme } from '~/theme';
import { usePeriod } from '~/contexts/PeriodContext';
import ThemedView from '~/components/themed/ThemedView';
import ThemedText from '~/components/themed/ThemedText';
import ThemedButton from '~/components/themed/ThemedButton';

export default function CustomDrawerContent(props: DrawerContentComponentProps) {
    const router = useRouter();
    const { theme } = useTheme();
    const { setSelectedPeriod } = usePeriod();

    const budgetsHistoryQuery = useQuery({
        queryKey: ['budgetsHistory'],
        queryFn: () => budgetsService.getHistory()
    });

    const handlePeriodSelect = (month: number, year: number) => {
        setSelectedPeriod({ month, year });
        router.push('/');
    };

    const history: IBudget[] = [
        { month: new Date().getMonth() + 1, year: new Date().getFullYear(), amount: 0 },
        ...(budgetsHistoryQuery.data ?? [])
    ];

    return (
        <ThemedView as={DrawerContentScrollView} {...props} style={styles.container}>
            <View style={styles.section}>
                <ThemedButton
                    title="Export Data"
                    onPress={exportData}
                    style={styles.export}
                />
            </View>
            <View style={{ borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#ccc' }} />
            <ScrollView style={styles.section}>
                {history.map(({ month, year }) => (
                    <Pressable
                        key={`${year}-${month}`}
                        style={[styles.periodItem]}
                        onPress={() => handlePeriodSelect(month, year)}
                    >
                        <ThemedText style={[styles.periodText, { color: theme.text }]}>{displayMonth(month, year)}</ThemedText>
                    </Pressable>
                ))}
            </ScrollView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    periodItem: {
        paddingVertical: 16,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#ccc',
    },
    periodText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    section: {
        marginBottom: 24,
    },
    export: {
        marginBottom: 8,
    },
});
