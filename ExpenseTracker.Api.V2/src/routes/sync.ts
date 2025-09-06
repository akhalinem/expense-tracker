import express, { Request, Response } from "express";
import { syncService } from "../services/syncService";
import { authenticate } from "../middleware/auth";
import { validateSync } from "../middleware/validation";
import type { Transaction } from "../generated/prisma";
import { prisma } from "../config/prisma";

const router = express.Router();

/**
 * POST /api/sync/upload
 * Upload local data to database via Prisma
 */
router.post(
  "/upload",
  authenticate,
  validateSync,
  async (req: Request, res: Response) => {
    const startTime = Date.now();
    try {
      const userId = req.user.id;
      const userToken = req.token;
      const { categories = [], transactions = [] } = req.body;

      console.log(`🚀 [UPLOAD] Started for user ${userId}`);
      console.log(`🔑 [UPLOAD] User token present: ${!!userToken}`);
      console.log(
        `📊 [UPLOAD] Payload: ${categories.length} categories, ${transactions.length} transactions`
      );
      console.log(
        `📦 [UPLOAD] Request size: ${JSON.stringify(req.body).length} characters`
      );

      const results: any = {
        categories: { created: 0, updated: 0, errors: [] },
        transactions: { created: 0, updated: 0, errors: [] },
      };

      // Sync categories
      if (categories.length > 0) {
        console.log(
          `📁 [UPLOAD] Processing ${categories.length} categories...`
        );
        const categoryStartTime = Date.now();

        results.categories = await syncService.syncCategories(
          userId,
          categories
        );

        const categoryDuration = Date.now() - categoryStartTime;
        console.log(
          `✅ [UPLOAD] Categories processed in ${categoryDuration}ms:`,
          results.categories
        );
      }

      // Sync transactions
      if (transactions.length > 0) {
        console.log(
          `💰 [UPLOAD] Processing ${transactions.length} transactions...`
        );
        const transactionStartTime = Date.now();

        results.transactions = await syncService.syncTransactions(
          userId,
          transactions
        );

        const transactionDuration = Date.now() - transactionStartTime;
        console.log(
          `✅ [UPLOAD] Transactions processed in ${transactionDuration}ms:`,
          results.transactions
        );
      }

      const totalDuration = Date.now() - startTime;
      console.log(`🎉 [UPLOAD] Completed successfully in ${totalDuration}ms`);

      res.json({
        success: true,
        message: "Data uploaded successfully",
        results,
        timestamp: new Date().toISOString(),
      });
    } catch (error: unknown) {
      const totalDuration = Date.now() - startTime;
      console.error(`❌ [UPLOAD] Failed after ${totalDuration}ms:`, error);
      res.status(500).json({
        success: false,
        message: "Upload sync failed",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

/**
 * GET /api/sync/download
 * Download all user data from Supabase
 */
router.get("/download", authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;

    const userData = await syncService.getUserData(userId);

    res.json({
      success: true,
      message: "Data downloaded successfully",
      data: userData,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error("Download sync error:", error);
    res.status(500).json({
      success: false,
      message: "Download sync failed",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * POST /api/sync/full
 * Complete sync operation (upload local data, then download updated data)
 */
router.post(
  "/full",
  authenticate,
  validateSync,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user.id;
      const localData = req.body;

      const syncResults = await syncService.fullSync(userId, localData);

      res.json({
        success: true,
        message: "Full sync completed successfully",
        results: syncResults,
      });
    } catch (error: unknown) {
      console.error("Full sync error:", error);
      res.status(500).json({
        success: false,
        message: "Full sync failed",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

/**
 * GET /api/sync/status
 * Get sync status and last sync timestamp
 */
router.get("/status", authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    console.log(`📊 [SYNC_STATUS] Getting status for user ${userId}`);

    // Get counts from database using Prisma
    const categoryCount = await prisma.category.count({
      where: { user_id: userId },
    });

    console.log(
      `📁 [SYNC_STATUS] Found ${categoryCount} categories for user ${userId}`
    );

    const transactionCount = await prisma.transaction.count({
      where: { user_id: userId },
    });

    console.log(
      `💰 [SYNC_STATUS] Found ${transactionCount} transactions for user ${userId}`
    );

    // Get last updated timestamp
    const lastUpdatedTransaction: Pick<Transaction, "updated_at"> | null =
      await prisma.transaction.findFirst({
        where: { user_id: userId },
        select: { updated_at: true },
        orderBy: { updated_at: "desc" },
      });

    const statusResponse: {
      categoriesCount: number;
      transactionsCount: number;
      lastSync: Date | null;
      serverTime: string;
    } = {
      categoriesCount: categoryCount,
      transactionsCount: transactionCount,
      lastSync: lastUpdatedTransaction?.updated_at || null,
      serverTime: new Date().toISOString(),
    };

    console.log(
      `✅ [SYNC_STATUS] Returning status for user ${userId}:`,
      statusResponse
    );

    res.json({
      success: true,
      status: statusResponse,
    });
  } catch (error: unknown) {
    console.error("❌ [SYNC_STATUS] Error for user", req.user?.id, ":", error);
    res.status(500).json({
      success: false,
      message: "Failed to get sync status",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;
