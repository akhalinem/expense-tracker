# Project Migration Guide

## Overview

The Expense Tracker project has evolved from a .NET-based backend with offline-first mobile app to a modern Node.js backend with cloud-first architecture using Supabase. This document outlines the migration journey and current project state.

## Architecture Evolution

### Phase 1: Original .NET Architecture (Legacy)

```
📱 Mobile App (React Native + Expo)
    ↕️ HTTP/REST API
🖥️  .NET API (C# + Entity Framework)
    ↕️ SQL Queries
💾 SQLite Database (Local Storage Only)
```

**Components:**

- `ExpenseTracker.Api/` - ASP.NET Core Web API
- `ExpenseTracker.Core/` - Business logic and models
- `ExpenseTracker.Infrastructure/` - Data access layer with Entity Framework
- `ExpenseTracker.Cli/` - Command-line interface
- `ExpenseTracker.UI/mobile/` - React Native app with local SQLite

### Phase 2: Current Node.js + Supabase Architecture

```
📱 Mobile App (React Native + Expo)
    ↕️ HTTP/REST API
🖥️  Node.js API (Express + Supabase)
    ↕️ JavaScript SDK
☁️  Supabase (Auth + Database)
    ↕️ Local Sync
💾 SQLite (Local Storage)
```

**Components:**

- `ExpenseTracker.Api.V2/` - Node.js backend with Supabase integration
- `ExpenseTracker.UI/mobile/` - Enhanced React Native app with cloud sync
- `ExpenseTracker.Api/` - Legacy .NET API (deprecated)
- `ExpenseTracker.Core/` - Legacy business logic (deprecated)
- `ExpenseTracker.Infrastructure/` - Legacy data layer (deprecated)

## Key Changes

### Backend Changes

#### From .NET to Node.js

- **Language**: C# → JavaScript/Node.js
- **Framework**: ASP.NET Core → Express.js
- **Database**: Local SQLite only → Supabase PostgreSQL + local SQLite
- **Authentication**: Custom JWT → Supabase Auth
- **ORM**: Entity Framework → Direct Supabase SDK calls

#### New Features Added

- ✅ User authentication with email confirmation
- ✅ Password reset with email deep linking
- ✅ Session management with refresh tokens
- ✅ CORS configuration for mobile apps
- ✅ Comprehensive error handling
- ✅ Input validation with express-validator

### Mobile App Changes

#### Enhanced Authentication

- **Previous**: No authentication (offline-only)
- **Current**: Full authentication flow with Supabase backend
- **New Components**: Login, Register, Password Reset screens
- **Deep Linking**: Support for email confirmation and password reset

#### Data Storage Evolution

- **Previous**: SQLite only (offline-first)
- **Current**: Hybrid approach (local SQLite + cloud sync)
- **Sync Strategy**: Local storage for offline, cloud backup for sync

#### New Features

- ✅ User registration and login
- ✅ Cloud data synchronization
- ✅ Voice recordings for transactions
- ✅ Enhanced analytics and charts
- ✅ Data export/import capabilities
- ✅ Category color customization

## Migration Status

### ✅ Completed

- [x] Node.js backend implementation (`ExpenseTracker.Api.V2/`)
- [x] Supabase integration for authentication
- [x] Mobile app authentication UI
- [x] Password reset flow with deep linking
- [x] Session management
- [x] Error handling and validation
- [x] CORS configuration
- [x] Documentation updates

### 🚧 In Progress

- [ ] Data synchronization between local SQLite and Supabase
- [ ] Migration scripts for existing local data
- [ ] Production deployment configuration

### 📋 Planned

- [ ] Deprecation of legacy .NET components
- [ ] Performance optimization
- [ ] Enhanced offline capabilities
- [ ] Real-time sync features

## File Structure Changes

### New Files Added

```
ExpenseTracker.Api.V2/              # Node.js backend
├── src/
│   ├── config/supabase.js         # Supabase configuration
│   ├── middleware/                # Express middleware
│   ├── routes/auth.js             # Authentication routes
│   └── services/authService.js    # Auth business logic
├── app.js                         # Main server file
├── package.json
└── .env.example

ExpenseTracker.UI/mobile/
├── context/AuthContext.tsx        # Authentication state
├── hooks/useAuth.ts               # Authentication hooks
├── services/auth.ts               # API communication
├── components/Auth*.tsx           # Authentication components
└── app/auth/                      # Authentication screens
```

### Legacy Files (Deprecated)

```
ExpenseTracker.Api/                # Legacy .NET API
ExpenseTracker.Core/               # Legacy business logic
ExpenseTracker.Infrastructure/     # Legacy data access
ExpenseTracker.Cli/               # Legacy CLI tool
```

## Environment Configuration

### Backend Environment Variables

```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-anon-key
APP_URL=http://localhost:3000

# Server Configuration
PORT=3000
NODE_ENV=development
```

### Mobile Environment Variables

```env
# Backend API Configuration
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_ENVIRONMENT=development
```

### Supabase Project Setup

1. Create new Supabase project
2. Configure authentication providers
3. Set up redirect URLs for deep linking
4. Configure email templates

## Development Workflow

### Current Development Setup

1. **Backend**: Start Node.js server with `npm start` in `ExpenseTracker.Api.V2/`
2. **Mobile**: Start Expo dev server with `npm start` in `ExpenseTracker.UI/mobile/`
3. **Database**: Supabase handles cloud database automatically
4. **Local Storage**: SQLite managed by Drizzle ORM

### Testing Strategy

- **Unit Tests**: Individual component and service testing
- **Integration Tests**: Authentication flow testing
- **E2E Tests**: Complete user journey testing

## Deployment Considerations

### Backend Deployment

- Node.js hosting (Vercel, Railway, Heroku)
- Environment variables configuration
- CORS settings for production domains

### Mobile App Deployment

- Expo EAS Build for app store distribution
- Environment-specific builds (dev, staging, production)
- Deep linking configuration for production URLs

### Database

- Supabase handles scaling and backups automatically
- Row Level Security (RLS) policies for data protection
- Real-time subscriptions for live updates

## Migration Benefits

### Developer Experience

- **Faster Development**: Node.js ecosystem and hot reloading
- **Better Tooling**: Modern JavaScript/TypeScript development
- **Simplified Architecture**: Single language stack (JavaScript)

### User Experience

- **Cloud Sync**: Data available across devices
- **Authentication**: Secure user accounts
- **Real-time Updates**: Live data synchronization
- **Offline Support**: Maintained with local SQLite

### Scalability

- **Supabase**: Automatic scaling and global CDN
- **Authentication**: Enterprise-grade security
- **Database**: PostgreSQL with advanced features

## Troubleshooting Common Migration Issues

### Backend Issues

- **CORS Errors**: Check origin configuration in Express CORS middleware
- **Supabase Connection**: Verify environment variables and project URL
- **Authentication Failures**: Check Supabase auth configuration

### Mobile App Issues

- **Deep Linking**: Verify app.json scheme configuration
- **API Connection**: Check backend URL in environment variables
- **Session Persistence**: Verify AsyncStorage permissions

### Development Environment

- **Port Conflicts**: Ensure backend and mobile use different ports
- **Environment Variables**: Check .env files are properly configured
- **Dependencies**: Run `npm install` in both backend and mobile directories

This migration represents a significant modernization of the Expense Tracker application, bringing it from a local-only solution to a full-featured cloud-enabled application while maintaining the benefits of offline functionality.
