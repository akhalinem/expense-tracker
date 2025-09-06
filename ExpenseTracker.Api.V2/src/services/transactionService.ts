import {
  Transaction,
  TransactionCategory,
  Category,
  Prisma,
} from "../generated/prisma";
import prisma from "../config/prisma";
import { ITransaction } from "../types";

type TransactionWithCategories = Transaction & {
  transaction_categories: (TransactionCategory & {
    category: Category;
  })[];
};

class TransactionService {
  /**
   * Get all transactions for a user
   * @param userId - User ID from Supabase auth
   * @param options - Query options (limit, offset, filters)
   * @returns Array of transactions with categories
   */
  async getUserTransactions(
    userId: string,
    options?: {
      limit?: number;
      offset?: number;
      type?: "income" | "expense";
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<TransactionWithCategories[]> {
    try {
      const where: Prisma.TransactionWhereInput = {
        user_id: userId,
        ...(options?.type && { type: options.type }),
        ...((options?.startDate || options?.endDate) && {
          date: {
            ...(options.startDate && { gte: options.startDate }),
            ...(options.endDate && { lte: options.endDate }),
          },
        }),
      };

      const transactions = await prisma.transaction.findMany({
        where,
        include: {
          transaction_categories: {
            include: {
              category: true,
            },
          },
        },
        orderBy: {
          date: "desc",
        },
        ...(options?.limit && { take: options.limit }),
        ...(options?.offset && { skip: options.offset }),
      });

      return transactions;
    } catch (error) {
      console.error("Error fetching user transactions:", error);
      throw new Error("Failed to fetch transactions");
    }
  }

  /**
   * Get a specific transaction by ID
   * @param transactionId - Transaction ID
   * @param userId - User ID to ensure ownership
   * @returns Transaction with categories or null if not found
   */
  async getTransaction(
    transactionId: string,
    userId: string
  ): Promise<TransactionWithCategories | null> {
    try {
      const transaction = await prisma.transaction.findFirst({
        where: {
          id: transactionId,
          user_id: userId,
        },
        include: {
          transaction_categories: {
            include: {
              category: true,
            },
          },
        },
      });

      return transaction;
    } catch (error) {
      console.error("Error fetching transaction:", error);
      throw new Error("Failed to fetch transaction");
    }
  }

  /**
   * Create a new transaction
   * @param transactionData - Transaction data
   * @returns Created transaction with categories
   */
  async createTransaction(
    transactionData: ITransaction
  ): Promise<TransactionWithCategories> {
    try {
      if (
        !transactionData.user_id ||
        !transactionData.amount ||
        !transactionData.type
      ) {
        throw new Error("User ID, amount, and type are required");
      }

      const result = await prisma.$transaction(async (tx) => {
        // Create the transaction
        const transaction = await tx.transaction.create({
          data: {
            user_id: transactionData.user_id!,
            amount: transactionData.amount,
            description: transactionData.description || null,
            date: transactionData.date
              ? new Date(transactionData.date)
              : new Date(),
            type: transactionData.type,
          },
        });

        // Associate categories if provided
        if (
          transactionData.categories &&
          transactionData.categories.length > 0
        ) {
          const categoryAssociations = transactionData.categories.map(
            (categoryId) => ({
              transaction_id: transaction.id,
              category_id: categoryId,
            })
          );

          await tx.transactionCategory.createMany({
            data: categoryAssociations,
          });
        }

        // Return the complete transaction with categories
        return await tx.transaction.findUnique({
          where: { id: transaction.id },
          include: {
            transaction_categories: {
              include: {
                category: true,
              },
            },
          },
        });
      });

      if (!result) {
        throw new Error("Failed to create transaction");
      }

      return result;
    } catch (error) {
      console.error("Error creating transaction:", error);
      throw new Error("Failed to create transaction");
    }
  }

  /**
   * Update an existing transaction
   * @param transactionId - Transaction ID
   * @param userId - User ID to ensure ownership
   * @param updateData - Data to update
   * @returns Updated transaction with categories
   */
  async updateTransaction(
    transactionId: string,
    userId: string,
    updateData: Partial<ITransaction>
  ): Promise<TransactionWithCategories> {
    try {
      // First check if transaction exists and belongs to user
      const existingTransaction = await this.getTransaction(
        transactionId,
        userId
      );
      if (!existingTransaction) {
        throw new Error("Transaction not found or access denied");
      }

      const result = await prisma.$transaction(async (tx) => {
        // Update the transaction
        const transaction = await tx.transaction.update({
          where: { id: transactionId },
          data: {
            ...(updateData.amount !== undefined && {
              amount: updateData.amount,
            }),
            ...(updateData.description !== undefined && {
              description: updateData.description,
            }),
            ...(updateData.date && { date: new Date(updateData.date) }),
            ...(updateData.type && { type: updateData.type }),
            updated_at: new Date(),
          },
        });

        // Update categories if provided
        if (updateData.categories !== undefined) {
          // Remove existing category associations
          await tx.transactionCategory.deleteMany({
            where: { transaction_id: transactionId },
          });

          // Add new category associations
          if (updateData.categories.length > 0) {
            const categoryAssociations = updateData.categories.map(
              (categoryId) => ({
                transaction_id: transactionId,
                category_id: categoryId,
              })
            );

            await tx.transactionCategory.createMany({
              data: categoryAssociations,
            });
          }
        }

        // Return the updated transaction with categories
        return await tx.transaction.findUnique({
          where: { id: transactionId },
          include: {
            transaction_categories: {
              include: {
                category: true,
              },
            },
          },
        });
      });

      if (!result) {
        throw new Error("Failed to update transaction");
      }

      return result;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2025") {
          throw new Error("Transaction not found");
        }
      }

      console.error("Error updating transaction:", error);
      throw new Error("Failed to update transaction");
    }
  }

  /**
   * Delete a transaction
   * @param transactionId - Transaction ID
   * @param userId - User ID to ensure ownership
   * @returns Success status
   */
  async deleteTransaction(
    transactionId: string,
    userId: string
  ): Promise<boolean> {
    try {
      // First check if transaction exists and belongs to user
      const existingTransaction = await this.getTransaction(
        transactionId,
        userId
      );
      if (!existingTransaction) {
        throw new Error("Transaction not found or access denied");
      }

      // Delete transaction (cascade will handle transaction_categories)
      await prisma.transaction.delete({
        where: { id: transactionId },
      });

      return true;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2025") {
          throw new Error("Transaction not found");
        }
      }

      console.error("Error deleting transaction:", error);
      throw new Error("Failed to delete transaction");
    }
  }

  /**
   * Get transaction statistics for a user
   * @param userId - User ID
   * @param options - Date range options
   * @returns Transaction statistics
   */
  async getTransactionStats(
    userId: string,
    options?: { startDate?: Date; endDate?: Date }
  ): Promise<{
    totalIncome: number;
    totalExpenses: number;
    netAmount: number;
    transactionCount: number;
  }> {
    try {
      const where: Prisma.TransactionWhereInput = {
        user_id: userId,
        ...((options?.startDate || options?.endDate) && {
          date: {
            ...(options.startDate && { gte: options.startDate }),
            ...(options.endDate && { lte: options.endDate }),
          },
        }),
      };

      const [incomeStats, expenseStats] = await Promise.all([
        prisma.transaction.aggregate({
          where: { ...where, type: "income" },
          _sum: { amount: true },
          _count: true,
        }),
        prisma.transaction.aggregate({
          where: { ...where, type: "expense" },
          _sum: { amount: true },
          _count: true,
        }),
      ]);

      const totalIncome = Number(incomeStats._sum.amount || 0);
      const totalExpenses = Number(expenseStats._sum.amount || 0);

      return {
        totalIncome,
        totalExpenses,
        netAmount: totalIncome - totalExpenses,
        transactionCount: incomeStats._count + expenseStats._count,
      };
    } catch (error) {
      console.error("Error fetching transaction stats:", error);
      throw new Error("Failed to fetch transaction statistics");
    }
  }

  /**
   * Bulk create transactions for sync operations
   * @param transactions - Array of transactions to create
   * @param userId - User ID
   * @returns Created transactions and error information
   */
  async bulkCreateTransactions(
    transactions: ITransaction[],
    userId: string
  ): Promise<{
    created: TransactionWithCategories[];
    errors: Array<{ transaction: ITransaction; error: string }>;
  }> {
    const created: TransactionWithCategories[] = [];
    const errors: Array<{ transaction: ITransaction; error: string }> = [];

    for (const transactionData of transactions) {
      try {
        const transaction = await this.createTransaction({
          ...transactionData,
          user_id: userId,
        });
        created.push(transaction);
      } catch (error) {
        errors.push({
          transaction: transactionData,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return { created, errors };
  }
}

export default new TransactionService();
