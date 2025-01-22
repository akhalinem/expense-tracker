using System.Text.Json;

namespace ExpenseTracker.Cli;

public class ExpenseTrackerService
{
    private readonly List<Expense> _expenses = [];
    private readonly string _filePath;

    public ExpenseTrackerService(string filePath = "expenses.json")
    {
        _filePath = filePath;

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

    public bool DeleteExpense(Guid id)
    {
        var expense = _expenses.FirstOrDefault(e => e.Id == id);

        if (expense == null)
        {
            return false;
        }

        _expenses.Remove(expense);

        return true;
    }

    public Summary GetSummary()
    {
        var total = _expenses.Sum(e => e.Amount);

        return new Summary { Total = total };
    }

    public Summary GetSummary(int month)
    {
        var total = _expenses
            .Where(e => e.CreatedAt.Month == month)
            .Sum(e => e.Amount);

        return new Summary { Total = total };
    }

    public string DisplayAmount(decimal amount)
    {
        return amount.ToString("#,##0.00");
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