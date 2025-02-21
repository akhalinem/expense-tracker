using ExpenseTracker.Core.Models;

namespace ExpenseTracker.Core.Tests.Models;

public class SummaryTests
{
    [Fact]
    public void IsOverBudget_WhenTotalExceedsBudget_ShouldReturnTrue()
    {
        // Arrange
        var summary = new Summary(1000m, 500m);

        // Assert
        Assert.True(summary.IsOverBudget);
    }

    [Fact]
    public void IsOverBudget_WhenTotalUnderBudget_ShouldReturnFalse()
    {
        // Arrange
        var summary = new Summary(500m, 1000m);

        // Assert
        Assert.False(summary.IsOverBudget);
    }

    [Fact]
    public void Remaining_ShouldCalculateCorrectly()
    {
        // Arrange
        var summary = new Summary(600m, 1000m);

        // Assert
        Assert.Equal(400m, summary.Remaining);
    }

    [Fact]
    public void Remaining_WithNoBudget_ShouldReturnNull()
    {
        // Arrange
        var summary = new Summary(600m);

        // Assert
        Assert.Null(summary.Remaining);
    }
}
