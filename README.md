# Expense Tracker Mobile

A React Native mobile expense tracking application with offline-first functionality.

## Overview

This application helps users manage their personal finances by tracking income and expenses on their mobile device. Built with React Native and Expo, it offers a seamless experience with local data storage.

## Features

- **Offline-First Architecture**: Store all your financial data locally on your device
- **Income & Expense Tracking**: Record both income and expense transactions with detailed information
- **Categories**: Organize expenses by customizable categories
- **Analytics**: Visualize spending patterns with charts and category breakdowns
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

## Technology Stack

- **React Native**: Cross-platform mobile development
- **Expo**: Simplified React Native development workflow
- **SQLite with Drizzle ORM**: Local database storage
- **React Query**: Data fetching and state management
- **React Navigation**: Navigation and routing
- **Reanimated**: Smooth animations and gestures
- **React Hook Form**: Form handling with validations
- **Zod**: Type validation
- **Shopify's React Native Skia**: High-performance graphics rendering for charts

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Expo CLI
- iOS Simulator (Mac) or Android Emulator

### Installation

1. Clone the repository:
```bash
git clone https://github.com/akhalinem/expense-tracker.git
cd expense-tracker
git checkout offline-first-mobile
```

2. Install dependencies:
```bash
cd ExpenseTracker.UI/mobile
npm install
```

3. Start the development server:
```bash
npm start
```

4. Use Expo Go app on your device or an emulator to run the application.

### Database Management

The application uses SQLite with Drizzle ORM for local data storage. Database migrations are automatically applied when the app starts.

## Project Structure

- **app/**: Contains screens and navigation setup using Expo Router
- **components/**: Reusable UI components
- **db/**: Database schema and setup
- **drizzle/**: Database migrations
- **hooks/**: Custom React hooks
- **services/**: Business logic and data services
- **theme/**: Theming and styling utilities
- **types/**: TypeScript type definitions

## Features in Detail

### Transactions Management
- Add, edit, and delete income/expense transactions
- Categorize expenses with custom categories
- View transaction history with daily summaries

### Analytics
- Visualize spending by category with pie charts
- Track expense distribution across different categories

### Data Backup
- Export transaction data to Excel
- Import data from external sources

## License

This project is open source and available under the [MIT License](LICENSE).
