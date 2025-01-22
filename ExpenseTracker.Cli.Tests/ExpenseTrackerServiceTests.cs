using System.Text.Json;

namespace ExpenseTracker.Cli.Tests;

public class ExpenseTrackerServiceTests : IDisposable
{
    private readonly string _testFilePath = Path.Combine(Path.GetTempPath(), "test-expenses.json");
    private readonly ExpenseTrackerService _expenseTrackerService;

    public ExpenseTrackerServiceTests()
    {
        _expenseTrackerService = new ExpenseTrackerService(_testFilePath);
    }

    public void Dispose()
    {
        if (File.Exists(_testFilePath))
        {
            File.Delete(_testFilePath);
        }
    }

    [Fact]
    public void ShouldLoadExpensesFromFile()
    {
        // Arrange
        var expense = new Expense { Name = "Coffee", Amount = 2.5m, };
        var expenses = new List<Expense> { expense };
        File.WriteAllText(_testFilePath, JsonSerializer.Serialize(expenses, new JsonSerializerOptions
        {
            WriteIndented = true,
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        }));
        var expenseTrackerService = new ExpenseTrackerService(_testFilePath);

        // Act
        var loadedExpenses = expenseTrackerService.ListExpenses();

        // Assert
        Assert.Single(loadedExpenses);
        Assert.Equal(expense.Name, loadedExpenses.First().Name);
        Assert.Equal(expense.Amount, loadedExpenses.First().Amount);
    }

    [Fact]
    public void ShouldAddExpense()
    {
        // Act
        _expenseTrackerService.AddExpense("Coffee", 2.5m);

        // Assert
        Assert.Single(_expenseTrackerService.ListExpenses());
        Assert.Equal("Coffee", _expenseTrackerService.ListExpenses().First().Name);
        Assert.Equal(2.5m, _expenseTrackerService.ListExpenses().First().Amount);
    }

    [Fact]
    public void ShouldUpdateExpense()
    {
        // Arrange
        var expense = _expenseTrackerService.AddExpense("Coffee", 2.5m);

        // Act
        _expenseTrackerService.UpdateExpense(expense.Id, "Tea", 1.5m);

        // Assert
        Assert.Single(_expenseTrackerService.ListExpenses());
        Assert.Equal("Tea", _expenseTrackerService.ListExpenses().First().Name);
        Assert.Equal(1.5m, _expenseTrackerService.ListExpenses().First().Amount);
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
    public void ShouldGetSummary()
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
}
