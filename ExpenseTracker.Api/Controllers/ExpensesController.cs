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
    public IActionResult GetExpenses([FromQuery] int? month, [FromQuery] int? year, [FromQuery] string? category)
    {
        var result = _expenseService.List(month, year, category);

        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }

    [HttpPost]
    public IActionResult AddExpense(CreateExpenseDto dto)
    {
        Expense expense = new()
        {
            Name = dto.Description,
            Amount = dto.Amount,
            Category = dto.Category
        };

        var result = _expenseService.Add(expense.Name, expense.Amount, expense.Category);
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }

    [HttpDelete("{id:guid}")]
    public IActionResult DeleteExpense(Guid id)
    {
        var result = _expenseService.Delete(id);
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }

    [HttpPut("{id:guid}")]
    public IActionResult UpdateExpense(Guid id, UpdateExpenseDto dto)
    {
        var result = _expenseService.Update(id, dto.Description, dto.Amount, dto.Category);
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }
}