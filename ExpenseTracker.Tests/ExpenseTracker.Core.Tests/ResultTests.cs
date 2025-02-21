using ExpenseTracker.Core.Models;

namespace ExpenseTracker.Core.Tests.Models;

public class ResultTests
{
    [Fact]
    public void Success_ShouldCreateSuccessResult()
    {
        // Act
        var result = Result<int>.Success(42);

        // Assert
        Assert.True(result.IsSuccess);
        Assert.Equal(42, result.Value);
        Assert.Null(result.Error);
    }

    [Fact]
    public void Failure_ShouldCreateFailureResult()
    {
        // Act
        var result = Result<int>.Failure("Error message");

        // Assert
        Assert.False(result.IsSuccess);
        Assert.Equal(default(int), result.Value);
        Assert.Equal("Error message", result.Error);
    }
}
