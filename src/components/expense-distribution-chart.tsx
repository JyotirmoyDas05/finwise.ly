"use client";

import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

interface ExpenseDistributionChartProps {
  budgetData: {
    name: string;
    value: number;
  }[];
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

const ExpenseDistributionChart = ({ budgetData }: ExpenseDistributionChartProps) => {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="w-full h-full max-w-[400px]">
        <PieChart width={400} height={400}>
          <Pie
            data={budgetData}
            cx="50%"
            cy="50%"
            outerRadius={100}
            fill="#8884d8"
            paddingAngle={2}
            dataKey="value"
            nameKey="name"
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          >
            {budgetData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={COLORS[index % COLORS.length]}
                strokeWidth={2}
              />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value) => `₹${Number(value).toLocaleString()}`}
            contentStyle={{
              backgroundColor: 'white',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
            }}
          />
          <Legend 
            verticalAlign="bottom"
            height={36}
            iconType="circle"
            layout="horizontal"
            wrapperStyle={{
              paddingTop: "20px",
              width: "100%",
              fontSize: "12px",
              overflowX: "auto",
              overflowY: "hidden",
              whiteSpace: "nowrap"
            }}
          />
        </PieChart>
      </div>
    </div>
  );
};

export default ExpenseDistributionChart; 