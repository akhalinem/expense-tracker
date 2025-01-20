namespace ExpenseTracker.Cli;

class Program
{
    private static readonly ExpenseTracker _expenseTracker = new();

    static void Main(string[] args)
    {
        if (args.Length == 0)
        {
            Console.WriteLine("Please provide a command");
            return;
        }

        var command = args[0];

        switch (command)
        {
            case "add":
                _expenseTracker.AddExpense();
                break;

            case "list":
                _expenseTracker.ListExpenses();
                break;

            case "update":
                _expenseTracker.UpdateExpense();
                break;

            case "delete":
                _expenseTracker.DeleteExpense();
                break;

            case "summary":
                _expenseTracker.ShowSummary();
                break;

            default:
                Console.WriteLine("Invalid command");
                break;
        }
    }
}