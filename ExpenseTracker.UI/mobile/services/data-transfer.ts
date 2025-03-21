import { Alert } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import * as XLSX from 'xlsx';
import { expensesService } from './expenses';
import { budgetsService } from './budgets';
import { categoriesService } from './categories';
import { mapBudgetToBudgetExcelDto, mapCategoryToCategoryExcelDto, mapExpenseToExpenseExcelDto } from '~/utils';
import { ICreateBudgetDto, ICreateCategoryDto, ICreateExpenseDto, IImportResult } from '~/types';

export const exportData = async (): Promise<void> => {
    try {
        // Fetch all data
        const [categories, expenses, budgets] = await Promise.all([
            categoriesService.getCategories(),
            expensesService.getExpenses(),
            budgetsService.getBudgets()
        ]);

        const categoriesToExport = categories.map(mapCategoryToCategoryExcelDto);
        const expensesToExport = expenses.map(mapExpenseToExpenseExcelDto);
        const budgetsToExport = budgets.map(mapBudgetToBudgetExcelDto);

        // Create workbook with multiple sheets
        const wb = XLSX.utils.book_new();

        // Add categories sheet
        const categoriesSheet = XLSX.utils.json_to_sheet(categoriesToExport);
        XLSX.utils.book_append_sheet(wb, categoriesSheet, "Categories");

        // Add expenses sheet
        const expensesSheet = XLSX.utils.json_to_sheet(expensesToExport);
        XLSX.utils.book_append_sheet(wb, expensesSheet, "Expenses");

        // Add budgets sheet
        const budgetsSheet = XLSX.utils.json_to_sheet(budgetsToExport);
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

export const importData = async (): Promise<IImportResult | null> => {
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
        const importResult: IImportResult = {
            categories: { added: 0, errors: [] },
            expenses: { added: 0, errors: [] },
            budgets: { added: 0, errors: [] }
        };

        // Import categories if the sheet exists
        if (workbook.SheetNames.includes('Categories')) {
            const categoriesSheet = workbook.Sheets['Categories'];
            const categories = XLSX.utils.sheet_to_json<{ name: string }>(categoriesSheet);

            await Promise.all(categories.map(async (category) => {
                try {
                    if (!category.name) throw new Error('Category name is required');

                    const createCategory: ICreateCategoryDto = {
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
            const expenses = XLSX.utils.sheet_to_json<{
                amount: number,
                description: string,
                category: string,
                date: string
            }>(expensesSheet);

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

                    const createExpense: ICreateExpenseDto = {
                        amount: Number(expense.amount),
                        description: expense.description,
                        categoryId: category.id
                    };

                    await expensesService.createExpense(createExpense);
                    importResult.expenses.added++;
                } catch (error) {
                    importResult.expenses.errors.push(
                        `Failed to import expense "${expense.description}": ${error instanceof Error ? error.message : 'Unknown error'}`
                    );
                }
            }));
        }

        // Import budgets if the sheet exists
        if (workbook.SheetNames.includes('Budgets')) {
            const budgetsSheet = workbook.Sheets['Budgets'];
            const budgets = XLSX.utils.sheet_to_json<{
                amount: number,
                month: number,
                year: number
            }>(budgetsSheet);

            await Promise.all(budgets.map(async (budget) => {
                try {
                    if (!budget.amount) throw new Error('Amount is required');
                    if (!budget.month) throw new Error('Month is required');
                    if (!budget.year) throw new Error('Year is required');

                    const createBudget: ICreateBudgetDto = {
                        amount: Number(budget.amount),
                        month: Number(budget.month),
                        year: Number(budget.year)
                    };

                    await budgetsService.createBudget(createBudget);
                    importResult.budgets.added++;
                } catch (error) {
                    importResult.budgets.errors.push(
                        `Failed to import budget for ${budget.month}/${budget.year}: ${error instanceof Error ? error.message : 'Unknown error'}`
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