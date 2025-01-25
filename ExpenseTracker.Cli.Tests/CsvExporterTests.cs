using ExpenseTracker.Cli.Helpers;
using ExpenseTracker.Cli.Models;
using ExpenseTracker.Cli.Tests.Helpers;

namespace ExpenseTracker.Cli.Tests;

public class CsvExporterTests
{
    [Fact]
    public void Export_ShouldCreateValidCsvFile()
    {
        // Arrange
        var testFilePath = Path.Combine(Path.GetTempPath(), $"test-{Guid.NewGuid()}.csv");
        var expenses = new[]
        {
            TestDataHelper.CreateExpense("Test1", 100m),
            TestDataHelper.CreateExpense("Test2", 200m)
        };

        // Act
        var result = CsvExporter.Export(
            testFilePath,
            expenses,
            "Name,Amount",
            e => $"{e.Name},{e.Amount}"
        );

        // Assert
        Assert.True(result.IsSuccess);
        Assert.True(File.Exists(testFilePath));
        var lines = File.ReadAllLines(testFilePath);
        Assert.Equal(3, lines.Length);
        Assert.Equal("Name,Amount", lines[0]);

        File.Delete(testFilePath);
    }

    [Fact]
    public void Export_WithInvalidPath_ShouldReturnError()
    {
        // Arrange
        var invalidPath = "/invalid/path/file.csv";

        // Act
        var result = CsvExporter.Export(
            invalidPath,
            Array.Empty<Expense>(),
            "Header",
            _ => ""
        );

        // Assert
        Assert.False(result.IsSuccess);
        Assert.NotNull(result.Error);
    }
}