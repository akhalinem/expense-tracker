namespace ExpenseTracker.Api.Dtos;

public class UpdateExpenseDto
{
    public string? Description { get; set; }
    public decimal? Amount { get; set; }
    public string? Category { get; set; }
}