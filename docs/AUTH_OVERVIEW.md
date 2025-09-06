# Expense Tracker - Authentication Flow

## Quick Overview

This app uses a **hybrid authentication system** with Supabase + Node.js backend + React Native mobile app.

### 🏗️ Architecture

```
📱 Mobile App (React Native + Expo)
    ↕️ HTTP/REST API
🖥️  Backend (Node.js + Express)
    ↕️ JavaScript SDK
☁️  Supabase (Auth + Database)
```

### 🔐 Authentication Features

- ✅ **User Registration** with email confirmation and deep linking
- ✅ **User Login** with secure session management
- ✅ **Password Reset** via email with deep linking support
- ✅ **Session Persistence** across app restarts using AsyncStorage
- ✅ **Token Refresh Flow** with automatic session renewal
- ✅ **Centralized API Service** with interceptors and error handling
- ✅ **Local Network Support** (works with IP addresses and localhost)
- ✅ **Input Validation** with comprehensive error handling
- ✅ **CORS Configuration** for cross-origin requests

## 🚀 Quick Start

### 1. Backend Setup

```bash
cd ExpenseTracker.Api.V2
npm install
cp .env.example .env
# Edit .env with your Supabase credentials and IP
npm start
```

### 2. Mobile App Setup

```bash
cd ExpenseTracker.UI/mobile
npm install
cp .env.example .env
# Edit .env with your backend IP
npx expo start
```

### 3. Supabase Configuration

- Create Supabase project at [supabase.com](https://supabase.com)
- Configure authentication settings:
  - **Site URL**: `http://localhost:3000` (or your backend URL)
  - **Redirect URLs**:
    - `http://localhost:3000/auth/callback/reset-password`
    - `http://localhost:3000/auth/callback/confirm-email`
    - `expense-tracker://auth/reset-password`
    - `expense-tracker://auth/login`
- Enable email authentication provider
- Configure custom email templates (optional)
- Remove localhost from Site URL for production

### 4. Environment Variables

**Backend (.env)**:

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
DATABASE_URL=your_postgres_connection_string
DIRECT_URL=your_postgres_direct_connection_string
APP_URL=http://localhost:3000
PORT=3000
```

**Note:** We use Supabase only for authentication. Database operations use Prisma with direct PostgreSQL connection.

**Mobile (.env)**:

```env
EXPO_PUBLIC_API_URL=http://localhost:3000
```

## 📖 Detailed Documentation

For complete documentation including:

- Detailed flow diagrams
- API endpoint specifications
- Security considerations
- Troubleshooting guide
- Configuration details

See: **[AUTHENTICATION.md](./AUTHENTICATION.md)**

## 🔄 Authentication Flows Summary

### Registration Flow

1. **Mobile App** → Submit registration form with validation
2. **Backend** → Create user account via Supabase
3. **Supabase** → Send email confirmation link
4. **Email Link** → Opens backend callback URL
5. **Backend** → Handles confirmation and redirects to mobile app
6. **Mobile App** → User can now sign in

### Login Flow

1. **Mobile App** → Submit login credentials
2. **Backend** → Authenticate with Supabase
3. **Backend** → Return user data and session tokens
4. **Mobile App** → Store session in AsyncStorage and navigate to main app

### Password Reset Flow (Most Complex)

1. **Mobile App** → Request reset via API
2. **Backend** → Tell Supabase to send reset email
3. **Email Link** → Opens backend callback URL
4. **Backend** → Validates tokens with `supabase.auth.setSession()`
5. **Backend** → Redirects to mobile app via deep link with tokens
6. **Mobile App** → Validate reset session tokens
7. **Mobile App** → User sets new password
8. **Backend** → Updates password in Supabase
9. **Mobile App** → Navigate to login screen

### Token Refresh Flow (Automatic)

1. **Mobile App** → Detects token expiration (5-minute buffer)
2. **API Service** → Intercepts 401 responses
3. **API Service** → Uses refresh token to get new access token
4. **API Service** → Updates stored session and retries original request
5. **AuthContext** → Auto-refreshes tokens on app launch if needed

## 🛠️ Key Technologies

- **Backend**: Node.js, Express, Supabase JS SDK, Express Validator
- **Mobile**: React Native, Expo Router, AsyncStorage, React Query
- **Auth Provider**: Supabase Auth with email confirmation and token refresh
- **Deep Linking**: Expo Linking with custom scheme (`expense-tracker://`)
- **Validation**: Zod (mobile), Express Validator (backend)
- **Storage**: AsyncStorage (sessions), SQLite (local data)
- **API**: Centralized API service with Axios interceptors and automatic token refresh

## 🐛 Common Issues & Solutions

| Issue                             | Solution                                     |
| --------------------------------- | -------------------------------------------- |
| Reset link goes to localhost      | Remove localhost from Supabase Site URL      |
| "Initial URL: null" error         | Check deep link scheme in app.json           |
| Stuck in reset screen after login | Use `router.replace()` not `router.back()`   |
| "Invalid tokens" error            | Ensure backend validates with `setSession()` |
| CORS errors                       | Check backend CORS configuration             |
| "Invalid login credentials"       | User may need to confirm email first         |
| Session not persisting            | Check AsyncStorage permissions               |
| Deep links not working            | Verify URL scheme in app.json and Supabase   |
| Token refresh failures            | Check refresh token storage and expiry       |
| 401 errors after app restart      | Verify token refresh flow in API interceptor |

## 🔧 Health Check

The backend provides a health check endpoint to verify configuration:

```bash
GET http://localhost:3000/auth/health
```

Returns:

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

---

_This authentication system provides enterprise-grade security with excellent developer and user experience._ 🎉
