'use client'

import { useQuery } from '@tanstack/react-query';
import { api } from './layout';

interface IExpense {
  id: number;
  createdAt: string;
  updatedAt: string | null;
  amount: number;
  name: string;
  category: string;
}

export default function Home() {
  const expensesQuery = useQuery({
    queryKey: ['expenses'],
    queryFn: async () => {
      const response = await api.get<IExpense[]>('/expenses');
      return response.data;
    }
  });

  if (expensesQuery.isLoading) return <div>Loading...</div>

  const expenses = expensesQuery.data ?? []

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-6">Expenses</h1>
      <div className="grid gap-4">
        {expenses.map((expense) => (
          <div key={expense.id} className="border p-4 rounded-lg shadow">
            <div className="flex justify-between items-center">
              <h2 className="font-semibold">{expense.name}</h2>
              <span className="text-lg">${expense.amount}</span>
            </div>
            <div className="text-sm text-gray-600">
              <span>{new Date(expense.createdAt).toLocaleString()}</span>
              <span className="ml-4">{expense.category}</span>
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}