#!/bin/bash
cd "$(dirname "$0")/../ExpenseTracker.Cli"
dotnet run seed
