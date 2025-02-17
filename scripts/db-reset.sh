#!/bin/bash
cd "$(dirname "$0")/../ExpenseTracker.Cli"

echo "Resetting database..."
dotnet run reset

echo "Database reset complete"
