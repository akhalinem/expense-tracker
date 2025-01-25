using System.CommandLine;
using System.Globalization;

namespace ExpenseTracker.Cli.Services;

public class CliService
{
    private readonly ExpenseTrackerService _expenseTrackerService;

    public CliService(ExpenseTrackerService expenseTrackerService)
    {
        _expenseTrackerService = expenseTrackerService;
    }

    public RootCommand BuildCommandLine()
    {
        var rootCommand = new RootCommand("Expense Tracker CLI");

        rootCommand.AddCommand(BuildAddCommand());
        rootCommand.AddCommand(BuildListCommand());
        rootCommand.AddCommand(BuildUpdateCommand());
        rootCommand.AddCommand(BuildDeleteCommand());
        rootCommand.AddCommand(BuildSummaryCommand());
        rootCommand.AddCommand(BuildBudgetCommand());
        rootCommand.AddCommand(BuildExportCommand());

        return rootCommand;
    }

    private Command BuildAddCommand()
    {
        var addCommand = new Command("add", "Add a new expense");
        var addNameOption = new Option<string>("--name", "Name of the expense") { IsRequired = true };
        var addAmountOption = new Option<decimal>("--amount", "Amount of the expense") { IsRequired = true };
        var addCategoryOption = new Option<string>("--category", "Category of the expense");

        addCommand.AddOption(addNameOption);
        addCommand.AddOption(addAmountOption);
        addCommand.AddOption(addCategoryOption);

        addCommand.SetHandler((name, amount, category) =>
        {
            var expense = _expenseTrackerService.AddExpense(name, amount, category);
            if (expense != null)
            {
                Console.WriteLine($"Added expense: {expense.Name} - {ExpenseTrackerService.DisplayAmount(expense.Amount)}");
            }
        }, addNameOption, addAmountOption, addCategoryOption);

        return addCommand;
    }

    private Command BuildListCommand()
    {
        var listCommand = new Command("list", "List all expenses");

        listCommand.SetHandler(() =>
        {
            var expenses = _expenseTrackerService.ListExpenses();
            var format = "{0,-40} {1,-15} {2,10} {3, 12} {4,25} {5,25}";
            Console.WriteLine(format, "ID", "Name", "Amount", "Category", "Created At", "Updated At");
            Console.WriteLine(new string('-', 135));

            foreach (var expense in expenses)
            {
                Console.WriteLine(format,
                    expense.Id.ToString(),
                    expense.Name,
                    ExpenseTrackerService.DisplayAmount(expense.Amount),
                    expense.Category,
                    expense.CreatedAt.ToString("MM/dd/yyyy hh:mm:ss tt"),
                    expense.UpdatedAt?.ToString("MM/dd/yyyy hh:mm:ss tt") ?? string.Empty
                );
            }
        });

        return listCommand;
    }

    private Command BuildUpdateCommand()
    {
        var updateCommand = new Command("update", "Update an expense");
        var updateIdOption = new Option<Guid>("--id", "ID of the expense") { IsRequired = true };
        var updateNameOption = new Option<string>("--name", "New name of the expense") { IsRequired = false };
        var updateAmountOption = new Option<decimal>("--amount", "New amount of the expense") { IsRequired = false };
        var updateCategoryOption = new Option<string>("--category", "New category of the expense") { IsRequired = false };

        updateCommand.AddOption(updateIdOption);
        updateCommand.AddOption(updateNameOption);
        updateCommand.AddOption(updateAmountOption);
        updateCommand.AddOption(updateCategoryOption);
        updateCommand.SetHandler((id, name, amount, category) =>
        {
            var expense = _expenseTrackerService.UpdateExpense(id, name, amount, category);
            if (expense == null)
            {
                Console.WriteLine("Expense not found");
            }
            else
            {
                Console.WriteLine($"Updated expense: {expense.Name} - {ExpenseTrackerService.DisplayAmount(expense.Amount)}");
            }
        }, updateIdOption, updateNameOption, updateAmountOption, updateCategoryOption);

        return updateCommand;
    }

    private Command BuildDeleteCommand()
    {
        var deleteCommand = new Command("delete", "Delete an expense");
        var deleteIdOption = new Option<Guid>("--id", "ID of the expense") { IsRequired = true };
        deleteCommand.AddOption(deleteIdOption);
        deleteCommand.SetHandler((id) =>
        {
            if (_expenseTrackerService.DeleteExpense(id))
            {
                Console.WriteLine("Expense deleted");
            }
            else
            {
                Console.WriteLine("Expense not found");
            }
        }, deleteIdOption);

        return deleteCommand;
    }

    private Command BuildSummaryCommand()
    {
        var summaryCommand = new Command("summary", "Get expense summary");
        var monthOption = new Option<int?>("--month", "Month number (1-12)");
        var yearOption = new Option<int?>("--year", "Year");

        summaryCommand.AddOption(monthOption);
        summaryCommand.AddOption(yearOption);

        summaryCommand.SetHandler((month, year) =>
        {
            var summary = (month, year) switch
            {
                (null, null) => _expenseTrackerService.GetSummary(),
                (int m, null) => _expenseTrackerService.GetSummary(m),
                (int m, int y) => _expenseTrackerService.GetSummary(m, y),
                _ => throw new ArgumentException("Invalid month/year combination")
            };

            var period = GetPeriod(month, year);

            if (summary.IsOverBudget)
            {
                Console.WriteLine($"WARNING: You have exceeded your budget by {ExpenseTrackerService.DisplayAmount(summary.Total - summary.Budget.Value)}!");
            }
            else
            {
                Console.WriteLine($"{period} Expenses: {ExpenseTrackerService.DisplayAmount(summary.Total)}");
                if (summary.Budget != null)
                {
                    Console.WriteLine($"{period} Budget: {ExpenseTrackerService.DisplayAmount(summary.Budget.Value)}");
                    Console.WriteLine($"{period} Remaining: {ExpenseTrackerService.DisplayAmount(summary.Remaining)}");
                }
            }
        }, monthOption, yearOption);

        return summaryCommand;
    }

    private Command BuildBudgetCommand()
    {
        var budgetCommand = new Command("budget", "Set or view monthly budget");
        var monthOption = new Option<int>("--month", "Month number (1-12)") { IsRequired = true };
        var yearOption = new Option<int?>("--year", "Year");
        var amountOption = new Option<decimal?>("--amount", "Budget amount");

        budgetCommand.AddOption(monthOption);
        budgetCommand.AddOption(yearOption);
        budgetCommand.AddOption(amountOption);

        budgetCommand.SetHandler((month, year, amount) =>
        {
            var activeYear = year ?? DateTime.Now.Year;
            var budget = _expenseTrackerService.GetBudget(month, activeYear);

            if (amount.HasValue)
            {
                budget = _expenseTrackerService.SetBudget(month, activeYear, amount.Value);
            }

            var period = GetPeriod(month, year);

            if (budget?.Amount == null)
            {
                Console.WriteLine($"No budget set for {CultureInfo.CurrentCulture.DateTimeFormat.GetMonthName(month)} {year}");
            }
            else
            {
                Console.WriteLine($"Budget for {CultureInfo.CurrentCulture.DateTimeFormat.GetMonthName(month)} {year}: {ExpenseTrackerService.DisplayAmount(budget.Amount.Value)}");
            }
        }, monthOption, yearOption, amountOption);

        return budgetCommand;
    }

    private Command BuildExportCommand()
    {
        var exportCommand = new Command("export", "Export expenses to a file");
        var pathOption = new Option<string>("--path", "Path to export file") { IsRequired = true };
        var monthOption = new Option<int?>("--month", "Month number (1-12)");
        var yearOption = new Option<int?>("--year", "Year");

        exportCommand.AddOption(pathOption);
        exportCommand.AddOption(monthOption);
        exportCommand.AddOption(yearOption);

        exportCommand.SetHandler((filePath, month, year) =>
        {
            try
            {
                _expenseTrackerService.ExportToCsv(filePath, month, year);
                var period = GetPeriod(month, year);
                Console.WriteLine($"Expenses exported to {filePath} for {period}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error exporting expenses: {ex.Message}");
            }
        }, pathOption, monthOption, yearOption);

        return exportCommand;
    }

    private static string GetPeriod(int? month, int? year)
    {
        var period = (month, year) switch
        {
            (null, null) => "Total",
            (int m, null) => $"{CultureInfo.CurrentCulture.DateTimeFormat.GetMonthName(m)} {DateTime.Now.Year}",
            (int m, int y) => $"{CultureInfo.CurrentCulture.DateTimeFormat.GetMonthName(m)} {y}",
            _ => "Invalid period"
        };

        return period;
    }
}