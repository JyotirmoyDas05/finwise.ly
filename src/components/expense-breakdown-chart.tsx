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
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={100}
          innerRadius={60}
          paddingAngle={5}
          dataKey="value"
          label={({ name, value }) => `${name}: ${value}%`}
        >
          {chartData.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={entry.color}
              stroke="rgba(255,255,255,0.2)"
              className="drop-shadow-xl"
            />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: "var(--background)",
            borderRadius: "8px",
            border: "1px solid var(--border)",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"
          }}
          formatter={(value) => `${value}%`}
        />
        <Legend
          verticalAlign="bottom"
          height={36}
          iconType="circle"
        />
      </PieChart>
    </ResponsiveContainer>
  )
}

