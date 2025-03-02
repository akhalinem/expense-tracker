import { z } from "zod";

export const ExpenseFormSchema = z.object({
    amount: z.coerce.number().nullable(),
    description: z.string(),
    categoryId: z.string().nullable(),
});

export type ExpenseFormData = z.infer<typeof ExpenseFormSchema>;


export interface IExpense {
    id: number;
    createdAt: string;
    updatedAt: string | null;
    amount: number;
    description: string;
    category: ICategory | null;
}

export interface IBudget {
    amount: number;
    month: number;
    year: number;
}

export interface ICategory {
    id: string;
    name: string;
}

export interface ICreateExpenseDto {
    amount: number;
    description: string;
    categoryId: string;
    month: number;
    year: number;
}

export interface IUpdateExpenseDto {
    id: number;
    amount: number;
    description: string;
    categoryId: string;
    month: number;
    year: number;
}