namespace ExpenseTracker.Cli;

class Program
{
    private static readonly ExpenseTracker _expenseTracker = new();

    static void Main(string[] args)
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
            RunCommand(commandArgs);
        }
    }

    private static void RunCommand(string[] args)
    {
        if (args.Length == 0)
        {
            Console.WriteLine("Please provide a command");
            return;
        }

        var command = args[0].ToLower();

        switch (command)
        {
            case "add" when args.Length == 3:
                {
                    var name = args[1];

                    if (!decimal.TryParse(args[2], out decimal amount))
                    {
                        Console.WriteLine("Invalid amount");
                        return;
                    }

                    var expense = _expenseTracker.AddExpense(name, amount);

                    if (expense != null)
                    {
                        Console.WriteLine($"Added expense: {expense.Name} - {expense.Amount}");
                    }

                    break;
                }

            case "list":
                {
                    var expenses = _expenseTracker.ListExpenses();

                    var format = "{0,-50} {1,-15} {2,10} {3,12}";
                    Console.WriteLine(format, "ID", "Name", "Amount", "Created On", "Updated On");
                    Console.WriteLine(new string('-', 100));

                    foreach (var expense in expenses)
                    {
                        Console.WriteLine(format,
                            expense.Id.ToString(),
                            expense.Name,
                            expense.Amount.ToString(),
                            expense.CreatedOn.ToString("MM/dd/yyyy"),
                            expense.UpdatedOn?.ToString("MM/dd/yyyy") ?? string.Empty
                        );
                    }

                    break;
                }

            case "update":
                {
                    _expenseTracker.UpdateExpense();
                    break;
                }

            case "delete":
                {
                    _expenseTracker.DeleteExpense();
                    break;
                }

            case "summary":
                {
                    _expenseTracker.ShowSummary();
                    break;
                }

            default:
                {
                    Console.WriteLine("Invalid command");
                    break;
                }
        }
    }
}