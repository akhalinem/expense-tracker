#!/bin/bash
cd "$(dirname "$0")/../ExpenseTracker.Cli"
echo "Creating backup in $(pwd)/data/backup"
dotnet run backup
