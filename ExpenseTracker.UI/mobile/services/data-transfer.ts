import { Alert } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import * as XLSX from 'xlsx';
import dayjs from 'dayjs';
import { CreateIncomeDto, ExpenseExcelDto, CreateCategoryDto, CreateExpenseDto, ImportResult, IncomeExcelDto, TransactionTypeEnum } from '~/types';
import { mapCategoryToCategoryExcelDto, mapTransactionToExpenseExcelDto, mapTransactionToIncomeExcelDto, } from '~/utils';
import { transactionsTable, categoriesTable } from '~/db/schema';
import { db } from '~/services/db';
import { categoriesService } from '~/services/categories';
import { transactionsService } from '~/services/transactions';

export const exportData = async (): Promise<void> => {
    try {
        // Fetch all data
        const [categories, transactions] = await Promise.all([
            categoriesService.getCategories(),
            transactionsService.getTransactions()
        ]);

        const categoriesToExport = categories.map(mapCategoryToCategoryExcelDto);
        const incomesToExport = transactions.filter(({ type }) => type === 'income').map(mapTransactionToIncomeExcelDto);
        const expensesToExport = transactions.filter(({ type }) => type === 'expense').map(mapTransactionToExpenseExcelDto)

        // Create workbook with multiple sheets
        const wb = XLSX.utils.book_new();

        // Add categories sheet
        const categoriesSheet = XLSX.utils.json_to_sheet(categoriesToExport);
        XLSX.utils.book_append_sheet(wb, categoriesSheet, "Categories");

        // Add incomes sheet
        const incomesSheet = XLSX.utils.json_to_sheet(incomesToExport);
        XLSX.utils.book_append_sheet(wb, incomesSheet, "Incomes");

        // Add expenses sheet
        const expensesSheet = XLSX.utils.json_to_sheet(expensesToExport);
        XLSX.utils.book_append_sheet(wb, expensesSheet, "Expenses");

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

export const importData = async (): Promise<ImportResult | null> => {
    try {
        // Pick an Excel file
        const result = await DocumentPicker.getDocumentAsync({
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            copyToCacheDirectory: true,
        });

        if (result.canceled) {
            return null;
        }

        // Read file content
        const fileUri = result.assets[0].uri;
        const fileContent = await FileSystem.readAsStringAsync(fileUri, {
            encoding: FileSystem.EncodingType.Base64
        });

        // Parse Excel file
        const workbook = XLSX.read(fileContent, { type: 'base64' });

        // Initialize result object
        const importResult: ImportResult = {
            categories: { added: 0, errors: [] },
            expenses: { added: 0, errors: [] },
            incomes: { added: 0, errors: [] }
        };

        // Create transaction types
        Object.values(TransactionTypeEnum).forEach(async (type) => {
            try {
                await transactionsService.createTransactionType(type);
            } catch (error) {
                console.error(`Failed to create transaction type "${type}": ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        });

        // Import categories if the sheet exists
        if (workbook.SheetNames.includes('Categories')) {
            const categoriesSheet = workbook.Sheets['Categories'];
            const categories = XLSX.utils.sheet_to_json<{ name: string }>(categoriesSheet);

            await Promise.all(categories.map(async (category) => {
                try {
                    if (!category.name) throw new Error('Category name is required');

                    const createCategory: CreateCategoryDto = {
                        name: category.name
                    };
                    await categoriesService.createCategory(createCategory);
                    importResult.categories.added++;
                } catch (error) {
                    importResult.categories.errors.push(
                        `Failed to import category "${category.name}": ${error instanceof Error ? error.message : 'Unknown error'}`
                    );
                }
            }));
        }

        // Import expenses if the sheet exists
        if (workbook.SheetNames.includes('Expenses')) {
            const expensesSheet = workbook.Sheets['Expenses'];
            const expenses = XLSX.utils.sheet_to_json<ExpenseExcelDto>(expensesSheet);

            // Get all categories for mapping
            const categories = await categoriesService.getCategories();

            await Promise.all(expenses.map(async (expense) => {
                try {
                    if (!expense.amount) throw new Error('Amount is required');
                    if (!expense.description) throw new Error('Description is required');
                    if (!expense.category) throw new Error('Category is required');
                    if (!expense.date) throw new Error('Date is required');

                    // Find category by name
                    const category = categories.find(c => c.name === expense.category);
                    if (!category) throw new Error(`Category "${expense.category}" not found`);

                    const createExpense: CreateExpenseDto = {
                        amount: Number(expense.amount),
                        description: expense.description,
                        categoryId: category.id,
                        date: dayjs(expense.date).toDate()
                    };

                    await transactionsService.createExpense(createExpense);
                    importResult.expenses.added++;
                } catch (error) {
                    importResult.expenses.errors.push(
                        `Failed to import expense "${expense.description}": ${error instanceof Error ? error.message : 'Unknown error'}`
                    );
                }
            }));
        }

        // Import incomes if the sheet exists
        if (workbook.SheetNames.includes('Incomes')) {
            const incomesSheet = workbook.Sheets['Incomes'];
            const incomes = XLSX.utils.sheet_to_json<IncomeExcelDto>(incomesSheet);

            await Promise.all(incomes.map(async (income) => {
                try {
                    if (!income.amount) throw new Error('Amount is required');
                    if (!income.description) throw new Error('Description is required');
                    if (!income.date) throw new Error('Date is required');

                    const createIncome: CreateIncomeDto = {
                        amount: Number(income.amount),
                        description: income.description,
                        date: dayjs(income.date).toDate()
                    };

                    await transactionsService.createIncome(createIncome);
                    importResult.incomes.added++;
                } catch (error) {
                    importResult.incomes.errors.push(
                        `Failed to import income "${income.description}": ${error instanceof Error ? error.message : 'Unknown error'}`
                    );
                }
            }));
        }

        return importResult;
    } catch (error) {
        Alert.alert(
            "Import Failed",
            error instanceof Error ? error.message : "Unknown error occurred"
        );
        return null;
    }
};

export const clearDb = async (): Promise<void> => {
    try {
        await db.delete(transactionsTable);
        await db.delete(categoriesTable);
    } catch (error) {
        console.error('Error clearing database:', error);
        throw new Error('Failed to clear database');
    }
}