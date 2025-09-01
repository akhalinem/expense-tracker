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

- ✅ **User Registration** with email confirmation
- ✅ **User Login** with session management
- ✅ **Password Reset** via email with deep linking
- ✅ **Session Persistence** across app restarts
- ✅ **Local Network Support** (works with IP addresses)

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

- Create Supabase project
- Add redirect URL: `http://YOUR_IP:3000/auth/callback/reset-password`
- Remove localhost from Site URL
- Configure email templates

## 📖 Detailed Documentation

For complete documentation including:

- Detailed flow diagrams
- API endpoint specifications
- Security considerations
- Troubleshooting guide
- Configuration details

See: **[AUTHENTICATION.md](./AUTHENTICATION.md)**

## 🔄 Password Reset Flow Summary

The most complex part of the auth system:

1. **Mobile App** → Request reset via API
2. **Backend** → Tell Supabase to send email
3. **Email Link** → Opens backend callback URL
4. **Backend** → Validates tokens with `supabase.auth.setSession()`
5. **Backend** → Redirects to mobile app via deep link
6. **Mobile App** → User sets new password
7. **Backend** → Updates password in Supabase
8. **Mobile App** → User logs in → Navigate to main app

## 🛠️ Key Technologies

- **Backend**: Node.js, Express, Supabase JS SDK
- **Mobile**: React Native, Expo Router, AsyncStorage
- **Auth Provider**: Supabase Auth
- **Deep Linking**: Expo Linking with custom scheme

## 🐛 Common Issues & Solutions

| Issue                             | Solution                                     |
| --------------------------------- | -------------------------------------------- |
| Reset link goes to localhost      | Remove localhost from Supabase Site URL      |
| "Initial URL: null" error         | Check deep link scheme in app.json           |
| Stuck in reset screen after login | Use `router.replace()` not `router.back()`   |
| "Invalid tokens" error            | Ensure backend validates with `setSession()` |

---

_This authentication system provides enterprise-grade security with excellent developer and user experience._ 🎉
