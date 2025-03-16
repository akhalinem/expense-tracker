import { Alert } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as XLSX from 'xlsx';
import { expensesService } from './expenses';
import { budgetsService } from './budgets';
import { categoriesService } from './categories';

export const exportData = async (): Promise<void> => {
    try {
        // Fetch all data
        const [categories, expenses, budgets] = await Promise.all([
            categoriesService.getCategories(),
            expensesService.getExpenses(),
            budgetsService.getBudgets()
        ]);

        // Create workbook with multiple sheets
        const wb = XLSX.utils.book_new();

        // Add categories sheet
        const categoriesSheet = XLSX.utils.json_to_sheet(categories);
        XLSX.utils.book_append_sheet(wb, categoriesSheet, "Categories");

        // Add expenses sheet
        const expensesSheet = XLSX.utils.json_to_sheet(expenses);
        XLSX.utils.book_append_sheet(wb, expensesSheet, "Expenses");

        // Add budgets sheet
        const budgetsSheet = XLSX.utils.json_to_sheet(budgets);
        XLSX.utils.book_append_sheet(wb, budgetsSheet, "Budgets");

        // Write to buffer
        const wbout = XLSX.write(wb, {
            type: 'base64',
            bookType: 'xlsx'
        });

        // Create directory if it doesn't exist
        const dir = `${FileSystem.documentDirectory}exports/`;
        await FileSystem.makeDirectoryAsync(dir, { intermediates: true });

        // Save file
        const timestamp = new Date().getTime();
        const fileName = `expenses-${timestamp}.xlsx`;
        const filePath = `${dir}${fileName}`;

        await FileSystem.writeAsStringAsync(filePath, wbout, {
            encoding: FileSystem.EncodingType.Base64
        });

        // Share file
        if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(filePath, {
                UTI: 'com.microsoft.excel.xlsx',
                mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                dialogTitle: 'Export Data'
            });
        } else {
            Alert.alert(
                "Export Successful",
                `File saved to:\n${filePath}`
            );
        }

        // Cleanup
        await FileSystem.deleteAsync(dir, { idempotent: true });
    } catch (error) {
        Alert.alert(
            "Export Failed",
            error instanceof Error ? error.message : "Unknown error occurred"
        );
    }
};
