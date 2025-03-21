import { z } from "zod";

export const ExpenseFormSchema = z.object({
    amount: z.coerce.number().nullable(),
    description: z.string(),
    categoryId: z.number().nullable(),
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
}

export interface IUpdateExpenseDto {
    id: number;
    amount: number;
    description: string;
    categoryId: number;
}