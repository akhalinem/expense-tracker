# Expense Tracker CLI

[![codecov](https://codecov.io/gh/akhalinem/expense-tracker/branch/master/graph/badge.svg)](https://codecov.io/gh/akhalinem/expense-tracker)

A command-line expense tracker application built as part of the [Roadmap.sh Projects](https://roadmap.sh/projects/expense-tracker) collection.

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

- `ExpenseTracker.Cli/` - Main application project
- `ExpenseTracker.Cli.Tests/` - Unit tests
- `README.md` - Project documentation

## Development

The project follows standard C# coding conventions and uses:

- System.CommandLine for CLI parsing
- Microsoft.Extensions.DependencyInjection for dependency injection
- xUnit for unit testing
- Moq for mocking in tests

## Contributing

1. Fork the repository
2. Create a new branch
3. Make your changes
4. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).
