#!/bin/bash
cd "$(dirname "$0")/../ExpenseTracker.Cli"

if [ -z "$1" ]; then
    echo "Error: Please provide backup date (YYYYMMDD_HHMMSS)"
    exit 1
fi

echo "Restoring database from backup $1..."
dotnet run restore "$1"