using System.CommandLine;
using System.Globalization;
using ExpenseTracker.Core.Helpers;
using ExpenseTracker.Core.Interfaces;

namespace ExpenseTracker.Cli.Services;

public class CliService
{
    private readonly IExpenseService _expenseService;
    private readonly IBudgetService _budgetService;

    public CliService(
        IExpenseService expenseService,
        IBudgetService budgetService)
    {
        _expenseService = expenseService;
        _budgetService = budgetService;
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
        var nameOption = new Option<string>("--name", "Expense name") { IsRequired = true };
        var amountOption = new Option<decimal>("--amount", "Expense amount") { IsRequired = true };
        var categoryOption = new Option<string?>("--category", "Expense category");

        addCommand.AddOption(nameOption);
        addCommand.AddOption(amountOption);
        addCommand.AddOption(categoryOption);

        addCommand.SetHandler(async (name, amount, category) =>
        {
            var result = await _expenseService.Add(name, amount, category);
            if (result.IsSuccess)
            {
                Console.WriteLine($"Added expense: {result.Value!.Name} ({FormatAmount(result.Value.Amount)})");
            }
            else
            {
                Console.WriteLine($"Error: {result.Error}");
            }
        }, nameOption, amountOption, categoryOption);

        return addCommand;
    }

    private Command BuildListCommand()
    {
        var listCommand = new Command("list", "List expenses");
        var categoryOption = new Option<string?>("--category", "Filter by category");
        var monthOption = new Option<int?>("--month", "Filter by month (1-12)");
        var yearOption = new Option<int?>("--year", "Filter by year");

        listCommand.AddOption(categoryOption);
        listCommand.AddOption(monthOption);
        listCommand.AddOption(yearOption);

        listCommand.SetHandler(async (category, month, year) =>
        {
            var result = await _expenseService.List(month, year);
            if (!result.IsSuccess)
            {
                Console.WriteLine($"Error: {result.Error}");
                return;
            }

            var expenses = result.Value!;
            if (category != null)
            {
                expenses = expenses.Where(e => e.Category == category);
            }

            var format = "{0,-40} {1,-20} {2,12} {3, 12} {4,25} {5,25}";
            Console.WriteLine(format, "ID", "Name", "Amount", "Category", "Created At", "Updated At");
            Console.WriteLine(new string('-', 150));

            foreach (var expense in expenses)
            {
                Console.WriteLine(format,
                    expense.Id.ToString("d"),
                    expense.Name,
                    FormatAmount(expense.Amount),
                    expense.Category,
                    expense.CreatedAt.ToString("MM/dd/yyyy hh:mm:ss tt"),
                    expense.UpdatedAt?.ToString("MM/dd/yyyy hh:mm:ss tt")
                );
            }
        }, categoryOption, monthOption, yearOption);

        return listCommand;
    }

    private Command BuildUpdateCommand()
    {
        var updateCommand = new Command("update", "Update an expense");
        var idOption = new Option<Guid>("--id", "Expense ID") { IsRequired = true };
        var nameOption = new Option<string?>("--name", "New name");
        var amountOption = new Option<decimal?>("--amount", "New amount");
        var categoryOption = new Option<string?>("--category", "New category");

        updateCommand.AddOption(idOption);
        updateCommand.AddOption(nameOption);
        updateCommand.AddOption(amountOption);
        updateCommand.AddOption(categoryOption);

        updateCommand.SetHandler(async (id, name, amount, category) =>
        {
            var result = await _expenseService.Update(id, name, amount, category);
            if (result.IsSuccess)
            {
                Console.WriteLine($"Updated expense: {result.Value!.Name} ({FormatAmount(result.Value.Amount)})");
            }
            else
            {
                Console.WriteLine($"Error: {result.Error}");
            }
        }, idOption, nameOption, amountOption, categoryOption);

        return updateCommand;
    }

    private Command BuildDeleteCommand()
    {
        var deleteCommand = new Command("delete", "Delete an expense");
        var idOption = new Option<Guid>("--id", "Expense ID") { IsRequired = true };

        deleteCommand.AddOption(idOption);

        deleteCommand.SetHandler(async id =>
        {
            var result = await _expenseService.Delete(id);
            if (result.IsSuccess)
            {
                Console.WriteLine("Expense deleted successfully");
            }
            else
            {
                Console.WriteLine($"Error: {result.Error}");
            }
        }, idOption);

        return deleteCommand;
    }

    private Command BuildSummaryCommand()
    {
        var summaryCommand = new Command("summary", "Show expense summary");
        var monthOption = new Option<int?>("--month", "Month (1-12)");
        var yearOption = new Option<int?>("--year", "Year");

        summaryCommand.AddOption(monthOption);
        summaryCommand.AddOption(yearOption);

        summaryCommand.SetHandler(async (month, year) =>
        {
            var totalExpensesResult = await _expenseService.GetTotal(month, year);
            if (!totalExpensesResult.IsSuccess)
            {
                Console.WriteLine($"Error: {totalExpensesResult.Error}");
                return;
            }

            var totalExpenses = totalExpensesResult.Value!;
            var period = GetPeriod(month, year);

            Console.WriteLine($"{period} Expenses: {FormatAmount(totalExpenses)}");

            if (month != null && year != null)
            {
                var budgetResult = await _budgetService.GetBudget(month.Value, year.Value);
                if (!budgetResult.IsSuccess)
                {
                    Console.WriteLine($"Error: {budgetResult.Error}");
                    return;
                }

                var budget = budgetResult.Value;
                if (budget?.Amount != null)
                {
                    Console.WriteLine($"Budget: {FormatAmount(budget.Amount)}");
                    if (totalExpenses > budget.Amount)
                    {
                        Console.WriteLine($"WARNING: Budget exceeded by {FormatAmount(totalExpenses - budget.Amount)}!");
                    }
                    else
                    {
                        Console.WriteLine($"Remaining: {FormatAmount(budget.Amount - totalExpenses)}");
                    }
                }
            }
        }, monthOption, yearOption);

        return summaryCommand;
    }

    private Command BuildBudgetCommand()
    {
        var budgetCommand = new Command("budget", "Set or view monthly budget");
        var monthOption = new Option<int>("--month", "Month (1-12)") { IsRequired = true };
        var yearOption = new Option<int?>("--year", "Year");
        var amountOption = new Option<decimal?>("--amount", "Budget amount");

        budgetCommand.AddOption(monthOption);
        budgetCommand.AddOption(yearOption);
        budgetCommand.AddOption(amountOption);

        budgetCommand.SetHandler(async (month, year, amount) =>
        {
            var activeYear = year ?? DateTime.Now.Year;

            if (amount.HasValue)
            {
                var setResult = await _budgetService.SetBudget(month, activeYear, amount.Value);
                if (!setResult.IsSuccess)
                {
                    Console.WriteLine($"Error: {setResult.Error}");
                    return;
                }
                else
                {
                    Console.WriteLine($"Budget set for {GetPeriod(month, activeYear)}: {FormatAmount(setResult.Value!.Amount)}");
                    return;
                }
            }

            var getResult = await _budgetService.GetBudget(month, activeYear);
            if (!getResult.IsSuccess)
            {
                Console.WriteLine($"Error: {getResult.Error}");
                return;
            }

            var budget = getResult.Value;
            var period = GetPeriod(month, year);

            if (budget == null)
            {
                Console.WriteLine($"No budget set for {period}");
            }
            else
            {
                Console.WriteLine($"Budget for {period}: {FormatAmount(budget.Amount)}");
            }
        }, monthOption, yearOption, amountOption);

        return budgetCommand;
    }

    private Command BuildExportCommand()
    {
        var exportCommand = new Command("export", "Export expenses to CSV");
        var pathOption = new Option<string>("--path", "Export file path") { IsRequired = true };
        var monthOption = new Option<int?>("--month", "Month (1-12)");
        var yearOption = new Option<int?>("--year", "Year");

        exportCommand.AddOption(pathOption);
        exportCommand.AddOption(monthOption);
        exportCommand.AddOption(yearOption);

        exportCommand.SetHandler(async (path, month, year) =>
    {
        var expenses = await _expenseService.List(month, year);
        if (!expenses.IsSuccess)
        {
            Console.WriteLine($"Error: {expenses.Error}");
            return;
        }

        var result = CsvExporter.Export(
            path,
            expenses.Value!,
            "Id,Name,Amount,Category,CreatedAt,UpdatedAt",
            expense => $"{expense.Id},{CsvExporter.EscapeCsvField(expense.Name)},{expense.Amount}," +
                      $"{CsvExporter.EscapeCsvField(expense.Category ?? "")},{expense.CreatedAt}," +
                      $"{expense.UpdatedAt?.ToString() ?? ""}"
        );

        if (result.IsSuccess)
        {
            var period = GetPeriod(month, year);
            Console.WriteLine($"Exported {period} expenses to {path}");
        }
        else
        {
            Console.WriteLine($"Error: {result.Error}");
        }
    }, pathOption, monthOption, yearOption);

        return exportCommand;
    }

    private static string FormatAmount(decimal amount) =>
        amount.ToString("C", CultureInfo.CurrentCulture);

    private static string GetPeriod(int? month, int? year) =>
        (month, year) switch
        {
            (null, null) => "All",
            (int m, null) => CultureInfo.CurrentCulture.DateTimeFormat.GetMonthName(m),
            (int m, int y) => $"{CultureInfo.CurrentCulture.DateTimeFormat.GetMonthName(m)} {y}",
            _ => "Unknown period"
        };
}