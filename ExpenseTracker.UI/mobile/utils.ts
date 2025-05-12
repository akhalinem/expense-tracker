import { ExpenseExcelDto, Category, CategoryExcelDto, Expense, IncomeExcelDto, Transaction, } from "./types";

export function displayCurrency(amount: number) {
    return amount.toLocaleString(
        process.env.EXPO_PUBLIC_LOCALE,
        {
            style: "currency",
            currency: process.env.EXPO_PUBLIC_CURRENCY
        })
}

export function displayDate(date: string) {
    return new Date(date).toLocaleString(
        process.env.EXPO_PUBLIC_LOCALE,
        {
            dateStyle: 'full',
        }
    )
}

export const mapCategoryToCategoryExcelDto = (category: Category): CategoryExcelDto => ({
    name: category.name,
    color: category.color,
})

export const mapExpenseToExpenseExcelDto = (expense: Expense): ExpenseExcelDto => ({
    amount: expense.amount,
    description: expense.description,
    category: expense.categoryName,
    date: expense.date
});

export const mapTransactionToIncomeExcelDto = (transaction: Transaction): IncomeExcelDto => ({
    amount: transaction.amount,
    description: transaction.description,
    date: transaction.date,
});

export const mapTransactionToExpenseExcelDto = (transaction: Transaction): ExpenseExcelDto => ({
    amount: transaction.amount,
    description: transaction.description,
    date: transaction.date,
    category: transaction.categoryName ?? ''
});
