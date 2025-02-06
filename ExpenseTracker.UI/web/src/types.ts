export interface IExpense {
    id: number;
    createdAt: string;
    updatedAt: string | null;
    amount: number;
    name: string;
    category: string;
}

export interface IBudget {
    amount: number;
    month: number;
    year: number;
}