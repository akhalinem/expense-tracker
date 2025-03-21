import { ScrollView, Pressable, StyleSheet, View, Alert } from 'react-native';
import { DrawerContentComponentProps, DrawerContentScrollView } from '@react-navigation/drawer';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { IBudget } from '~/types';
import { displayMonth } from '~/utils';
import { budgetsService } from '~/services/budgets';
import { exportData, importData } from '~/services/data-transfer';
import { useTheme } from '~/theme';
import { usePeriod } from '~/contexts/PeriodContext';
import ThemedView from '~/components/themed/ThemedView';
import ThemedText from '~/components/themed/ThemedText';
import ThemedButton from '~/components/themed/ThemedButton';

export default function CustomDrawerContent(props: DrawerContentComponentProps) {
    const router = useRouter();
    const queryClient = useQueryClient();
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

    const handleImport = async () => {
        const result = await importData();
        if (result) {
            let message = `Import completed:\n`;
            message += `- ${result.categories.added} categories added\n`;
            message += `- ${result.expenses.added} expenses added\n`;
            message += `- ${result.budgets.added} budgets added\n`;

            if (result.categories.errors.length || result.expenses.errors.length || result.budgets.errors.length) {
                message += `\nThere were some errors during import.`;
            }

            Alert.alert("Import Successful", message, [
                {
                    text: "OK",
                    onPress: () => {
                        // Invalidate all relevant queries to refresh data
                        queryClient.invalidateQueries({ queryKey: ['expenses'] });
                        queryClient.invalidateQueries({ queryKey: ['budgets'] });
                        queryClient.invalidateQueries({ queryKey: ['categories'] });
                        queryClient.invalidateQueries({ queryKey: ['budgetsHistory'] });
                    }
                }
            ]);
        }
    };

    const history: IBudget[] = [
        { month: new Date().getMonth() + 1, year: new Date().getFullYear(), amount: 0 },
        ...(budgetsHistoryQuery.data ?? [])
    ];

    return (
        <ThemedView as={DrawerContentScrollView} {...props} style={styles.container}>
            <View style={styles.section}>
                <View style={styles.dataActionsContainer}>
                    <ThemedButton
                        title="Import"
                        onPress={handleImport}
                        style={[styles.dataAction, styles.importButton]}
                        icon="cloud-upload-outline"
                    />
                    <ThemedButton
                        title="Export"
                        onPress={exportData}
                        style={[styles.dataAction, styles.exportButton]}
                        icon="cloud-download-outline"
                    />
                </View>
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
    dataActionsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginHorizontal: 8,
        marginVertical: 8,
    },
    dataAction: {
        flex: 1,
        marginHorizontal: 4,
    },
    importButton: {
        backgroundColor: '#3b82f6',
    },
    exportButton: {
        backgroundColor: '#007AFF',
    },
});
