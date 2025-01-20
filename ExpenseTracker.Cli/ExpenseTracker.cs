namespace ExpenseTracker.Cli;

class ExpenseTracker
{
    private readonly List<Expense> _expenses = [];

    public Expense AddExpense(string name, decimal amount)
    {
        var expense = new Expense
        {
            Name = name,
            Amount = amount
        };

        _expenses.Add(expense);

        return expense;
    }

    public List<Expense> ListExpenses()
    {
        return _expenses;
    }

    public void UpdateExpense()
    {
        Console.WriteLine("Update expense");
    }

    public void DeleteExpense()
    {
        Console.WriteLine("Delete expense");
    }

    public void ShowSummary()
    {
        Console.WriteLine("Show summary");
    }
}