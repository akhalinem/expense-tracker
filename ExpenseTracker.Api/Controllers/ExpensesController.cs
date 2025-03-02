using Microsoft.AspNetCore.Mvc;
using ExpenseTracker.Core.Interfaces;
using ExpenseTracker.Core.Models;
using ExpenseTracker.Api.Dtos;

namespace ExpenseTracker.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ExpensesController : ControllerBase
{
    private readonly IExpenseService _expenseService;

    public ExpensesController(IExpenseService expenseService)
    {
        _expenseService = expenseService;
    }

    [HttpGet]
    public async Task<IActionResult> GetExpenses([FromQuery] int? month, [FromQuery] int? year, [FromQuery] string? categoryIds)
    {
        List<Guid>? parsedCategoryIds = categoryIds?
            .Split(',', StringSplitOptions.RemoveEmptyEntries)
            .Select(Guid.Parse)
            .ToList();
        var result = await _expenseService.List(month ?? DateTime.Now.Month, year ?? DateTime.Now.Year, parsedCategoryIds);

        return result.IsSuccess
            ? Ok(
                result.Value
                    ?.Select(x => new ExpenseDto(x))
                    .OrderByDescending(x => x.CreatedAt)
                    .ToList()
            )
            : BadRequest(result.Error);
    }

    [HttpPost]
    public async Task<IActionResult> AddExpense(CreateExpenseDto dto)
    {
        // TODO: use dto.month and dto.year to set the expense date
        var result = await _expenseService.Add(dto.Description, dto.Amount, dto.CategoryId);
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteExpense(Guid id)
    {
        var result = await _expenseService.Delete(id);
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateExpense(Guid id, UpdateExpenseDto dto)
    {
        // TODO: use dto.month and dto.year to set the expense date
        var result = await _expenseService.Update(id, dto.Description, dto.Amount, dto.CategoryId);
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }
}