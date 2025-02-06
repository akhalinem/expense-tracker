export interface IExpense {
    id: number;
    createdAt: string;
    updatedAt: string | null;
    amount: number;
    name: string;
    category: string;
}