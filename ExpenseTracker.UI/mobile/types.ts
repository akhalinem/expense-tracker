import { z } from "zod";

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

export interface IExpense {
    id: number;
    amount: number;
    description: string;
    categoryId: number;
    categoryName: string;
    date: string;
}

export interface ICategory {
    id: number;
    name: string;
}

export interface ICreateExpenseDto {
    amount: number;
    description: string;
    categoryId: number;
    date: Date;
}

export interface IUpdateExpenseDto {
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

export interface ICreateCategoryDto {
    name: string;
}

export interface ICategoryExcelDto {
    name: string;
}

export interface IExpenseExcelDto {
    amount: number;
    description: string;
    category: string;
    date: string;
}

export interface IImportResult {
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
