import { IExpense, IExpenseEntity } from "./types";

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

export const mapExpenseEntityToExpense = (entity: IExpenseEntity): IExpense => ({
    id: entity.id,
    amount: entity.amount,
    description: entity.description,
    category: entity.categoryId
        ? {
            id: Number(entity.categoryId),
            name: entity.categoryName
        }
        : null,
    createdAt: entity.date,
    updatedAt: null
})