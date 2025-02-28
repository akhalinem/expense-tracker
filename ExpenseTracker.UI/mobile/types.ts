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
}

export interface IUpdateExpenseDto {
    id: number;
    amount: number;
    description: string;
    categoryId: string;
}