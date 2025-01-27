namespace ExpenseTracker.Api.Dtos;

public class CreateExpenseDto
{
    public required string Description { get; set; }
    public required decimal Amount { get; set; }
    public string? Category { get; set; }
}