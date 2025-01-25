using ExpenseTracker.Cli.Services;
using System.CommandLine;
using Xunit;

namespace ExpenseTracker.Cli.Tests;

public class CliServiceTests : IDisposable
{
    private readonly string _testFilePath = Path.Combine(Path.GetTempPath(), "test-expenses.json");
    private readonly ExpenseTrackerService _expenseTrackerService;
    private readonly CliService _cliService;

    public CliServiceTests()
    {
        _expenseTrackerService = new ExpenseTrackerService(_testFilePath);
        _cliService = new CliService(_expenseTrackerService);
    }

    public void Dispose()
    {
        if (File.Exists(_testFilePath))
        {
            File.Delete(_testFilePath);
        }
    }

    [Theory]
    [InlineData("add --name Coffee --amount 4 --category Beverage")]
    [InlineData("add --amount 50 --name Groceries")]
    public async Task AddCommand_WithValidArguments_ShouldAddExpense(string command)
    {
        // Arrange
        var rootCommand = _cliService.BuildCommandLine();

        // Act
        var result = await rootCommand.InvokeAsync(command.Split(' '));

        // Assert
        Assert.Equal(0, result);
    }

    [Theory]
    [InlineData("add --amount 2.50")] // Missing name
    [InlineData("add --name Coffee")] // Missing amount
    public async Task AddCommand_WithInvalidArguments_ShouldFail(string command)
    {
        // Arrange
        var rootCommand = _cliService.BuildCommandLine();

        // Act
        var result = await rootCommand.InvokeAsync(command.Split(' '));

        // Assert
        Assert.Equal(1, result); // Error exit code
    }

    [Theory]
    [InlineData("list")]
    public async Task ListCommand_ShouldListExpenses(string command)
    {
        // Arrange
        _expenseTrackerService.AddExpense("Groceries", 50);
        _expenseTrackerService.AddExpense("Coffee", 2.50m);
        var rootCommand = _cliService.BuildCommandLine();

        // Act
        var result = await rootCommand.InvokeAsync(command.Split(' '));

        // Assert
        Assert.Equal(0, result);
    }

    [Theory]
    [InlineData("update --id 1 --name Groceries --amount 50 --category Food")]
    public async Task UpdateCommand_WithValidArguments_ShouldUpdateExpense(string command)
    {
        // Arrange
        var expense = _expenseTrackerService.AddExpense("Groceries", 2.50m, "Food");
        var rootCommand = _cliService.BuildCommandLine();
        var args = command.Split(' ');
        args[2] = expense.Id.ToString();

        // Act
        var result = await rootCommand.InvokeAsync(args);

        // Assert
        Assert.Equal(0, result);
    }

    [Theory]
    [InlineData("delete --id 1")]
    public async Task DeleteCommand_WithValidArguments_ShouldDeleteExpense(string command)
    {
        // Arrange
        var expense = _expenseTrackerService.AddExpense("Groceries", 2.50m);
        var rootCommand = _cliService.BuildCommandLine();
        var args = command.Split(' ');
        args[2] = expense.Id.ToString();

        // Act
        var result = await rootCommand.InvokeAsync(args);

        // Assert
        Assert.Equal(0, result);
    }

    [Theory]
    [InlineData("delete --id 2")] // Invalid ID
    public async Task DeleteCommand_WithInvalidId_ShouldFail(string command)
    {
        // Arrange
        _expenseTrackerService.AddExpense("Groceries", 2.50m);
        var rootCommand = _cliService.BuildCommandLine();

        // Act
        var result = await rootCommand.InvokeAsync(command.Split(' '));

        // Assert
        Assert.Equal(1, result); // Error exit code
    }

    [Theory]
    [InlineData("summary")]
    public async Task SummaryCommand_ShouldDisplaySummary(string command)
    {
        // Arrange
        _expenseTrackerService.AddExpense("Groceries", 50);
        _expenseTrackerService.AddExpense("Coffee", 2.50m);
        var rootCommand = _cliService.BuildCommandLine();

        // Act
        var result = await rootCommand.InvokeAsync(command.Split(' '));

        // Assert
        Assert.Equal(0, result);
    }

    [Theory]
    [InlineData("invalid-command")]
    public async Task InvalidCommand_ShouldFail(string command)
    {
        // Arrange
        var rootCommand = _cliService.BuildCommandLine();

        // Act
        var result = await rootCommand.InvokeAsync(command.Split(' '));

        // Assert
        Assert.Equal(1, result); // Error exit code
    }
}