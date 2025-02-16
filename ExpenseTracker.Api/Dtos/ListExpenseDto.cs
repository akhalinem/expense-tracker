using ExpenseTracker.Core.Models;

namespace ExpenseTracker.Api.Dtos;

public class ListExpenseDto
{
    public Guid Id { get; set; }
    public string Description { get; set; }
    public decimal Amount { get; set; }
    public Category? Category { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    public ListExpenseDto(Expense expense)
    {
        Id = expense.Id;
        Description = expense.Name;
        Amount = expense.Amount;
        Category = expense.Category != null
            ? new Category
            {
                Id = expense.Category.Id,
                Name = expense.Category.Name
            }
            : null;
        CreatedAt = expense.CreatedAt;
        UpdatedAt = expense.UpdatedAt;
    }
}