# Expense Tracker

A .NET application to track personal expenses.

[![codecov](https://codecov.io/gh/akhalinem/expense-tracker/branch/master/graph/badge.svg)](https://codecov.io/gh/akhalinem/expense-tracker)

This project was initially built as part of the [Roadmap.sh Projects](https://roadmap.sh/projects/expense-tracker) collection.

## Overview

This application helps users manage their personal finances by tracking expenses through a command-line interface. It provides basic functionality for expense management including adding, deleting, and viewing expenses, along with expense summaries.

## Features

- Add new expenses with amount, category, and description
- Delete existing expenses
- View all expenses
- Get expense summaries
- Command-line interface for easy interaction

## Prerequisites

- .NET 9.0 or higher
- Command-line terminal

## Installation

1. Clone the repository:
```bash
git clone [repository-url]
cd expense-tracker
```

2. Build the project:
```bash
dotnet build
```

3. Run the application:
```bash
dotnet run --project ExpenseTracker.Cli
```

## Usage

The application supports the following commands:

```bash
# Add a new expense
expense-tracker add --amount 50.00 --category "Food" --description "Lunch"

# Delete an expense
expense-tracker delete --id 1

# List all expenses
expense-tracker list

# View expense summary
expense-tracker summary
```

## Project Structure

The solution follows a clean architecture approach with the following projects:

- **ExpenseTracker.Core**: Contains domain entities, interfaces and business logic
- **ExpenseTracker.Core.Tests**: Unit tests for the Core project
- **ExpenseTracker.Infrastructure**: Data access and external services implementation
- **ExpenseTracker.Infrastructure.Tests**: Unit tests for the Infrastructure project
- **ExpenseTracker.Cli**: Command-line interface application
- **ExpenseTracker.Cli.Tests**: Unit tests for the CLI application
- **ExpenseTracker.Api**: REST API implementation
- **ExpenseTracker.TestUtils**: Shared testing utilities

## Technology Stack

- .NET 9
- Entity Framework Core
- SQLite
- xUnit for testing
- System.CommandLine for CLI interface
- ASP.NET Core for Web API

## Getting Started

### Prerequisites

- .NET 9 SDK

### Building the Solution

```bash
dotnet restore
dotnet build
```

### Running Tests

```bash
dotnet test
```

### Running the CLI Application

```bash
cd ExpenseTracker.Cli
dotnet run
```

### Running the API

```bash
cd ExpenseTracker.Api
dotnet run
```

## Project Status

Currently under development.

## Contributing

1. Fork the repository
2. Create a new branch
3. Make your changes
4. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).
