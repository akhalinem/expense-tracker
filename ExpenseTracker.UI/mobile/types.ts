import { z } from "zod";

export const ExpenseFormSchema = z.object({
    amount: z.coerce.number().nullable(),
    description: z.string(),
    categoryId: z.number().nullable(),
    date: z.date(),
});

export type ExpenseFormData = z.infer<typeof ExpenseFormSchema>;

export interface IExpense {
    id: number;
    amount: number;
    description: string;
    categoryId: number;
    categoryName: string;
    date: string;
}
export interface IBudget {
    amount: number;
    month: number;
    year: number;
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

export interface ICreateCategoryDto {
    name: string;
}

export interface ICreateBudgetDto {
    amount: number;
    month: number;
    year: number;
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

export interface IBudgetExcelDto {
    amount: number;
    month: number;
    year: number;
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
    budgets: {
        added: number;
        errors: string[];
    };
}
