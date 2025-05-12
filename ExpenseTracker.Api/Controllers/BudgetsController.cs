using Microsoft.AspNetCore.Mvc;
using ExpenseTracker.Core.Interfaces;

namespace ExpenseTracker.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BudgetsController : ControllerBase
{
    private readonly IBudgetRepository _budgetRepository;

    public BudgetsController(IBudgetRepository budgetRepository)
    {
        _budgetRepository = budgetRepository;
    }

    [HttpGet]
    public async Task<IActionResult> GetBudgets()
    {
        var result = await _budgetRepository.ListAsync();

        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }

    [HttpGet]
    [Route("current")]
    public async Task<IActionResult> GetCurrentBudget()
    {
        var result = await _budgetRepository.GetAsync(DateTime.Now.Month, DateTime.Now.Year);

        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }

    [HttpGet]
    [Route("monthly")]
    public async Task<IActionResult> GetCurrentBudget([FromQuery] int month, [FromQuery] int year)
    {
        var result = await _budgetRepository.GetAsync(month, year);

        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }

    [HttpGet]
    [Route("history")]
    public async Task<IActionResult> GetBudgetHistory()
    {
        var result = await _budgetRepository.GetHistoryAsync();

        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }
}
