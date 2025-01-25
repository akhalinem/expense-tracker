using System.Text.Json;
using ExpenseTracker.Cli.Models;

namespace ExpenseTracker.Cli.Services;

public class ExpenseTrackerService
{
    private readonly List<Expense> _expenses = [];
    private readonly List<Budget> _budgets = [];
    private readonly string _expensesFilePath;
    private readonly string _budgetFilePath;

    public ExpenseTrackerService(string expensesFilePath = "expenses.json", string budgetFilePath = "budgets.json")
    {
        _expensesFilePath = expensesFilePath;
        _budgetFilePath = budgetFilePath;

        LoadExpenses();
        LoadBudgets();
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

        var budget = GetBudget(month, activeYear);

        return new Summary { Total = total, Budget = budget?.Amount };
    }

    public static string DisplayAmount(decimal amount)
    {
        return amount.ToString();
    }

    public Budget? GetBudget(int month, int? year)
    {
        var activeYear = year ?? DateTime.Now.Year;

        return _budgets.FirstOrDefault(b => b.Month == month && b.Year == activeYear);
    }

    public Budget? SetBudget(int month, int year, decimal amount)
    {
        var budget = _budgets.FirstOrDefault(b => b.Month == month && b.Year == year);

        if (budget == null)
        {
            budget = new Budget
            {
                Month = month,
                Year = year,
                Amount = amount
            };

            _budgets.Add(budget);
        }
        else
        {
            budget.Amount = amount;
        }

        SaveBudgets();

        return budget;
    }

    public void ExportToCsv(string filePath, int? month = null, int? year = null)
    {
        var expenses = _expenses.AsEnumerable();

        if (month.HasValue && year.HasValue)
        {
            expenses = expenses.Where(e => e.CreatedAt.Month == month && e.CreatedAt.Year == year).ToList();
        }
        else if (month.HasValue)
        {
            expenses = expenses.Where(e => e.CreatedAt.Month == month).ToList();
        }

        using var writer = new StreamWriter(filePath);

        writer.WriteLine("ID,Name,Amount,Category,CreatedAt,UpdatedAt");

        foreach (var expense in expenses)
        {
            writer.WriteLine($"{expense.Id},{expense.Name},{expense.Amount},{expense.Category},{expense.CreatedAt},{expense.UpdatedAt}");
        }
    }

    private void LoadExpenses()
    {
        if (!File.Exists(_expensesFilePath))
        {
            return;
        }

        try
        {
            var json = File.ReadAllText(_expensesFilePath);
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

        File.WriteAllText(_expensesFilePath, json);
    }

    private void LoadBudgets()
    {
        if (!File.Exists(_budgetFilePath))
        {
            return;
        }

        try
        {
            var json = File.ReadAllText(_budgetFilePath);
            var budgets = JsonSerializer.Deserialize<List<Budget>>(json, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            });

            if (budgets != null)
            {
                _budgets.AddRange(budgets);
            }
        }
        catch (JsonException e)
        {
            Console.WriteLine($"Error loading budgets: {e.Message}");
        }
    }

    private void SaveBudgets()
    {
        var json = JsonSerializer.Serialize(_budgets, new JsonSerializerOptions
        {
            WriteIndented = true,
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });

        File.WriteAllText(_budgetFilePath, json);
    }
}