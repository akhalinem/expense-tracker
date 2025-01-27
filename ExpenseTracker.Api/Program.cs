using ExpenseTracker.Core.Interfaces;
using ExpenseTracker.Core.Models;
using ExpenseTracker.Core.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

builder.Services.AddSingleton<IStorageService<Expense>>(
    x => new JsonStorageService<Expense>("expenses.json")
);
builder.Services.AddSingleton<IStorageService<Budget>>(
    x => new JsonStorageService<Budget>("budgets.json")
);
builder.Services.AddSingleton<IExpenseService, ExpenseService>();
builder.Services.AddSingleton<IBudgetService, BudgetService>();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();
app.UseRouting();
app.MapControllers();

app.Run();