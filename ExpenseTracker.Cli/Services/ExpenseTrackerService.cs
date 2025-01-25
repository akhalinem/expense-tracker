using System.Text.Json;
using ExpenseTracker.Cli.Models;

namespace ExpenseTracker.Cli.Services;

public class ExpenseTrackerService
{
    private readonly List<Expense> _expenses = [];
    private readonly string _filePath;

    public ExpenseTrackerService(string filePath = "expenses.json")
    {
        _filePath = filePath;

        LoadExpenses();
    }

    public Expense AddExpense(string name, decimal amount, string? category = null)
    {
        var expense = new Expense
        {
            Name = name,
            Amount = amount,
            Category = category,
        };

        _expenses.Add(expense);
        SaveExpenses();

        return expense;
    }

    public List<Expense> ListExpenses(string? category = null)
    {
        return string.IsNullOrEmpty(category)
            ? _expenses
            : _expenses.Where(e => e.Category == category).ToList();
    }

    public Expense? UpdateExpense(Guid id, string? name, decimal? amount, string? category = null)
    {
        var expense = _expenses.FirstOrDefault(e => e.Id == id);

        if (expense == null)
        {
            return null;
        }

        expense.Name = name ?? expense.Name;
        expense.Amount = amount ?? expense.Amount;
        expense.Category = category ?? expense.Category;
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
        SaveExpenses();

        return true;
    }

    public Summary GetSummary()
    {
        var total = _expenses.Sum(e => e.Amount);

        return new Summary { Total = total };
    }

    public Summary GetSummary(int month, int? year = null)
    {
        var activeYear = year ?? DateTime.Now.Year;

        var total = _expenses
            .Where(e => e.CreatedAt.Month == month && e.CreatedAt.Year == activeYear)
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