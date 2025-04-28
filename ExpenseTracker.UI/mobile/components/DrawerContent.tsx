import { StyleSheet, View, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DrawerContentComponentProps } from '@react-navigation/drawer';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { clearDb, exportData, importData } from '~/services/data-transfer';
import { useTheme } from '~/theme';
import ThemedView from '~/components/themed/ThemedView';
import ThemedButton from '~/components/themed/ThemedButton';

export default function CustomDrawerContent(props: DrawerContentComponentProps) {
    const queryClient = useQueryClient();
    const { theme } = useTheme()
    const clearDbMutation = useMutation({ mutationFn: clearDb })

    const handleImport = async () => {
        const result = await importData();
        if (result) {
            let message = `Import completed:\n`;
            message += `- ${result.categories.added} categories added\n`;
            message += `- ${result.expenses.added} expenses added\n`;
            message += `- ${result.incomes.added} incomes added\n`;

            if (result.categories.errors.length || result.expenses.errors.length || result.incomes.errors.length) {
                message += `\nThere were some errors during import.`;
            }

            Alert.alert("Import Successful", message, [
                {
                    text: "OK",
                    onPress: () => {
                        queryClient.invalidateQueries();
                    }
                }
            ]);
        }
    };

    return (
        <ThemedView style={styles.container}>
            <ThemedView as={SafeAreaView} style={styles.container} edges={['top']}>
                <View style={[styles.section, styles.dataActionsContainer, { flex: 1, alignItems: 'flex-start' }]}>
                    <ThemedButton
                        title="Import"
                        onPress={handleImport}
                        style={[styles.dataAction, { backgroundColor: theme.surface }]}
                        icon="cloud-download-outline"
                    />

                    <ThemedButton
                        title="Export"
                        onPress={exportData}
                        style={[styles.dataAction, { backgroundColor: theme.surface }]}
                        icon="cloud-upload-outline"
                    />
                </View>

                <View style={styles.section}>
                    <ThemedButton
                        title="Clear"
                        style={[styles.deleteButton, { borderColor: theme.error }]}
                        icon="trash-outline"
                        onPress={async () => {
                            Alert.alert(
                                "Clear Database",
                                "Are you sure you want to clear the database? This action cannot be undone.",
                                [
                                    {
                                        text: "Cancel",
                                        style: "cancel"
                                    },
                                    {
                                        text: "OK",
                                        onPress: async () => {
                                            await clearDbMutation.mutateAsync();
                                            queryClient.invalidateQueries();
                                        }
                                    }
                                ]
                            );
                        }}
                    />
                </View>
            </ThemedView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    section: {
        paddingHorizontal: 16
    },
    dataActionsContainer: {
        flexDirection: 'row',
        gap: 8,
    },
    dataAction: {
        marginHorizontal: 4,
    },
    deleteButton: {
        marginBottom: 16,
        borderWidth: StyleSheet.hairlineWidth,
        backgroundColor: 'transparent',
    },
});
