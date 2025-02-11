using ExpenseTracker.Core.Models;

namespace ExpenseTracker.Api.Dtos;

public class ListExpenseDto
{
    public Guid Id { get; set; }
    public string Description { get; set; }
    public decimal Amount { get; set; }
    public string? Category { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    public ListExpenseDto(Expense expense)
    {
        Id = expense.Id;
        Description = expense.Name;
        Amount = expense.Amount;
        Category = expense.Category;
        CreatedAt = expense.CreatedAt;
        UpdatedAt = expense.UpdatedAt;
    }
}