namespace ExpenseTracker.Api.Dtos;

public class CreateExpenseDto
{
    public required string Description { get; set; }
    public required decimal Amount { get; set; }
    public Guid? CategoryId { get; set; }
    public int Month { get; set; }
    public int Year { get; set; }
}