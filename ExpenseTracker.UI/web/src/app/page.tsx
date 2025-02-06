import { IBudget, IExpense } from "@/types";
import { api, displayCurrency, displayDate } from "@/utils";

export default async function Home() {
  const { data: currentBudget } = await api.get<IBudget | null>("/budgets/current")
  const { data: expenses } = await api.get<IExpense[]>("/expenses")

  const totalExpenses = expenses.reduce((acc, expense) => acc + expense.amount, 0)

  return (
    <main className="p-8">
      <h2 className="text-2xl font-bold mb-6">Overview</h2>

      <div className="grid gap-4 mb-8">
        {currentBudget && (
          <div className="border p-4 rounded-lg shadow">
            <h2 className="font-semibold">Budget</h2>
            <span className="text-lg">{displayCurrency(currentBudget.amount)}</span>
            <div className="text-sm text-gray-600 mt-2">
              Remaining: {displayCurrency(currentBudget.amount - totalExpenses)}
            </div>
          </div>
        )}

        <div className="border p-4 rounded-lg shadow">
          <h2 className="font-semibold">Total Expenses</h2>
          <span className="text-lg">{displayCurrency(totalExpenses)}</span>
        </div>
      </div>

      <h2 className="text-xl font-semibold mb-4">Recent Expenses</h2>
      <div className="grid gap-4">
        {expenses.map((expense) => (
          <div key={expense.id} className="border p-4 rounded-lg shadow">
            <div className="flex justify-between items-center">
              <h2 className="font-semibold">{expense.name}</h2>
              <span className="text-lg">{displayCurrency(expense.amount)}</span>
            </div>
            <div className="text-sm text-gray-600">
              <span>{displayDate(expense.createdAt)}</span>
              <span className="ml-4">{expense.category}</span>
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}