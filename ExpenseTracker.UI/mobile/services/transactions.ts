import { desc, eq } from "drizzle-orm";
import dayjs from "dayjs";
import { CreateIncomeDto, ICreateExpenseDto, IUpdateExpenseDto, Transaction, TransactionTypeEnum, TransactionTypeEnumSchema } from "~/types";
import { DATE_FORMAT_TO_SAVE_IN_DB } from "~/constants";
import { categoriesTable, transactionsTable, transactionTypesTable } from "~/db/schema";
import { db } from "~/services/db";

const createTransactionType = async (name: string): Promise<void> => {
    const existingType = await db
        .query
        .transactionTypes
        .findFirst({ where: ({ name }, { eq }) => eq(name, name) });

    if (existingType) {
        return;
    }

    const result = await db.insert(transactionTypesTable).values({ name });

    if (result.changes === 0) {
        throw new Error(`Failed to create transaction type "${name}"`);
    }
};



const getTransactions = async (): Promise<Transaction[]> => {
    const transactions = await db
        .select({
            id: transactionsTable.id,
            amount: transactionsTable.amount,
            description: transactionsTable.description,
            categoryId: transactionsTable.categoryId,
            categoryName: categoriesTable.name,
            date: transactionsTable.date,
            type: transactionTypesTable.name,
        })
        .from(transactionsTable)
        .innerJoin(transactionTypesTable, eq(transactionsTable.typeId, transactionTypesTable.id))
        .leftJoin(categoriesTable, eq(transactionsTable.categoryId, categoriesTable.id))
        .orderBy(desc(transactionsTable.date));

    return transactions.map((transaction): Transaction => ({
        ...transaction,
        type: TransactionTypeEnumSchema.parse(transaction.type),
        description: transaction.description ?? '',
    }));
}

const deleteExpense = async (transactionId: number): Promise<void> => {
    if (!db) {
        throw new Error("Database not initialized");
    }

    const result = await db.delete(transactionsTable).where(eq(transactionsTable.id, transactionId));

    if (result.changes === 0) {
        throw new Error("Failed to delete expense");
    }
};

const createExpense = async (dto: ICreateExpenseDto): Promise<void> => {
    if (!db) {
        throw new Error("Database not initialized");
    }

    const expenseTransactionType = await db
        .query
        .transactionTypes
        .findFirst({ where: ({ name }, { eq }) => eq(name, 'expense') });

    if (!expenseTransactionType) {
        throw new Error("Expense transaction type not found");
    }

    const result = await db.insert(transactionsTable).values({
        typeId: expenseTransactionType.id,
        categoryId: dto.categoryId,
        amount: dto.amount,
        date: dayjs(dto.date).format(DATE_FORMAT_TO_SAVE_IN_DB),
        description: dto.description,
    });

    if (result.changes === 0) {
        throw new Error("Failed to create expense");
    }
};

const updateExpense = async (dto: IUpdateExpenseDto): Promise<void> => {
    if (!db) {
        throw new Error("Database not initialized");
    }

    const result = await db
        .update(transactionsTable)
        .set({
            categoryId: dto.categoryId,
            amount: dto.amount,
            description: dto.description,
            date: dayjs(dto.date).format(DATE_FORMAT_TO_SAVE_IN_DB)
        })
        .where(eq(transactionsTable.id, dto.id));

    if (result.changes === 0) {
        throw new Error("Failed to update expense");
    }
};

const createIncome = async (dto: CreateIncomeDto): Promise<void> => {
    const incomeTransactionType = await db
        .query
        .transactionTypes
        .findFirst({ where: ({ name }, { eq }) => eq(name, TransactionTypeEnum.INCOME) });

    if (!incomeTransactionType) {
        throw new Error("Income transaction type not found");
    }

    const result = await db.insert(transactionsTable).values({
        typeId: incomeTransactionType.id,
        date: dayjs(dto.date).format(DATE_FORMAT_TO_SAVE_IN_DB),
        description: dto.description,
        categoryId: null,
        amount: dto.amount,
    });

    if (result.changes === 0) {
        throw new Error("Failed to create income");
    }
}

export const transactionsService = {
    createTransactionType,
    getTransactions,
    createExpense,
    updateExpense,
    deleteExpense,
    createIncome,
};