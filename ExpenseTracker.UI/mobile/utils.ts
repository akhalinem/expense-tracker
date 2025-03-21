import { IBudget, IBudgetExcelDto, ICategory, ICategoryExcelDto, IExpense, IExpenseExcelDto } from "./types";

export function displayCurrency(amount: number) {
    return amount.toLocaleString(
        process.env.EXPO_PUBLIC_LOCALE,
        {
            style: "currency",
            currency: process.env.EXPO_PUBLIC_CURRENCY
        })
}

export function displayMonth(month: number, year?: number) {
    const currentYear = new Date().getFullYear();

    year ??= currentYear;

    if (year === currentYear) {
        return new Date(year, month - 1).toLocaleString(
            process.env.EXPO_PUBLIC_LOCALE,
            {
                month: 'long'
            });
    }

    return new Date(year, month - 1).toLocaleString(
        process.env.EXPO_PUBLIC_LOCALE,
        {
            month: 'long',
            year: 'numeric'
        });
}

export function displayDate(date: string) {
    return new Date(date).toLocaleString(
        process.env.EXPO_PUBLIC_LOCALE,
        {
            dateStyle: 'long',
        }
    )
}

export const mapCategoryToCategoryExcelDto = (category: ICategory): ICategoryExcelDto => ({
    name: category.name
})

export const mapExpenseToExpenseExcelDto = (expense: IExpense): IExpenseExcelDto => ({
    amount: expense.amount,
    description: expense.description,
    category: expense.categoryName,
    date: expense.date
});

export const mapBudgetToBudgetExcelDto = (budget: IBudget): IBudgetExcelDto => ({
    amount: budget.amount,
    month: budget.month,
    year: budget.year
});