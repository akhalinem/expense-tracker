import { IExpense } from "@/types";
import { api, displayCurrency, displayDate } from "@/utils";

export default async function Home() {
  const { data: expenses } = await api.get<IExpense[]>("/expenses")

  const totalExpenses = expenses.reduce((acc, expense) => acc + expense.amount, 0)

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-6">Expenses</h1>

      <div className="border p-4 rounded-lg shadow mt-4">
        <h2 className="font-semibold">Total Expenses</h2>
        <span className="text-lg">{displayCurrency(totalExpenses)}</span>
      </div>

      <h2 className="text-xl font-semibold mt-8 mb-4">Recent Expenses</h2>

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