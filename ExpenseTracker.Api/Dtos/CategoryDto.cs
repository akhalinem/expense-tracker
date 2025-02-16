using ExpenseTracker.Core.Models;

namespace ExpenseTracker.Api.Dtos;

public class CategoryDto
{
    public Guid Id { get; set; }
    public string Name { get; set; }

    public CategoryDto(Category category)
    {
        Id = category.Id;
        Name = category.Name;
    }
}