"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"

interface ExpenseBreakdownProps {
  data: {
    needs: number
    wants: number
    savings: number
  }
}

export function ExpenseBreakdownChart({ data }: ExpenseBreakdownProps) {
  const chartData = [
    { name: "Needs", value: data.needs, color: "#0ea5e9" }, // Blue
    { name: "Wants", value: data.wants, color: "#f97316" }, // Orange
    { name: "Savings", value: data.savings, color: "#10b981" }, // Green
  ]

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value) => [`${value}%`, "Percentage"]}
          contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0" }}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}

