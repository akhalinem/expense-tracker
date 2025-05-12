import { z } from "zod";

export const IncomeFormSchema = z.object({
    amount: z.coerce.number().nullable(),
    description: z.string(),
    date: z.date()
})

export type IncomeFormData = z.infer<typeof IncomeFormSchema>;

export const ExpenseFormSchema = z.object({
    amount: z.coerce.number().nullable(),
    description: z.string(),
    categoryId: z.number().nullable(),
    date: z.date(),
});

export type ExpenseFormData = z.infer<typeof ExpenseFormSchema>;

export enum TransactionTypeEnum {
    INCOME = "income",
    EXPENSE = "expense",
}

export const TransactionTypeEnumSchema = z.nativeEnum(TransactionTypeEnum);

export type TransactionType = {
    id: number;
    name: string;
}

export type Transaction = {
    id: number;
    type: TransactionTypeEnum;
    categoryId: number | null;
    categoryName: string | null;
    amount: number;
    description: string;
    date: string;
};

export type ExpenseExcelDto = {
    category: string;
    amount: number;
    description: string;
    date: string;
}

export type IncomeExcelDto = {
    amount: number;
    description: string;
    date: string;
}

export type Income = {
    id: number;
    amount: number;
    description: string;
    date: string;
}

export type Expense = {
    id: number;
    amount: number;
    description: string;
    categoryId: number;
    categoryName: string;
    date: string;
}

export type Category = {
    id: number;
    name: string;
    color: string;
}

export type CategoryWithTransactionCount = Category & {
    transactionCount: number;
}

export type CreateExpenseDto = {
    amount: number;
    description: string;
    categoryId: number;
    date: Date;
}

export type UpdateExpenseDto = {
    id: number;
    amount: number;
    description: string;
    categoryId: number;
    date: Date;
}

export type CreateIncomeDto = {
    amount: number;
    description: string;
    date: Date;
}

export type UpdateIncomeDto = {
    id: number;
    amount: number;
    description: string;
    date: Date;
}

export type CreateCategoryDto = {
    name: string;
    color?: string;
}

export type UpdateCategoryDto = {
    id: number;
    name: string;
    color?: string;
}

export type CategoryExcelDto = {
    name: string;
}

export type ImportResult = {
    categories: {
        added: number;
        errors: string[];
    };
    expenses: {
        added: number;
        errors: string[];
    };
    incomes: {
        added: number;
        errors: string[];
    };
}
