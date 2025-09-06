// Central type definitions for the expense tracker API
// Import Prisma-generated types for type safety
import type {
  User as PrismaUser,
  Category as PrismaCategory,
  Transaction as PrismaTransaction,
  TransactionCategory as PrismaTransactionCategory,
  VoiceRecording as PrismaVoiceRecording,
  Profile as PrismaProfile,
  sync_jobs as PrismaSyncJob,
  sync_performance_stats as PrismaSyncPerformanceStats,
} from "../generated/prisma";

// Re-export Prisma types with our naming conventions
export type IPrismaUser = PrismaUser;
export type IPrismaCategory = PrismaCategory;
export type IPrismaTransaction = PrismaTransaction;
export type IPrismaTransactionCategory = PrismaTransactionCategory;
export type IPrismaVoiceRecording = PrismaVoiceRecording;
export type IPrismaProfile = PrismaProfile;
export type IPrismaSyncJob = PrismaSyncJob;
export type IPrismaSyncPerformanceStats = PrismaSyncPerformanceStats;

// Transaction with categories (common query result)
export type ITransactionWithCategories = PrismaTransaction & {
  transaction_categories: (PrismaTransactionCategory & {
    category: PrismaCategory;
  })[];
};

// User interfaces
export interface IUser {
  id: string;
  email: string;
  confirmation_sent_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ISession {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  token_type: string;
}

export interface IAuthResponse {
  message: string;
  user: IUser;
  session?: ISession;
  confirmation_sent_at?: string;
}

export interface IAuthError {
  message: string;
  code: string;
  statusCode: number;
}

export interface IValidationResult {
  valid: boolean;
  user?: {
    id: string;
    email: string;
  };
  error?: string;
}

export interface IValidationErrors {
  [key: string]: string;
}

// Request/Response interfaces
export interface IRegisterRequest {
  email: string;
  password: string;
}

export interface ILoginRequest {
  email: string;
  password: string;
}

export interface IRefreshTokenRequest {
  refresh_token: string;
}

export interface IForgotPasswordRequest {
  email: string;
}

export interface IResetPasswordRequest {
  access_token: string;
  refresh_token: string;
  new_password: string;
}

export interface IValidateResetSessionRequest {
  access_token: string;
  refresh_token: string;
  type: string;
}

// Database interfaces (compatible with Prisma types)
export interface IProfile {
  id: string;
  email: string;
  created_at: Date;
  updated_at: Date;
}

export interface ICategory {
  id?: string;
  user_id?: string;
  name: string;
  color?: string;
  created_at?: Date | string;
  updated_at?: Date | string;
}

export interface ITransaction {
  id?: string;
  user_id?: string;
  amount: number;
  description?: string;
  date: Date | string;
  type: "income" | "expense";
  categories?: string[];
  created_at?: Date | string;
  updated_at?: Date | string;
}

export interface ITransactionCategory {
  transaction_id: string;
  category_id: string;
}

export interface IVoiceRecording {
  id: string;
  user_id: string;
  file_path: string;
  transcription?: string;
  processed: boolean;
  created_at: Date;
  updated_at: Date;
}

// Job and Sync interfaces
export interface IJob {
  id: string;
  user_id: string;
  job_type: string;
  status: "pending" | "processing" | "completed" | "failed";
  payload?: unknown;
  progress: number;
  total_items?: number;
  processed_items?: number;
  results?: unknown;
  error_message?: string;
  created_at: string | Date;
  updated_at: string | Date;
  started_at?: string | Date;
  completed_at?: string | Date;
}

export interface ISyncResult {
  created: number;
  updated: number;
  errors: ISyncError[];
}

export interface ISyncError {
  id?: string;
  category?: string;
  transaction?: string;
  error: string;
}

export interface ISyncRequest {
  categories: ICategory[];
  transactions: ITransaction[];
}

export interface ISyncResponse {
  success: boolean;
  message: string;
  results: {
    categories: ISyncResult;
    transactions: ISyncResult;
  };
  timestamp: string;
}

export interface ISyncResults {
  categories?: ISyncResult;
  transactions?: ISyncResult;
  upload?: unknown;
  download?: unknown;
}

// Generic API response interfaces
export interface IApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  details?: IValidationErrors;
}

export interface IJobResponse {
  success: boolean;
  message: string;
  job?: IJob;
  jobs?: IJob[];
  total?: number;
}

// Service layer types that combine Prisma and business logic
export interface ICategoryService {
  getUserCategories(userId: string): Promise<IPrismaCategory[]>;
  getCategory(
    categoryId: string,
    userId: string
  ): Promise<IPrismaCategory | null>;
  createCategory(categoryData: ICategory): Promise<IPrismaCategory>;
  updateCategory(
    categoryId: string,
    userId: string,
    updateData: Partial<ICategory>
  ): Promise<IPrismaCategory>;
  deleteCategory(categoryId: string, userId: string): Promise<boolean>;
}

export interface ITransactionService {
  getUserTransactions(
    userId: string,
    options?: {
      limit?: number;
      offset?: number;
      type?: "income" | "expense";
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<ITransactionWithCategories[]>;
  getTransaction(
    transactionId: string,
    userId: string
  ): Promise<ITransactionWithCategories | null>;
  createTransaction(
    transactionData: ITransaction
  ): Promise<ITransactionWithCategories>;
  updateTransaction(
    transactionId: string,
    userId: string,
    updateData: Partial<ITransaction>
  ): Promise<ITransactionWithCategories>;
  deleteTransaction(transactionId: string, userId: string): Promise<boolean>;
}

// Deprecated interfaces - use I-prefixed versions above
/** @deprecated Use IUser instead */
export interface User extends IUser {}
/** @deprecated Use ISession instead */
export interface Session extends ISession {}
/** @deprecated Use IAuthResponse instead */
export interface AuthResponse extends IAuthResponse {}
/** @deprecated Use IAuthError instead */
export interface AuthError extends IAuthError {}
/** @deprecated Use IValidationResult instead */
export interface ValidationResult extends IValidationResult {}
/** @deprecated Use ICategory instead */
export interface Category extends ICategory {}
/** @deprecated Use ITransaction instead */
export interface Transaction extends ITransaction {}
/** @deprecated Use IJob instead */
export interface SyncJob extends IJob {}
