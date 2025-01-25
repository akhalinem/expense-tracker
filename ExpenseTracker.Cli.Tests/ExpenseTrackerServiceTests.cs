using System.Text.Json;
using ExpenseTracker.Cli.Models;
using ExpenseTracker.Cli.Services;

namespace ExpenseTracker.Cli.Tests;

public class ExpenseTrackerServiceTests : IDisposable
{
    private readonly string _testExpensesFilePath = Path.Combine(Path.GetTempPath(), "test-expenses.json");
    private readonly string _testBudgetFilePath = Path.Combine(Path.GetTempPath(), "test-budgets.json");
    private readonly ExpenseTrackerService _expenseTrackerService;

    public ExpenseTrackerServiceTests()
    {
        _expenseTrackerService = new ExpenseTrackerService(_testExpensesFilePath, _testBudgetFilePath);
    }

    public void Dispose()
    {
        if (File.Exists(_testExpensesFilePath))
        {
            File.Delete(_testExpensesFilePath);
        }
    }

    [Fact]
    public void ShouldLoadExpensesFromFile()
    {
        // Arrange
        var expense = new Expense { Name = "Coffee", Amount = 2.5m, Category = "Beverage" };
        var expenses = new List<Expense> { expense };
        File.WriteAllText(_testExpensesFilePath, JsonSerializer.Serialize(expenses, new JsonSerializerOptions
        {
            WriteIndented = true,
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        }));
        var expenseTrackerService = new ExpenseTrackerService(_testExpensesFilePath);

        // Act
        var loadedExpenses = expenseTrackerService.ListExpenses();

        // Assert
        Assert.Single(loadedExpenses);
        Assert.Equal(expense.Name, loadedExpenses.First().Name);
        Assert.Equal(expense.Amount, loadedExpenses.First().Amount);
        Assert.Equal(expense.Category, loadedExpenses.First().Category);
    }

    [Fact]
    public void ShouldLoadBudgetsFromFile()
    {
        // Arrange
        var budgets = new List<Budget> {
            new() { Month = 1, Year = 2022, Amount = 100m },
        };
        File.WriteAllText(_testBudgetFilePath, JsonSerializer.Serialize(budgets, new JsonSerializerOptions
        {
            WriteIndented = true,
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        }));
        var expenseTrackerService = new ExpenseTrackerService(_testExpensesFilePath, _testBudgetFilePath);

        // Act
        var budget = expenseTrackerService.GetBudget(1, 2022);

        // Assert
        Assert.NotNull(budget);
        Assert.Equal(1, budget.Month);
        Assert.Equal(2022, budget.Year);
        Assert.Equal(100m, budget.Amount);
    }

    [Fact]
    public void ShouldSaveExpensesToFile()
    {
        // Arrange
        var expense = new Expense { Name = "Coffee", Amount = 2.5m, Category = "Beverage" };

        // Act
        _expenseTrackerService.AddExpense(expense.Name, expense.Amount, expense.Category);

        // Assert
        var savedExpenses = JsonSerializer.Deserialize<List<Expense>>(File.ReadAllText(_testExpensesFilePath), new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        });
        Assert.Single(savedExpenses);
        Assert.Equal(expense.Name, savedExpenses.First().Name);
        Assert.Equal(expense.Amount, savedExpenses.First().Amount);
        Assert.Equal(expense.Category, savedExpenses.First().Category);
    }

    [Fact]
    public void ShouldSaveBudgetsToFile()
    {
        // Arrange
        var budget = new Budget { Month = 1, Year = 2022, Amount = 100m };

        // Act
        _expenseTrackerService.SetBudget(budget.Month, budget.Year, budget.Amount.Value);

        // Assert
        var savedBudgets = JsonSerializer.Deserialize<List<Budget>>(File.ReadAllText(_testBudgetFilePath), new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        });
        Assert.NotNull(savedBudgets);
        Assert.Single(savedBudgets);
        Assert.Equal(budget.Month, savedBudgets.First().Month);
        Assert.Equal(budget.Year, savedBudgets.First().Year);
        Assert.Equal(budget.Amount, savedBudgets.First().Amount);
    }

    [Fact]
    public void ShouldAddExpense()
    {
        // Act
        _expenseTrackerService.AddExpense("Coffee", 2.5m, "Beverage");

        // Assert
        Assert.Single(_expenseTrackerService.ListExpenses());
        Assert.Equal("Coffee", _expenseTrackerService.ListExpenses().First().Name);
        Assert.Equal(2.5m, _expenseTrackerService.ListExpenses().First().Amount);
        Assert.Equal("Beverage", _expenseTrackerService.ListExpenses().First().Category);
    }

    [Fact]
    public void ShouldUpdateExpense()
    {
        // Arrange
        var expense = _expenseTrackerService.AddExpense("Coffee", 2.5m);

        // Act
        _expenseTrackerService.UpdateExpense(expense.Id, "Tea", 1.5m, "Beverage");

        // Assert
        Assert.Single(_expenseTrackerService.ListExpenses());
        Assert.Equal("Tea", _expenseTrackerService.ListExpenses().First().Name);
        Assert.Equal(1.5m, _expenseTrackerService.ListExpenses().First().Amount);
        Assert.Equal("Beverage", _expenseTrackerService.ListExpenses().First().Category);
    }

    [Fact]
    public void ShouldNotUpdateExpenseIfNotFound()
    {
        // Act
        var result = _expenseTrackerService.UpdateExpense(Guid.NewGuid(), "Tea", 1.5m);

        // Assert
        Assert.Null(result);
    }

    [Fact]
    public void ShouldListExpenses()
    {
        // Act
        var expenses = _expenseTrackerService.ListExpenses();

        // Assert
        Assert.Empty(expenses);
    }

    [Fact]
    public void ShouldListExpensesByCategory()
    {
        // Arrange
        _expenseTrackerService.AddExpense("Coffee", 2.5m, "Beverage");
        _expenseTrackerService.AddExpense("Tea", 1.5m, "Beverage");
        _expenseTrackerService.AddExpense("Lunch", 10m, "Food");

        // Act
        var beverages = _expenseTrackerService.ListExpenses("Beverage");
        var foods = _expenseTrackerService.ListExpenses("Food");

        // Assert
        Assert.Equal(2, beverages.Count);
        Assert.Single(foods);
    }

    [Fact]
    public void ShouldDeleteExpense()
    {
        // Arrange
        var expense = _expenseTrackerService.AddExpense("Coffee", 2.5m);

        // Act
        _expenseTrackerService.DeleteExpense(expense.Id);

        // Assert
        Assert.Empty(_expenseTrackerService.ListExpenses());
    }

    [Fact]
    public void ShouldNotDeleteExpenseIfNotFound()
    {
        // Act
        var result = _expenseTrackerService.DeleteExpense(Guid.NewGuid());

        // Assert
        Assert.False(result);
    }

    [Fact]
    public void ShouldGetOverallSummary()
    {
        // Arrange
        _expenseTrackerService.AddExpense("Coffee", 2.5m);
        _expenseTrackerService.AddExpense("Tea", 1.5m);

        // Act
        var summary = _expenseTrackerService.GetSummary();

        // Assert
        Assert.Equal(4m, summary.Total);
    }

    [Fact]
    public void ShouldGetSummaryByMonth()
    {
        // Arrange
        _expenseTrackerService.AddExpense("Coffee", 2.5m);
        _expenseTrackerService.AddExpense("Tea", 1.5m);

        // Act
        var summary = _expenseTrackerService.GetSummary(DateTime.Now.Month);

        // Assert
        Assert.Equal(4m, summary.Total);
        Assert.Equal(0, DateTime.Now.Month - 1);
    }

    [Fact]
    public void ShouldGetSummaryByMonthAndYear()
    {
        // Arrange
        var expense1 = new Expense { Name = "Coffee", Amount = 1.5m, CreatedAt = new DateTime(DateTime.Now.Year, 1, 1) };
        var expense2 = new Expense { Name = "Tea", Amount = 2.5m, CreatedAt = new DateTime(DateTime.Now.Year, 1, 2) };
        var expense3 = new Expense { Name = "Juice", Amount = 3.5m, CreatedAt = new DateTime(DateTime.Now.Year + 1, 1, 1) };
        var expenses = new List<Expense> { expense1, expense2, expense3 };
        File.WriteAllText(_testExpensesFilePath, JsonSerializer.Serialize(expenses, new JsonSerializerOptions
        {
            WriteIndented = true,
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        }));
        var expenseTrackerService = new ExpenseTrackerService(_testExpensesFilePath);

        // Act
        var currentJanSummary = expenseTrackerService.GetSummary(1, DateTime.Now.Year);
        var nextJanSummary = expenseTrackerService.GetSummary(1, DateTime.Now.Year + 1);

        // Assert
        Assert.Equal(1.5m + 2.5m, currentJanSummary.Total);
        Assert.Equal(3.5m, nextJanSummary.Total);
    }

    [Fact]
    public void ShouldSummaryDisplayBudget()
    {
        // Arrange
        _expenseTrackerService.SetBudget(DateTime.Now.Month, DateTime.Now.Year, 100m);

        // Act
        var summary = _expenseTrackerService.GetSummary(DateTime.Now.Month, DateTime.Now.Year);

        // Assert
        Assert.Equal(100m, summary.Budget);
    }

    [Fact]
    public void ShouldUpdateExistingBudget()
    {
        // Arrange
        var initialBudget = _expenseTrackerService.SetBudget(1, 2024, 1000m);

        // Act
        var updatedBudget = _expenseTrackerService.SetBudget(1, 2024, 1500m);

        // Assert
        Assert.NotNull(updatedBudget);
        Assert.Equal(1500m, updatedBudget.Amount);
        Assert.Equal(initialBudget.Month, updatedBudget.Month);
        Assert.Equal(initialBudget.Year, updatedBudget.Year);
    }

    [Fact]
    public void ShouldDetectBudgetOverspending()
    {
        // Arrange
        _expenseTrackerService.SetBudget(DateTime.Now.Month, DateTime.Now.Year, 100m);
        _expenseTrackerService.AddExpense("Coffee", 150m);

        // Act
        var summary = _expenseTrackerService.GetSummary(DateTime.Now.Month, DateTime.Now.Year);

        // Assert
        Assert.NotNull(summary.Budget);
        Assert.True(summary.IsOverBudget);
    }

    [Fact]
    public void ShouldNotReportOverspendingWhenUnderBudget()
    {
        // Arrange
        _expenseTrackerService.SetBudget(DateTime.Now.Month, DateTime.Now.Year, 100m);
        _expenseTrackerService.AddExpense("Coffee", 50m);

        // Act
        var summary = _expenseTrackerService.GetSummary(DateTime.Now.Month, DateTime.Now.Year);

        // Assert
        Assert.NotNull(summary);
        Assert.False(summary.IsOverBudget);
    }
}
