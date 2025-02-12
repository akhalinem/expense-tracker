using ExpenseTracker.Core.Models;

namespace ExpenseTracker.Api.Dtos;

public class ListCategoryDto
{
    public Guid Id { get; set; }
    public string Name { get; set; }

    public ListCategoryDto(Category category)
    {
        Id = category.Id;
        Name = category.Name;
    }
}