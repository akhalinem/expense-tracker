using Microsoft.AspNetCore.Mvc;
using ExpenseTracker.Core.Interfaces;
using ExpenseTracker.Api.Dtos;

namespace ExpenseTracker.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CategoriesController : ControllerBase
{
    private readonly ICategoryRepository _categoryRepository;

    public CategoriesController(ICategoryRepository categoryRepository)
    {
        _categoryRepository = categoryRepository;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var result = await _categoryRepository.GetAllAsync();

        return result.IsSuccess
            ? Ok(result.Value
                ?.Select(x => new ListCategoryDto(x))
                .ToList()
            )
            : BadRequest(result.Error);
    }
}