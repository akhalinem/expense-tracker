using System.Text.Json;

namespace ExpenseTracker.Cli;

class ExpenseTracker
{
    private readonly List<Expense> _expenses = [];
    private readonly string _filePath = "expenses.json";

    public ExpenseTracker()
    {
        LoadExpenses();
    }

    public Expense AddExpense(string name, decimal amount)
    {
        var expense = new Expense
        {
            Name = name,
            Amount = amount
        };

        _expenses.Add(expense);
        SaveExpenses();

        return expense;
    }

    public List<Expense> ListExpenses()
    {
        return _expenses;
    }

    public Expense? UpdateExpense(Guid id, string name, decimal amount)
    {
        var expense = _expenses.FirstOrDefault(e => e.Id == id);

        if (expense == null)
        {
            return null;
        }

        expense.Name = name;
        expense.Amount = amount;
        expense.UpdatedAt = DateTime.Now;

        SaveExpenses();

        return expense;
    }

    public void DeleteExpense()
    {
        Console.WriteLine("Delete expense");
    }

    public void ShowSummary()
    {
        Console.WriteLine("Show summary");
    }

    private void LoadExpenses()
    {
        if (!File.Exists(_filePath))
        {
            return;
        }

        try
        {
            var json = File.ReadAllText(_filePath);
            var expenses = JsonSerializer.Deserialize<List<Expense>>(json, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            });

            if (expenses != null)
            {
                _expenses.AddRange(expenses);
            }
        }
        catch (JsonException e)
        {
            Console.WriteLine($"Error loading expenses: {e.Message}");
        }
    }

    private void SaveExpenses()
    {
        var json = JsonSerializer.Serialize(_expenses, new JsonSerializerOptions
        {
            WriteIndented = true,
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });

        File.WriteAllText(_filePath, json);
    }
}