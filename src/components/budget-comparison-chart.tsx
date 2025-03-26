"use client"

import { useState } from "react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface TimelineData {
  planned: number
  actual: number
}

interface BudgetComparisonProps {
  data: {
    [key: string]: TimelineData
  }
}

export function BudgetComparisonChart({ data }: BudgetComparisonProps) {
  const [selectedTimeline, setSelectedTimeline] = useState("last_month")

  const timelineOptions = [
    { value: "last_week", label: "Last Week" },
    { value: "last_month", label: "Last Month" },
    { value: "last_3_months", label: "Last 3 Months" },
    { value: "last_6_months", label: "Last 6 Months" },
    { value: "all_time", label: "All Time" },
  ]

  // Ensure data exists for the selected timeline
  const timelineData = data[selectedTimeline] || { planned: 0, actual: 0 };

  const chartData = [{
    category: "Budget",
    Planned: timelineData.planned,
    Actual: timelineData.actual,
  }]

  const formatCurrency = (value: number) => {
    return `₹${value.toLocaleString()}`
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-end -mb-4">
        <Select value={selectedTimeline} onValueChange={setSelectedTimeline}>
          <SelectTrigger className="w-[180px] rounded-xl border-2 shadow-sm bg-background hover:bg-accent/5 transition-colors">
            <SelectValue placeholder="Select Timeline" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-2">
            {timelineOptions.map((option) => (
              <SelectItem 
                key={option.value} 
                value={option.value}
                className="cursor-pointer hover:bg-accent focus:bg-accent"
              >
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <ResponsiveContainer width="100%" height={250}>
        <BarChart 
          data={chartData}
          margin={{ top: 5, right: 30, left: 20, bottom: 30 }}
          barGap={8}
        >
          <CartesianGrid 
            strokeDasharray="3 3"
            vertical={false}
            stroke="var(--border)"
            opacity={0.3}
          />
          <XAxis 
            dataKey="category"
            stroke="var(--foreground)"
            tickLine={false}
            axisLine={{ stroke: 'var(--border)' }}
            dy={16}
          />
          <YAxis 
            stroke="var(--foreground)"
            tickLine={false}
            axisLine={{ stroke: 'var(--border)' }}
            tickFormatter={formatCurrency}
            width={70}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--background)",
              borderRadius: "8px",
              border: "1px solid var(--border)",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"
            }}
            formatter={(value) => formatCurrency(value as number)}
            cursor={{ fill: 'var(--accent)', opacity: 0.1 }}
          />
          <Legend 
            verticalAlign="top"
            height={36}
            iconType="circle"
          />
          <Bar 
            dataKey="Planned"
            fill="#0ea5e9"
            radius={[8, 8, 0, 0]}
            className="drop-shadow-lg"
          />
          <Bar 
            dataKey="Actual"
            fill="#f97316"
            radius={[8, 8, 0, 0]}
            className="drop-shadow-lg"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

