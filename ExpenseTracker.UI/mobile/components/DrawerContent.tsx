import { StyleSheet, View, Alert } from 'react-native';
import { DrawerContentComponentProps, DrawerContentScrollView } from '@react-navigation/drawer';
import { useQueryClient } from '@tanstack/react-query';
import { exportData, importData } from '~/services/data-transfer';
import ThemedView from '~/components/themed/ThemedView';
import ThemedButton from '~/components/themed/ThemedButton';
import { useTheme } from '~/theme';

export default function CustomDrawerContent(props: DrawerContentComponentProps) {
    const queryClient = useQueryClient();
    const { theme } = useTheme()

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
        <ThemedView as={DrawerContentScrollView} {...props} style={styles.container}>
            <View style={styles.section}>
                <View style={styles.dataActionsContainer}>
                    <ThemedButton
                        title="Import"
                        onPress={handleImport}
                        style={[styles.dataAction, { backgroundColor: theme.surface }]}
                        icon="cloud-upload-outline"
                    />
                    <ThemedButton
                        title="Export"
                        onPress={exportData}
                        style={[styles.dataAction, { backgroundColor: theme.surface }]}
                        icon="cloud-download-outline"
                    />
                </View>
            </View>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    section: {
        marginBottom: 24,
    },
    dataActionsContainer: {
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: 16,
    },
    dataAction: {
        flex: 1,
        marginHorizontal: 4,
    },
});
