import { desc, eq } from "drizzle-orm";
import { Transaction, TransactionTypeSchema } from "~/types";
import { categoriesTable, transactionsTable, transactionTypesTable } from "~/db/schema";
import { db } from "./db";

const getTransactions = async (): Promise<Transaction[]> => {
    const transactions = await db
        .select({
            id: transactionsTable.id,
            amount: transactionsTable.amount,
            description: transactionsTable.description,
            category: categoriesTable.name,
            date: transactionsTable.date,
            type: transactionTypesTable.name,
        })
        .from(transactionsTable)
        .innerJoin(transactionTypesTable, eq(transactionsTable.typeId, transactionTypesTable.id))
        .leftJoin(categoriesTable, eq(transactionsTable.categoryId, categoriesTable.id))
        .orderBy(desc(transactionsTable.date));

    return transactions.map((transaction): Transaction => ({
        ...transaction,
        type: TransactionTypeSchema.parse(transaction.type),
        description: transaction.description ?? '',
    }));
}

export const transactionsService = {
    getTransactions
};