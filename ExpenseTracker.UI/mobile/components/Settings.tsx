import { FC, PropsWithChildren } from 'react';
import { StyleSheet, View, Alert, Text, Button } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { clearDb, exportData, importData } from '~/services/data-transfer';
import { useTheme } from '~/theme';
import ThemedCard from '~/components/themed/ThemedCard';
import ThemedView from '~/components/themed/ThemedView';

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
            <SectionHeader title="Data" />
            <SettingsSection>
                <Button
                    title="Import Data"
                    color={theme.primary}
                    onPress={handleImport}
                />
                <Divider />
                <Button
                    title="Export Data"
                    color={theme.primary}
                    onPress={handleExport}
                />
                <Divider />
                <Button
                    title="Clear Database"
                    color={theme.error}
                    onPress={handleClear}
                />
            </SettingsSection>
            <SectionHeader title="Misc" />
            <SettingsSection>
                <Button
                    title="Categories"
                    color={theme.primary}
                />
            </SettingsSection>
        </ThemedView>
    );
}

const SectionHeader: FC<{ title: string }> = ({ title }) => {
    const { theme } = useTheme();

    return (
        <View style={styles.sectionHeader}>
            <Text style={[styles.sectionHeaderText, { color: theme.textSecondary }]}>
                {title}
            </Text>
        </View>
    );
};

const SettingsSection: FC<PropsWithChildren> = ({ children }) => {
    return (
        <ThemedCard style={styles.settingsSection}>
            {children}
        </ThemedCard>
    );
};

const Divider = () => {
    const { theme } = useTheme()

    return (
        <View
            style={{
                height: StyleSheet.hairlineWidth,
                backgroundColor: theme.border,
                marginHorizontal: 16
            }}
        />
    )
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 16,
        paddingTop: 20,
    },
    sectionHeader: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginBottom: 4,
    },
    sectionHeaderText: {
        fontSize: 13,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    settingsSection: {
        borderRadius: 10,
        overflow: 'hidden',
        marginBottom: 24,
        borderWidth: StyleSheet.hairlineWidth,
    },
    settingsButton: {
        paddingVertical: 12,
    },
});