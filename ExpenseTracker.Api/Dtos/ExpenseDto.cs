using ExpenseTracker.Core.Models;

namespace ExpenseTracker.Api.Dtos;

public class ExpenseDto
{
    public Guid Id { get; set; }
    public string Description { get; set; }
    public decimal Amount { get; set; }
    public CategoryDto? Category { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    public ExpenseDto(Expense expense)
    {
        Id = expense.Id;
        Description = expense.Name;
        Amount = expense.Amount;
        Category = expense.Category != null
            ? new CategoryDto(expense.Category)
            : null;
        CreatedAt = expense.CreatedAt;
        UpdatedAt = expense.UpdatedAt;
    }
}