# API Reference

## Overview

The Expense Tracker API provides a comprehensive set of endpoints for authentication, data synchronization, and background job management. The API is built with Node.js and Express, using Supabase as the backend service.

## 🏗️ API Architecture

```
📱 Mobile App (React Native)
    ↕️ HTTP/REST API (Axios + Interceptors)
🖥️  Node.js Backend (Express.js)
    ↕️ Supabase SDK
☁️  Supabase (Auth + Database)
```

## 📍 Base Configuration

### API Constants (`constants/api.ts`)

```typescript
export const API_CONFIG = {
  BASE_URL: process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000",
  TIMEOUT: 15000, // 15 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 2000, // 2 seconds
} as const;

export const API_ENDPOINTS = {
  // Authentication
  AUTH_LOGIN: "/auth/login",
  AUTH_REGISTER: "/auth/register",
  AUTH_FORGOT_PASSWORD: "/auth/forgot-password",
  AUTH_REFRESH: "/auth/refresh",

  // Sync Operations
  SYNC_UPLOAD: "/api/sync/upload",
  SYNC_DOWNLOAD: "/api/sync/download",
  SYNC_FULL: "/api/sync/full",
  SYNC_STATUS: "/api/sync/status",

  // Background Jobs
  JOBS_CREATE: "/api/jobs/sync",
  JOBS_STATUS: (jobId: string) => `/api/jobs/${jobId}`,
  JOBS_HISTORY: "/api/jobs",
} as const;
```

### HTTP Status Codes

```typescript
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const;
```

### Error Messages

```typescript
export const ERROR_MESSAGES = {
  NETWORK_ERROR:
    "Cannot connect to server. Please check your network connection.",
  AUTH_REQUIRED: "Authentication required. Please sign in again.",
  SERVER_ERROR: "Server error. Please try again later.",
  TIMEOUT_ERROR: "Request timeout. Please check your connection and try again.",
  TOKEN_EXPIRED: "Your session has expired. Please sign in again.",
  SYNC_FAILED: "Sync operation failed. Please try again.",
  UNKNOWN_ERROR: "An unexpected error occurred.",
} as const;
```

## 🔐 Authentication Endpoints

### POST `/auth/register`

Creates a new user account with email confirmation.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response (Email Confirmation Required):**

```json
{
  "message": "Account created successfully! Please check your email to confirm your account.",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "confirmation_sent_at": "2025-09-01T10:00:00Z"
  }
}
```

**Response (Auto-Confirmed):**

```json
{
  "message": "Account created and signed in successfully!",
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  },
  "session": {
    "access_token": "jwt_token",
    "refresh_token": "refresh_token",
    "expires_at": 1693564800,
    "token_type": "bearer"
  }
}
```

**Error Responses:**

- `400 Bad Request` - Validation errors
- `409 Conflict` - Email already exists
- `500 Internal Server Error` - Server error

### POST `/auth/login`

Authenticates an existing user.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "userPassword"
}
```

**Response:**

```json
{
  "message": "Signed in successfully!",
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  },
  "session": {
    "access_token": "jwt_token",
    "refresh_token": "refresh_token",
    "expires_at": 1693564800,
    "token_type": "bearer"
  }
}
```

**Error Responses:**

- `400 Bad Request` - Validation errors
- `401 Unauthorized` - Invalid credentials
- `400 Bad Request` - Email not confirmed

### POST `/auth/refresh`

Refreshes an expired access token using a refresh token.

**Request Body:**

```json
{
  "refresh_token": "refresh_token_string"
}
```

**Response:**

```json
{
  "message": "Token refreshed successfully",
  "session": {
    "access_token": "new_jwt_token",
    "refresh_token": "new_refresh_token",
    "expires_at": 1693564800,
    "token_type": "bearer"
  }
}
```

**Error Responses:**

- `401 Unauthorized` - Invalid or expired refresh token
- `400 Bad Request` - Missing refresh token

### POST `/auth/forgot-password`

Initiates password reset process.

**Request Body:**

```json
{
  "email": "user@example.com"
}
```

**Response:**

```json
{
  "message": "If an account with this email exists, you will receive a password reset link shortly."
}
```

### GET `/auth/callback/reset-password`

Handles password reset callbacks from Supabase.

**Query Parameters:**

- `access_token` - JWT access token
- `refresh_token` - Refresh token
- `type` - Should be "recovery"

**Response:** HTML page that redirects to mobile app with deep link:

```
expense-tracker://auth/reset-password?access_token=...&refresh_token=...
```

### POST `/auth/validate-reset-session`

Validates reset session tokens.

**Request Body:**

```json
{
  "access_token": "jwt_token",
  "refresh_token": "refresh_token"
}
```

**Response (Valid):**

```json
{
  "valid": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  }
}
```

**Response (Invalid):**

```json
{
  "valid": false,
  "error": "Invalid or expired reset tokens"
}
```

### POST `/auth/reset-password`

Completes password reset with new password.

**Headers:**

```
Authorization: Bearer <access_token>
```

**Request Body:**

```json
{
  "newPassword": "newSecurePassword123"
}
```

**Response:**

```json
{
  "message": "Password updated successfully! You can now sign in with your new password."
}
```

### GET `/auth/health`

Health check endpoint for authentication configuration.

**Response:**

```json
{
  "status": "ok",
  "config": {
    "supabaseConfigured": true,
    "appUrlConfigured": true,
    "supabaseUrl": "configured",
    "supabaseKey": "configured",
    "appUrl": "http://localhost:3000"
  }
}
```

## 🔄 Sync Endpoints

### POST `/api/sync/upload`

Uploads local data to cloud storage.

**Headers:**

```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "categories": [
    {
      "name": "Food",
      "color": "#FF6B6B",
      "created_at": "2025-09-01T10:00:00Z",
      "updated_at": "2025-09-01T10:00:00Z"
    }
  ],
  "transactions": [
    {
      "amount": 25.5,
      "description": "Lunch",
      "date": "2025-09-01",
      "type": "expense",
      "categories": ["Food"],
      "created_at": "2025-09-01T10:00:00Z",
      "updated_at": "2025-09-01T10:00:00Z"
    }
  ]
}
```

**Response:**

```json
{
  "success": true,
  "message": "Data uploaded successfully",
  "results": {
    "upload": {
      "categories": {
        "created": 1,
        "updated": 0,
        "errors": []
      },
      "transactions": {
        "created": 1,
        "updated": 0,
        "errors": []
      }
    },
    "timestamp": "2025-09-01T10:05:00Z"
  }
}
```

### GET `/api/sync/download`

Downloads cloud data to local storage.

**Headers:**

```
Authorization: Bearer <access_token>
```

**Response:**

```json
{
  "success": true,
  "message": "Data downloaded successfully",
  "data": {
    "categories": [
      {
        "id": 1,
        "name": "Food",
        "color": "#FF6B6B",
        "created_at": "2025-09-01T10:00:00Z",
        "updated_at": "2025-09-01T10:00:00Z"
      }
    ],
    "transactions": [
      {
        "id": 1,
        "amount": 25.5,
        "description": "Lunch",
        "date": "2025-09-01",
        "type": "expense",
        "categories": ["Food"],
        "created_at": "2025-09-01T10:00:00Z",
        "updated_at": "2025-09-01T10:00:00Z"
      }
    ]
  },
  "timestamp": "2025-09-01T10:05:00Z"
}
```

### POST `/api/sync/full`

Performs full bidirectional sync (upload then download).

**Headers:**

```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:** Same as upload endpoint

**Response:**

```json
{
  "success": true,
  "message": "Full sync completed successfully",
  "results": {
    "upload": {
      "categories": { "created": 1, "updated": 0, "errors": [] },
      "transactions": { "created": 1, "updated": 0, "errors": [] }
    },
    "download": {
      "categories": [...],
      "transactions": [...]
    },
    "timestamp": "2025-09-01T10:05:00Z"
  }
}
```

### GET `/api/sync/status`

Gets current cloud data statistics.

**Headers:**

```
Authorization: Bearer <access_token>
```

**Response:**

```json
{
  "success": true,
  "status": {
    "categoriesCount": 5,
    "transactionsCount": 25,
    "lastSync": "2025-09-01T10:00:00Z",
    "serverTime": "2025-09-01T10:05:00Z"
  }
}
```

## 🔄 Background Job Endpoints

### POST `/api/jobs/sync`

Creates a background sync job.

**Headers:**

```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "type": "full_sync",
  "categories": [...],
  "transactions": [...]
}
```

**Response:**

```json
{
  "success": true,
  "message": "Sync job created successfully",
  "job": {
    "id": "job_uuid",
    "type": "full_sync",
    "status": "pending",
    "progress": 0,
    "total_items": 0,
    "processed_items": 0,
    "created_at": "2025-09-01T10:00:00Z"
  }
}
```

### GET `/api/jobs/{jobId}`

Gets status of a specific background job.

**Headers:**

```
Authorization: Bearer <access_token>
```

**Response:**

```json
{
  "success": true,
  "job": {
    "id": "job_uuid",
    "type": "full_sync",
    "status": "processing",
    "progress": 75,
    "total_items": 100,
    "processed_items": 75,
    "created_at": "2025-09-01T10:00:00Z",
    "updated_at": "2025-09-01T10:02:00Z",
    "started_at": "2025-09-01T10:00:30Z"
  }
}
```

**Job Status Values:**

- `pending` - Job queued but not started
- `processing` - Job currently running
- `completed` - Job finished successfully
- `failed` - Job encountered an error

### GET `/api/jobs`

Gets job history for the authenticated user.

**Headers:**

```
Authorization: Bearer <access_token>
```

**Query Parameters:**

- `limit` (optional) - Number of jobs to return (default: 10)

**Response:**

```json
{
  "success": true,
  "jobs": [
    {
      "id": "job_uuid_1",
      "type": "full_sync",
      "status": "completed",
      "progress": 100,
      "created_at": "2025-09-01T10:00:00Z",
      "completed_at": "2025-09-01T10:02:30Z"
    },
    {
      "id": "job_uuid_2",
      "type": "upload",
      "status": "failed",
      "progress": 45,
      "error_message": "Network timeout",
      "created_at": "2025-09-01T09:00:00Z"
    }
  ]
}
```

## 📊 Shared Types & Interfaces

### Authentication Types

```typescript
export interface AuthUser {
  id: string;
  email: string;
  token: string;
  refreshToken?: string;
  expiresAt?: number;
}

export interface AuthResponse {
  message: string;
  user: {
    id: string;
    email: string;
    confirmation_sent_at?: string;
  };
  session?: {
    access_token: string;
    refresh_token: string;
    expires_at: number;
    token_type: string;
  };
}
```

### Sync Types

```typescript
export interface SyncResults {
  success: boolean;
  message: string;
  results?: {
    upload: {
      categories: { created: number; updated: number; errors: any[] };
      transactions: { created: number; updated: number; errors: any[] };
    };
    download: {
      categories: any[];
      transactions: any[];
    };
    timestamp: string;
  };
  error?: string;
}

export interface SyncStatus {
  categoriesCount: number;
  transactionsCount: number;
  lastSync: string | null;
  serverTime: string;
}

export interface SyncJob {
  id: string;
  type: "upload" | "download" | "full_sync";
  status: "pending" | "processing" | "completed" | "failed";
  progress: number;
  total_items: number;
  processed_items: number;
  created_at: string;
  updated_at: string;
  started_at?: string;
  completed_at?: string;
  error_message?: string;
  results?: any;
}
```

### API Response Types

```typescript
export interface BaseApiResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export interface ApiResponse<T = any> extends BaseApiResponse {
  data?: T;
}

export interface ApiError {
  error: string;
  code?: string;
  details?: Record<string, any>;
}

export interface PaginatedResponse<T> extends BaseApiResponse {
  data: T[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}
```

### Progress Callback Type

```typescript
export interface ProgressCallback {
  (progress: number, status: string, message?: string): void;
}
```

## 🛡️ Authentication & Security

### Token Configuration

```typescript
export const TOKEN_CONFIG = {
  REFRESH_BUFFER_MINUTES: 5, // Refresh token 5 minutes before expiry
  MAX_REFRESH_ATTEMPTS: 3,
} as const;
```

### Request Headers

All authenticated endpoints require:

```
Authorization: Bearer <access_token>
Content-Type: application/json
```

### Error Detection Utilities

```typescript
// Network error detection
export const isNetworkError = (error: any): boolean => {
  return (
    error?.code === "NETWORK_ERROR" ||
    error?.code === "ECONNABORTED" ||
    error?.code === "ENOTFOUND" ||
    error?.code === "ECONNREFUSED" ||
    error?.message === "Network Error"
  );
};

// Auth error detection
export const isAuthError = (error: any): boolean => {
  return error?.response?.status === HTTP_STATUS.UNAUTHORIZED;
};

// Server error detection
export const isServerError = (error: any): boolean => {
  return error?.response?.status === HTTP_STATUS.INTERNAL_SERVER_ERROR;
};
```

## 📈 Rate Limiting & Performance

### Polling Configuration

```typescript
export const POLLING_CONFIG = {
  INTERVAL_MS: 3000, // 3 seconds
  MAX_ATTEMPTS: 300, // 5 minutes max polling
  MIN_INTERVAL_MS: 500, // Minimum polling interval
} as const;
```

### Timeouts & Retries

- **Request Timeout**: 15 seconds
- **Retry Attempts**: 3 attempts with exponential backoff
- **Retry Delay**: 2 seconds base delay

## 🧪 Testing Endpoints

### Using cURL

```bash
# Register a new user
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass123"}'

# Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass123"}'

# Get sync status (requires token)
curl -X GET http://localhost:3000/api/sync/status \
  -H "Authorization: Bearer YOUR_TOKEN"

# Create sync job
curl -X POST http://localhost:3000/api/jobs/sync \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type":"upload","categories":[],"transactions":[]}'
```

### Using JavaScript/TypeScript

```typescript
import api from "./services/api";

// Login
const loginResponse = await api.post("/auth/login", {
  email: "user@example.com",
  password: "password123",
});

// Sync data (token automatically added by interceptor)
const syncResponse = await api.post("/api/sync/upload", {
  categories: localCategories,
  transactions: localTransactions,
});

// Monitor job progress
const jobStatus = await api.get(`/api/jobs/${jobId}`);
```

This API reference provides comprehensive documentation for all available endpoints, including request/response formats, authentication requirements, and error handling patterns. The centralized constants and types ensure consistent usage across the entire application.
