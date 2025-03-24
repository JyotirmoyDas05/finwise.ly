'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, LogOut, Plus, Target, MessageSquare } from 'lucide-react';
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from 'recharts';

interface ExpenseData {
  name: string;
  value: number;
}

interface TrendData {
  month: string;
  income: number;
  expenses: number;
}

// Mock data - Replace with real data from your backend
const mockExpenseData: ExpenseData[] = [
  { name: 'Food', value: 400 },
  { name: 'Transport', value: 300 },
  { name: 'Entertainment', value: 200 },
  { name: 'Bills', value: 600 },
];

const mockTrendData: TrendData[] = [
  { month: 'Jan', income: 5000, expenses: 4000 },
  { month: 'Feb', income: 5200, expenses: 3800 },
  { month: 'Mar', income: 5400, expenses: 4200 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch user data and financial information
    const fetchData = async () => {
      try {
        // Add your data fetching logic here
        setLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-4">
            <img
              src={user?.photoURL || '/default-avatar.png'}
              alt="Profile"
              className="w-8 h-8 rounded-full"
            />
            <h2 className="text-lg font-semibold">Welcome, {user?.displayName}</h2>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon">
              <Bell className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => logout()}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-6 space-y-8">
        {/* Financial Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-6">
            <h3 className="font-medium text-sm text-muted-foreground">Monthly Income</h3>
            <p className="text-2xl font-bold">$5,400</p>
            <span className="text-green-500 text-sm">+8% from last month</span>
          </Card>
          <Card className="p-6">
            <h3 className="font-medium text-sm text-muted-foreground">Expenses</h3>
            <p className="text-2xl font-bold">$4,200</p>
            <span className="text-red-500 text-sm">+5% from last month</span>
          </Card>
          <Card className="p-6">
            <h3 className="font-medium text-sm text-muted-foreground">Savings</h3>
            <p className="text-2xl font-bold">$1,200</p>
            <span className="text-green-500 text-sm">80% of target</span>
          </Card>
          <Card className="p-6">
            <h3 className="font-medium text-sm text-muted-foreground">Debt</h3>
            <p className="text-2xl font-bold">$15,000</p>
            <span className="text-muted-foreground text-sm">Student Loan</span>
          </Card>
        </div>

        {/* AI Insights */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">AI-Powered Insights</h3>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-primary/10 rounded-full">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">Reduce dining expenses</p>
                <p className="text-sm text-muted-foreground">
                  Your dining expenses are 15% higher than last month. Consider cooking more meals at home.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="p-2 bg-primary/10 rounded-full">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">Investment Opportunity</p>
                <p className="text-sm text-muted-foreground">
                  Based on your risk profile, consider investing in index funds for long-term growth.
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Expense Distribution</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={mockExpenseData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }: { name: string; percent: number }) => 
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {mockExpenseData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Income & Expense Trends</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mockTrendData}>
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="income" stroke="#0088FE" strokeWidth={2} />
                  <Line type="monotone" dataKey="expenses" stroke="#FF8042" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-4">
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" /> Add Expense
          </Button>
          <Button className="flex items-center gap-2" variant="outline">
            <Target className="h-4 w-4" /> Set New Goal
          </Button>
          <Button className="flex items-center gap-2" variant="secondary">
            <MessageSquare className="h-4 w-4" /> Chat with AI
          </Button>
        </div>
      </main>
    </div>
  );
} 