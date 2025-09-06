# Expense Tracker

A full-stack expense tracking application with React Native mobile frontend, Node.js backend, and Supabase authentication.

## Overview

This application helps users manage their personal finances by tracking income and expenses. The system consists of a React Native mobile app, a Node.js backend API, and uses Supabase for authentication and cloud data storage. The app provides both local and cloud synchronization capabilities.

## Features

- **Cloud-First Architecture**: Secure cloud storage with Supabase backend
- **User Authentication**: Complete auth flow with registration, login, password reset
- **Income & Expense Tracking**: Record both income and expense transactions with detailed information
- **Categories**: Organize expenses by customizable categories with color coding
- **Analytics**: Visualize spending patterns with interactive charts and category breakdowns
- **Voice Recordings**: Record voice notes for transactions
- **Data Sync**: Seamless synchronization between local SQLite and cloud storage
- **Import/Export**: Backup and restore your financial data
- **Dark/Light Mode**: User-friendly interface that adapts to your device preferences

## Screenshots

### Transactions List & Analytics

<table>
  <tr>
    <td><img src="docs/screenshots/transactions-list.png" alt="Transactions List" width="250"/></td>
    <td><img src="docs/screenshots/analytics-chart.png" alt="Analytics View" width="250"/></td>
  </tr>
</table>

### Add New Transaction & Data Management

<table>
  <tr>
    <td><img src="docs/screenshots/add-transaction.png" alt="Add Transaction" width="250"/></td>
    <td><img src="docs/screenshots/import-export.png" alt="Import/Export" width="250"/></td>
  </tr>
</table>

## Architecture

```
📱 Mobile App (React Native + Expo)
    ↕️ HTTP/REST API
🖥️  Backend API (Node.js + Express)
    ↕️ JavaScript SDK
☁️  Supabase (Auth + Database)
    ↕️ Local Sync
💾 SQLite (Local Storage)
```

### Components

1. **Mobile App** (`ExpenseTracker.UI/mobile/`): React Native app with local SQLite storage
2. **Backend API** (`ExpenseTracker.Api.V2/`): Node.js server handling Supabase integration
3. **Legacy .NET API** (`ExpenseTracker.Api/`): Original C# API (deprecated)
4. **Core Library** (`ExpenseTracker.Core/`): Shared business logic for legacy components

## Technology Stack

### Mobile App

- **React Native**: Cross-platform mobile development
- **Expo**: Simplified React Native development workflow
- **SQLite with Drizzle ORM**: Local database storage
- **React Query**: Data fetching and state management
- **React Navigation**: Navigation and routing
- **Reanimated**: Smooth animations and gestures
- **React Hook Form**: Form handling with validations
- **Zod**: Type validation
- **Shopify's React Native Skia**: High-performance graphics rendering for charts

### Backend API

- **Node.js + Express**: Server runtime and web framework
- **Supabase**: Authentication and cloud database
- **CORS**: Cross-origin resource sharing
- **Express Validator**: Input validation and sanitization

### Infrastructure

- **Supabase**: Cloud database, authentication, and real-time features
- **SQLite**: Local mobile storage with sync capabilities

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI
- iOS Simulator (Mac) or Android Emulator

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI
- iOS Simulator (Mac) or Android Emulator
- Supabase account (for cloud features)

### Backend Setup

1. Clone the repository:

```bash
git clone https://github.com/akhalinem/expense-tracker.git
cd expense-tracker
```

2. Setup the Node.js backend:

```bash
cd ExpenseTracker.Api.V2
npm install
cp .env.example .env
# Edit .env with your Supabase credentials
npm start
```

3. Configure environment variables in `.env`:

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_key
APP_URL=http://localhost:3000
PORT=3000
```

### Mobile App Setup

1. Navigate to mobile directory:

```bash
cd ExpenseTracker.UI/mobile
npm install
```

2. Setup environment variables:

```bash
cp .env.example .env
# Edit .env with your backend URL
```

3. Configure mobile environment in `.env`:

```env
EXPO_PUBLIC_API_URL=http://localhost:3000
```

4. Start the development server:

```bash
npm start
```

5. Use Expo Go app on your device or an emulator to run the application.

### Supabase Configuration

1. Create a new Supabase project
2. Configure authentication settings:
   - **Site URL**: `http://localhost:3000`
   - **Redirect URLs**:
     - `http://localhost:3000/auth/callback/reset-password`
     - `expense-tracker://auth/reset-password`
3. Enable email authentication
4. Configure email templates for confirmation and password reset

For detailed authentication setup, see [docs/AUTHENTICATION.md](docs/AUTHENTICATION.md).

### Database Management

The application uses a hybrid approach:

- **Local**: SQLite with Drizzle ORM for offline functionality
- **Cloud**: Supabase PostgreSQL for data synchronization
- Database migrations are automatically applied when the app starts

## Project Structure

```
expense-tracker/
├── ExpenseTracker.Api.V2/          # Node.js Backend API
│   ├── src/
│   │   ├── config/                 # Supabase configuration
│   │   ├── middleware/             # Express middleware
│   │   ├── routes/                 # API route handlers
│   │   └── services/               # Business logic
│   ├── app.js                      # Main server file
│   └── package.json
├── ExpenseTracker.UI/mobile/       # React Native Mobile App
│   ├── app/                        # Screens and navigation (Expo Router)
│   ├── components/                 # Reusable UI components
│   ├── context/                    # React contexts (Auth, Loading)
│   ├── hooks/                      # Custom React hooks
│   ├── services/                   # API communication and business logic
│   ├── db/                         # Local SQLite database schema
│   ├── drizzle/                    # Database migrations
│   ├── theme/                      # Theming and styling utilities
│   └── types/                      # TypeScript type definitions
├── ExpenseTracker.Api/             # Legacy .NET API (deprecated)
├── ExpenseTracker.Core/            # Shared business logic (legacy)
├── ExpenseTracker.Infrastructure/  # Data access layer (legacy)
├── docs/                           # Documentation
│   ├── AUTH_OVERVIEW.md           # Authentication quick reference
│   ├── AUTHENTICATION.md          # Detailed auth documentation
│   └── MOBILE_AUTHENTICATION.md   # Mobile auth implementation
└── README.md
```

### Key Directories

- **Backend API**: Modern Node.js server with Supabase integration
- **Mobile App**: React Native app with local SQLite + cloud sync
- **Legacy Components**: Original .NET implementation (being phased out)
- **Documentation**: Comprehensive guides for authentication and setup

## Features in Detail

### User Authentication

- Secure user registration with email confirmation
- Login with session management
- Password reset via email with deep linking
- Session persistence across app restarts
- Comprehensive error handling and validation

### Transactions Management

- Add, edit, and delete income/expense transactions
- Categorize expenses with custom categories and colors
- View transaction history with daily summaries
- Voice recording attachments for transactions
- Cloud synchronization with offline capability

### Analytics

- Interactive charts and visualizations
- Spending analysis by category
- Historical spending trends
- Category frequency analysis
- Cumulative balance tracking

### Data Management

- Local SQLite storage for offline access
- Cloud synchronization via Supabase
- Export transaction data to Excel
- Import data from external sources
- Automatic backup and restore

## API Documentation

### Authentication Endpoints

- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/forgot-password` - Initiate password reset
- `POST /auth/reset-password` - Complete password reset
- `GET /auth/callback/reset-password` - Handle password reset callback
- `GET /auth/health` - Health check

For detailed API documentation, see [docs/AUTHENTICATION.md](docs/AUTHENTICATION.md).

## Development

### Running Tests

```bash
# Backend tests
cd ExpenseTracker.Api.V2
npm test

# Mobile app tests
cd ExpenseTracker.UI/mobile
npm test
```

### Code Style

The project uses Prettier for code formatting:

```bash
# Format mobile app code
cd ExpenseTracker.UI/mobile
npm run format
```

### Environment Variables

#### Backend (.env)

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_key
APP_URL=http://localhost:3000
PORT=3000
NODE_ENV=development
```

#### Mobile (.env)

```env
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_ENVIRONMENT=development
```

## Documentation

Comprehensive documentation is available in the `docs/` directory:

- **[Authentication Overview](docs/AUTH_OVERVIEW.md)** - Quick reference for authentication setup
- **[Detailed Authentication Guide](docs/AUTHENTICATION.md)** - Complete authentication implementation details
- **[Mobile Authentication](docs/MOBILE_AUTHENTICATION.md)** - Mobile app authentication architecture
- **[Project Migration Guide](docs/PROJECT_MIGRATION.md)** - Evolution from .NET to Node.js architecture

## License

This project is open source and available under the [MIT License](LICENSE).
