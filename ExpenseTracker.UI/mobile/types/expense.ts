import { z } from 'zod';

export const ExpenseFormSchema = z.object({
    amount: z.coerce.number().nullable(),
    description: z.string(),
    categoryId: z.string().nullable(),
});

export type ExpenseFormData = z.infer<typeof ExpenseFormSchema>;
