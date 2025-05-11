import { StyleSheet, View, Alert, Button } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DrawerContentComponentProps } from '@react-navigation/drawer';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { clearDb, exportData, importData } from '~/services/data-transfer';
import { useTheme } from '~/theme';
import ThemedView from '~/components/themed/ThemedView';
import ThemedButton from '~/components/themed/ThemedButton';

export default function Settings() {
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

    const handleExport = async () => {
        try {
            await exportData();
            Alert.alert("Export Successful", "Data has been exported successfully.");
        } catch (error) {
            Alert.alert("Export Failed", "An error occurred while exporting data.");
        }
    };

    const handleClear = async () => {
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
    }

    return (
        <ThemedView style={styles.container}>
            <Divider />
            <Button
                title="Import"
                color={theme.primary}
                onPress={handleImport}
            />
            <Divider />
            <Button
                title="Export"
                color={theme.primary}
                onPress={handleExport}
            />
            <Divider />
            <Button
                title="Clear"
                color={theme.error}
                onPress={handleClear}
            />
            <Divider />
        </ThemedView>
    );
}

const Divider = () => {
    const { theme } = useTheme()

    return (
        <View style={{
            height: StyleSheet.hairlineWidth,
            backgroundColor: theme.border,
            marginVertical: 8
        }} />
    )
};

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
