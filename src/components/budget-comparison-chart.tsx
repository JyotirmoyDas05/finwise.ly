"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

interface BudgetComparisonProps {
  data: {
    categories: string[]
    budget: number[]
    actual: number[]
  }
}

export function BudgetComparisonChart({ data }: BudgetComparisonProps) {
  const chartData = data.categories.map((category, index) => ({
    name: category,
    Budget: data.budget[index],
    Actual: data.actual[index],
  }))

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={chartData}
        margin={{
          top: 20,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip
          formatter={(value) => [`₹${value.toLocaleString()}`, ""]}
          contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0" }}
        />
        <Legend />
        <Bar dataKey="Budget" fill="#0ea5e9" name="Budget" />
        <Bar dataKey="Actual" fill="#f97316" name="Actual" />
      </BarChart>
    </ResponsiveContainer>
  )
}

