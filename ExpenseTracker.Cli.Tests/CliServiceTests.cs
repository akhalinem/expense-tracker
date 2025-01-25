using System.CommandLine;
using Moq;
using ExpenseTracker.Cli.Interfaces;
using ExpenseTracker.Cli.Models;
using ExpenseTracker.Cli.Services;
using ExpenseTracker.Cli.Tests.Helpers;

namespace ExpenseTracker.Cli.Tests;

public class CliServiceTests
{
    private readonly Mock<IExpenseService> _expenseService;
    private readonly Mock<IBudgetService> _budgetService;
    private readonly StringWriter _consoleOutput;
    private readonly CliService _sut;

    public CliServiceTests()
    {
        _expenseService = new Mock<IExpenseService>();
        _budgetService = new Mock<IBudgetService>();
        _consoleOutput = new StringWriter();
        Console.SetOut(_consoleOutput);

        _sut = new CliService(_expenseService.Object, _budgetService.Object);
    }

    [Fact]
    public async Task AddCommand_ShouldCreateExpense()
    {
        // Arrange
        var expense = TestDataHelper.CreateExpense("Test", 100m);
        _expenseService.Setup(x => x.Add("Test", 100m, null))
            .Returns(Result<Expense>.Success(expense));

        // Act
        await _sut.BuildCommandLine().InvokeAsync("add --name Test --amount 100");

        // Assert
        _expenseService.Verify(x => x.Add("Test", 100m, null), Times.Once);
        Assert.Contains("Added expense", _consoleOutput.ToString());
    }

    [Fact]
    public async Task ListCommand_ShouldDisplayExpenses()
    {
        // Arrange
        var expenses = new[] { TestDataHelper.CreateExpense() };
        _expenseService.Setup(x => x.List(null, null, null))
            .Returns(Result<IEnumerable<Expense>>.Success(expenses));

        // Act
        await _sut.BuildCommandLine().InvokeAsync("list");

        // Assert
        _expenseService.Verify(x => x.List(null, null, null), Times.Once);
        Assert.Contains("Test Expense", _consoleOutput.ToString());
    }

    [Fact]
    public async Task SummaryCommand_WithBudget_ShouldShowWarning()
    {
        // Arrange
        var budget = TestDataHelper.CreateBudget(amount: 1000m);

        _expenseService.Setup(x => x.GetTotal(1, 2024))
            .Returns(Result<decimal>.Success(1200m));
        _budgetService.Setup(x => x.GetBudget(1, 2024))
            .Returns(Result<Budget?>.Success(budget));

        // Act
        await _sut.BuildCommandLine().InvokeAsync("summary --month 1 --year 2024");

        // Assert
        Assert.Contains("WARNING: Budget exceeded", _consoleOutput.ToString());
    }

    [Fact]
    public async Task BudgetCommand_ShouldSetAndDisplayBudget()
    {
        // Arrange
        var budget = TestDataHelper.CreateBudget();
        _budgetService.Setup(x => x.SetBudget(1, 2024, 1000m))
            .Returns(Result<Budget>.Success(budget));

        // Act
        await _sut.BuildCommandLine().InvokeAsync("budget --month 1 --year 2024 --amount 1000");

        // Assert
        _budgetService.Verify(x => x.SetBudget(1, 2024, 1000m), Times.Once);
        Assert.Contains("Budget set", _consoleOutput.ToString());
    }
}