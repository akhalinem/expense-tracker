using System.CommandLine;
using System.Globalization;

namespace ExpenseTracker.Cli;

class Program
{
    private static readonly ExpenseTrackerService _expenseTrackerService = new();

    static async Task Main(string[] args)
    {
        while (true)
        {
            Console.Write("> ");
            var input = Console.ReadLine();

            if (string.IsNullOrWhiteSpace(input))
                continue;

            if (input.ToLower() == "exit")
                break;

            var commandArgs = input.Split(' ', StringSplitOptions.RemoveEmptyEntries);

            await RunCommand(commandArgs);
        }
    }

    private static async Task<int> RunCommand(string[] args)
    {
        var rootCommand = new RootCommand("Expense Tracker CLI");

        #region add
        var addCommand = new Command("add", "Add a new expense");
        var addNameOption = new Option<string>("--name", "Name of the expense") { IsRequired = true };
        var addAmountOption = new Option<decimal>("--amount", "Amount of the expense") { IsRequired = true };
        addCommand.AddOption(addNameOption);
        addCommand.AddOption(addAmountOption);
        addCommand.SetHandler((name, amount) =>
        {
            var expense = _expenseTrackerService.AddExpense(name, amount);
            if (expense != null)
            {
                Console.WriteLine($"Added expense: {expense.Name} - {_expenseTrackerService.DisplayAmount(expense.Amount)}");
            }
        }, addNameOption, addAmountOption);
        #endregion

        #region list
        var listCommand = new Command("list", "List all expenses");
        listCommand.SetHandler(() =>
        {
            var expenses = _expenseTrackerService.ListExpenses();
            var format = "{0,-40} {1,-15} {2,10} {3,25} {4,25}";
            Console.WriteLine(format, "ID", "Name", "Amount", "Created At", "Updated At");
            Console.WriteLine(new string('-', 120));

            foreach (var expense in expenses)
            {
                Console.WriteLine(format,
                    expense.Id.ToString(),
                    expense.Name,
                    _expenseTrackerService.DisplayAmount(expense.Amount),
                    expense.CreatedAt.ToString("MM/dd/yyyy hh:mm:ss tt"),
                    expense.UpdatedAt?.ToString("MM/dd/yyyy hh:mm:ss tt") ?? string.Empty
                );
            }
        });
        #endregion

        #region update
        var updateCommand = new Command("update", "Update an expense");
        var updateIdOption = new Option<Guid>("--id", "ID of the expense") { IsRequired = true };
        var updateNameOption = new Option<string>("--name", "New name of the expense") { IsRequired = false };
        var updateAmountOption = new Option<decimal>("--amount", "New amount of the expense") { IsRequired = false };
        updateCommand.AddOption(updateIdOption);
        updateCommand.AddOption(updateNameOption);
        updateCommand.AddOption(updateAmountOption);
        updateCommand.SetHandler((id, name, amount) =>
        {
            var expense = _expenseTrackerService.UpdateExpense(id, name, amount);
            if (expense == null)
            {
                Console.WriteLine("Expense not found");
            }
            else
            {
                Console.WriteLine($"Updated expense: {expense.Name} - {_expenseTrackerService.DisplayAmount(expense.Amount)}");
            }
        }, updateIdOption, updateNameOption, updateAmountOption);
        #endregion

        #region delete
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
        #endregion

        #region summary
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

            var period = (month, year) switch
            {
                (null, null) => "Total",
                (int m, null) => CultureInfo.CurrentCulture.DateTimeFormat.GetMonthName(m),
                (int m, int y) => $"{CultureInfo.CurrentCulture.DateTimeFormat.GetMonthName(m)} {y}",
                _ => "Invalid period"
            };

            Console.WriteLine($"Total expenses for {period}: {_expenseTrackerService.DisplayAmount(summary.Total)}");
        }, monthOption, yearOption);

        rootCommand.AddCommand(addCommand);
        rootCommand.AddCommand(listCommand);
        rootCommand.AddCommand(updateCommand);
        rootCommand.AddCommand(deleteCommand);
        rootCommand.AddCommand(summaryCommand);
        #endregion

        return await rootCommand.InvokeAsync(args);
    }
}