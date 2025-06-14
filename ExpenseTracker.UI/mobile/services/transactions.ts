import { desc, eq } from 'drizzle-orm';
import dayjs from 'dayjs';
import {
  CreateIncomeDto,
  CreateExpenseDto,
  UpdateExpenseDto,
  Transaction,
  TransactionTypeEnum,
  TransactionTypeEnumSchema,
  UpdateIncomeDto,
} from '~/types';
import { DATE_FORMAT_TO_SAVE_IN_DB, DEFAULT_CATEGORY_COLOR } from '~/constants';
import {
  categoriesTable,
  transactionsTable,
  transactionTypesTable,
  transactionCategoriesTable,
} from '~/db/schema';
import { db } from '~/services/db';

const createTransactionType = async (name: string): Promise<void> => {
  const existingType = await db.query.transactionTypes.findFirst({
    where: ({ name }, { eq }) => eq(name, name),
  });

  if (existingType) {
    return;
  }

  const result = await db.insert(transactionTypesTable).values({ name });

  if (result.changes === 0) {
    throw new Error(`Failed to create transaction type "${name}"`);
  }
};

const getTransactions = async (): Promise<Transaction[]> => {
  try {
    const transactionsWithCategories = await db
      .select({
        id: transactionsTable.id,
        amount: transactionsTable.amount,
        description: transactionsTable.description,
        categoryId: categoriesTable.id,
        categoryName: categoriesTable.name,
        categoryColor: categoriesTable.color,
        date: transactionsTable.date,
        type: transactionTypesTable.name,
      })
      .from(transactionsTable)
      .innerJoin(
        transactionTypesTable,
        eq(transactionsTable.typeId, transactionTypesTable.id)
      )
      .leftJoin(
        transactionCategoriesTable,
        eq(transactionsTable.id, transactionCategoriesTable.transactionId)
      )
      .leftJoin(
        categoriesTable,
        eq(transactionCategoriesTable.categoryId, categoriesTable.id)
      )
      .orderBy(desc(transactionsTable.date));

    // Group transactions by ID and aggregate categories
    const transactionMap = new Map<number, Transaction>();

    transactionsWithCategories.forEach((row) => {
      if (!transactionMap.has(row.id)) {
        transactionMap.set(row.id, {
          id: row.id,
          amount: row.amount,
          description: row.description || '',
          date: row.date,
          type: TransactionTypeEnumSchema.parse(row.type),
          categories: [],
        });
      }

      const transaction = transactionMap.get(row.id)!;

      // Add category if it exists and isn't already in the categories array
      if (row.categoryId) {
        const category = {
          id: row.categoryId,
          name: row.categoryName!,
          color: row.categoryColor || DEFAULT_CATEGORY_COLOR,
        };

        if (!transaction.categories?.some((c) => c.id === category.id)) {
          if (!transaction.categories) {
            transaction.categories = [];
          }
          transaction.categories.push(category);
        }
      }
    });

    return Array.from(transactionMap.values());
  } catch (error) {
    console.error('Error fetching transactions:', error);
    throw new Error('Failed to fetch transactions');
  }
};

const deleteTransaction = async (transactionId: number): Promise<void> => {
  if (!db) {
    throw new Error('Database not initialized');
  }

  await db.transaction(async (tx) => {
    // Delete category associations first
    await tx
      .delete(transactionCategoriesTable)
      .where(eq(transactionCategoriesTable.transactionId, transactionId));

    // Then delete the transaction
    const result = await tx
      .delete(transactionsTable)
      .where(eq(transactionsTable.id, transactionId));

    if (result.changes === 0) {
      throw new Error('Failed to delete transaction');
    }
  });
};

const createExpense = async (dto: CreateExpenseDto): Promise<void> => {
  if (!db) {
    throw new Error('Database not initialized');
  }

  const expenseTransactionType = await db.query.transactionTypes.findFirst({
    where: ({ name }, { eq }) => eq(name, 'expense'),
  });

  if (!expenseTransactionType) {
    throw new Error('Expense transaction type not found');
  }

  // Start a transaction to ensure all operations succeed or fail together
  await db.transaction(async (tx) => {
    // Insert the transaction first
    const result = await tx.insert(transactionsTable).values({
      typeId: expenseTransactionType.id,
      amount: dto.amount,
      date: dayjs(dto.date).format(DATE_FORMAT_TO_SAVE_IN_DB),
      description: dto.description,
    });

    if (result.changes === 0 || !result.lastInsertRowId) {
      throw new Error('Failed to create expense');
    }

    const transactionId = Number(result.lastInsertRowId);

    // Insert category associations if categories are provided
    if (dto.categoryIds && dto.categoryIds.length > 0) {
      const categoryAssociations = dto.categoryIds.map((categoryId) => ({
        transactionId,
        categoryId,
      }));

      await tx.insert(transactionCategoriesTable).values(categoryAssociations);
    }
  });
};

const updateExpense = async (dto: UpdateExpenseDto): Promise<void> => {
  if (!db) {
    throw new Error('Database not initialized');
  }

  await db.transaction(async (tx) => {
    // Update transaction details
    const result = await tx
      .update(transactionsTable)
      .set({
        amount: dto.amount,
        description: dto.description,
        date: dayjs(dto.date).format(DATE_FORMAT_TO_SAVE_IN_DB),
        // Remove categoryId from here
      })
      .where(eq(transactionsTable.id, dto.id));

    if (result.changes === 0) {
      throw new Error('Failed to update expense');
    }

    // Delete all existing category associations
    await tx
      .delete(transactionCategoriesTable)
      .where(eq(transactionCategoriesTable.transactionId, dto.id));

    // Insert new category associations
    if (dto.categoryIds && dto.categoryIds.length > 0) {
      const categoryAssociations = dto.categoryIds.map((categoryId) => ({
        transactionId: dto.id,
        categoryId,
      }));

      await tx.insert(transactionCategoriesTable).values(categoryAssociations);
    }
  });
};

const createIncome = async (dto: CreateIncomeDto): Promise<void> => {
  const incomeTransactionType = await db.query.transactionTypes.findFirst({
    where: ({ name }, { eq }) => eq(name, TransactionTypeEnum.INCOME),
  });

  if (!incomeTransactionType) {
    throw new Error('Income transaction type not found');
  }

  const result = await db.insert(transactionsTable).values({
    typeId: incomeTransactionType.id,
    date: dayjs(dto.date).format(DATE_FORMAT_TO_SAVE_IN_DB),
    description: dto.description,
    amount: dto.amount,
  });

  if (result.changes === 0) {
    throw new Error('Failed to create income');
  }
};

const updateIncome = async (dto: UpdateIncomeDto): Promise<void> => {
  const result = await db
    .update(transactionsTable)
    .set({
      date: dayjs(dto.date).format(DATE_FORMAT_TO_SAVE_IN_DB),
      description: dto.description,
      amount: dto.amount,
    })
    .where(eq(transactionsTable.id, dto.id));

  if (result.changes === 0) {
    throw new Error('Failed to update income');
  }
};

const getTransactionById = async (
  transactionId: number
): Promise<Transaction | null> => {
  const transaction = db
    .select({
      id: transactionsTable.id,
      amount: transactionsTable.amount,
      description: transactionsTable.description,
      date: transactionsTable.date,
      type: transactionTypesTable.name,
      categories: transactionCategoriesTable.categoryId,
    })
    .from(transactionsTable)
    .innerJoin(
      transactionTypesTable,
      eq(transactionsTable.typeId, transactionTypesTable.id)
    )
    .leftJoin(
      transactionCategoriesTable,
      eq(transactionsTable.id, transactionCategoriesTable.transactionId)
    )
    .where(eq(transactionsTable.id, transactionId))
    .get();

  if (!transaction) {
    return null;
  }

  const categories = await db
    .select({
      id: categoriesTable.id,
      name: categoriesTable.name,
      color: categoriesTable.color,
    })
    .from(categoriesTable)
    .innerJoin(
      transactionCategoriesTable,
      eq(categoriesTable.id, transactionCategoriesTable.categoryId)
    )
    .where(eq(transactionCategoriesTable.transactionId, transactionId));

  return {
    ...transaction,
    type: TransactionTypeEnumSchema.parse(transaction.type),
    description: transaction.description || '',
    categories: categories.map((category) => ({
      id: category.id,
      name: category.name,
      color: category.color || DEFAULT_CATEGORY_COLOR,
    })),
  };
};

export const transactionsService = {
  createTransactionType,
  getTransactions,
  createExpense,
  updateExpense,
  deleteTransaction,
  createIncome,
  updateIncome,
  getTransactionById,
};
