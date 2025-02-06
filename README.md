# Expense Tracker

A full-stack expense tracking application with CLI, Web API, and React frontend.

[![codecov](https://codecov.io/gh/akhalinem/expense-tracker/branch/master/graph/badge.svg)](https://codecov.io/gh/akhalinem/expense-tracker)

This project was initially built as part of the [Roadmap.sh Projects](https://roadmap.sh/projects/expense-tracker) collection.

## Overview

This application helps users manage their personal finances by tracking expenses and budgets through multiple interfaces:
- Command-line interface for quick access
- Web API for integration
- React-based web interface for user-friendly interaction

## Features

- Add, update, and delete expenses with amount, category, and description
- Set and manage monthly budgets
- View expense summaries with budget tracking
- Export expenses to CSV
- Interactive CLI with command history
- RESTful API with OpenAPI documentation
- Modern React frontend with real-time updates

## Prerequisites

- .NET 9.0 or higher
- Node.js 18+ for the frontend
- Command-line terminal

## Installation

1. Clone the repository:
```bash
git clone https://github.com/akhalinem/expense-tracker
cd expense-tracker
```

2. Build the .NET solution:
```bash
dotnet build
```

3. Install frontend dependencies:
```bash
cd ExpenseTracker.UI/web
npm install
```

## Running the Applications

### CLI Application
```bash
cd ExpenseTracker.Cli
dotnet run
```

### Web API
```bash
cd ExpenseTracker.Api
dotnet run
```

### Frontend
```bash
cd ExpenseTracker.UI/web
npm run dev
```

## Project Structure

The solution follows a clean architecture approach with the following projects:

- **ExpenseTracker.Core**: Domain entities, interfaces, and business logic
- **ExpenseTracker.Infrastructure**: Data access and service implementations
- **ExpenseTracker.Api**: REST API with CORS support
- **ExpenseTracker.Cli**: Interactive command-line interface
- **ExpenseTracker.UI**: React-based web frontend
- **ExpenseTracker.TestUtils**: Shared testing utilities
- **\*.Tests**: Unit tests for respective projects

## Technology Stack

### Backend
- .NET 9
- Entity Framework Core with SQLite
- ASP.NET Core Web API
- System.CommandLine for CLI
- xUnit for testing

### Frontend
- Next.js 15
- React 19
- Tailwind CSS
- Axios for API communication

## CLI Commands

- `add`: Add a new expense
- `list`: List expenses with optional filters
- `update`: Modify existing expense
- `delete`: Remove an expense
- `summary`: View expense summaries
- `budget`: Set or view monthly budgets
- `export`: Export expenses to CSV

## API Endpoints

- `GET /api/expenses`: List expenses
- `POST /api/expenses`: Create expense
- `PUT /api/expenses/{id}`: Update expense
- `DELETE /api/expenses/{id}`: Delete expense
- `GET /api/budgets/current`: Get current month's budget

## Project Status

Currently under development

## License

This project is open source and available under the [MIT License](LICENSE).
