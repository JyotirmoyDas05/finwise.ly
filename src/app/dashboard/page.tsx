'use client';

import { Suspense, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { PlusCircle, Target, MessageSquareText, Lightbulb, LogOut, Plus } from "lucide-react"
import { ExpenseBreakdownChart } from "@/components/expense-breakdown-chart"
import { BudgetComparisonChart } from "@/components/budget-comparison-chart"
import { EducationalCard } from "@/components/educational-card"
import { VideoTutorialCard } from "@/components/video-tutorial-card"
import { DashboardSkeleton } from "@/components/dashboard-skeleton"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { db } from "@/app/lib/firebase"
import { doc, getDoc } from "firebase/firestore"
import { useAuth } from "@/app/context/AuthContext"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { collection, getDocs, query, where } from "firebase/firestore"
import { cn } from "@/lib/utils"

interface UserData {
  profile: {
    name: string;
    image: string;
  };
  finances: {
    netWorth: number;
    monthlyIncome: number;
    monthlyExpenses: number;
    healthScore: number;
    budgets: {
      id: string;
    name: string;
      amount: number;
      spent: number;
      emoji: string;
      category: string;
      classification: string;
    }[];
    transactions: {
      id: string;
      type: "income" | "expense";
      amount: number;
      category: string;
      description: string;
      date: string;
    }[];
  };
}

interface Goal {
  id: string;
  type: "savings" | "debt" | "emergency" | "purchase";
  amount: number;
  currentAmount: number;
  deadline: string;
  priority: "low" | "medium" | "high";
  title: string;
}

interface Budget {
  id: string;
  name: string;
  amount: number;
  spent: number;
  emoji: string;
  category: string;
  classification: "need" | "want";
}

interface Transaction {
  id: string;
  type: "income" | "expense";
  amount: number;
  category: string;
  description: string;
  date: string;
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    async function fetchUserData() {
      if (!user?.uid) {
        router.push('/login');
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (!userDoc.exists()) {
          router.push('/profile-setup');
          return;
        }
        
        // Fetch goals
        const goalsQuery = query(collection(db, "users", user.uid, "goals"));
        const goalsSnapshot = await getDocs(goalsQuery);
        const goalsData = goalsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Goal[];
        setGoals(goalsData);

        // Fetch budgets
        const budgetsQuery = query(collection(db, "budgets"), where("userId", "==", user.uid));
        const budgetsSnapshot = await getDocs(budgetsQuery);
        const budgetsData = budgetsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Budget[];
        setBudgets(budgetsData);

        // Fetch transactions
        const transactionsQuery = query(collection(db, "transactions"), where("userId", "==", user.uid));
        const transactionsSnapshot = await getDocs(transactionsQuery);
        const transactionsData = transactionsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Transaction[];
        setTransactions(transactionsData);

        // Calculate overview
        const monthlyIncome = transactionsData
          .filter(t => t.type === "income")
          .reduce((sum, t) => sum + t.amount, 0);
        
        const monthlyExpenses = transactionsData
          .filter(t => t.type === "expense")
          .reduce((sum, t) => sum + t.amount, 0);

        const netWorth = monthlyIncome - monthlyExpenses;
        
        // Calculate health score
        const healthScore = calculateHealthScore(budgetsData, transactionsData);

        setUserData({
          profile: userDoc.data().profile,
          finances: {
            netWorth,
            monthlyIncome,
            monthlyExpenses,
            healthScore,
            budgets: budgetsData,
            transactions: transactionsData
          }
        });
      } catch (error) {
        console.error('Error fetching user data:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    }

    fetchUserData();
  }, [user, router]);

  const calculateHealthScore = (budgets: UserData['finances']['budgets'], transactions: UserData['finances']['transactions']): number => {
    const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0);
    const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);
    const budgetUtilization = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
    
    const monthlyIncome = transactions
      .filter(t => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);
    
    const monthlyExpenses = transactions
      .filter(t => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);
    
    const incomeExpenseRatio = monthlyIncome > 0 ? (monthlyExpenses / monthlyIncome) * 100 : 0;
    const savingsRate = monthlyIncome > 0 ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100 : 0;

    const score = (
      (Math.max(0, 100 - budgetUtilization) * 0.4) +
      (Math.max(0, 100 - incomeExpenseRatio) * 0.3) +
      (savingsRate * 0.3)
    );

    return Math.min(100, Math.max(0, score));
  };

  if (loading || !userData) {
    return <DashboardSkeleton />;
  }

  // Calculate expense breakdown
  const calculateExpenseBreakdown = () => {
    const monthlyIncome = userData.finances.monthlyIncome;
    const monthlyExpenses = userData.finances.monthlyExpenses;
    
    if (monthlyIncome === 0) return { needs: 0, wants: 0, savings: 0 };
    
    // Calculate savings percentage
    const savings = ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100;
    
    // Calculate needs and wants based on actual classifications
    const needsAmount = userData.finances.budgets
      .filter(b => b.classification === "need")
      .reduce((sum, b) => sum + b.spent, 0);
    
    const wantsAmount = userData.finances.budgets
      .filter(b => b.classification === "want")
      .reduce((sum, b) => sum + b.spent, 0);
    
    const needs = (needsAmount / monthlyExpenses) * 100;
    const wants = (wantsAmount / monthlyExpenses) * 100;
    
    return {
      needs: Math.round(needs),
      wants: Math.round(wants),
      savings: Math.round(savings)
    };
  };

  const expenseBreakdown = calculateExpenseBreakdown();

  // Calculate budget comparison data
  const budgetComparison = userData.finances.budgets.reduce((acc, budget) => ({
    ...acc,
    [budget.category]: {
      planned: budget.amount,
      actual: budget.spent
    }
  }), {});

  // Determine feedback based on expense breakdown
  const getFeedback = (needs: number, wants: number, savings: number) => {
    if (savings >= 30) return "Great job!"
    if (savings >= 20) return "Good progress!"
    if (savings >= 10) return "You can do better!"
    return "Let's improve your savings!"
  }

  return (
    <div className="flex h-screen bg-background">
      <DashboardSidebar />
      <div className="flex-1 overflow-auto">
        <div className="container mx-auto px-6 py-8">
          <Suspense fallback={<DashboardSkeleton />}>
            {/* Welcome Section */}
            <Card className="mb-8 border-0 shadow-lg bg-gradient-to-b from-background to-background/40 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-12 w-12 ring-2 ring-primary/20 shadow-lg">
                      <AvatarImage src={userData.profile.image} alt={userData.profile.name} />
                      <AvatarFallback className="bg-primary/5">{userData.profile.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-2xl font-medium text-foreground/90">
                        Welcome, {userData.profile.name}!
                      </CardTitle>
                      <CardDescription className="text-base">Let&apos;s Make Finance Simple Today!</CardDescription>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="default"
                    className="px-6 py-2 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/50 hover:bg-primary hover:text-white backdrop-blur-sm border-2 border-primary/20 hover:border-primary rounded-xl font-medium"
                    onClick={async () => {
                      try {
                        await logout();
                        router.push('/login');
                      } catch (error) {
                        console.error('Failed to log out:', error);
                      }
                    }}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground mb-6">
                  <span className="inline-flex items-center bg-primary/5 px-3 py-1 rounded-xl shadow-sm">
                    <Lightbulb className="h-4 w-4 mr-2 text-primary" />
                    <em>Tip: Try saving 20% of your income. It&apos;s easier than you think!</em>
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="border shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-background to-background/40">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Income vs. Expenses</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-2xl font-semibold text-primary/90">
                            ₹{userData.finances.monthlyIncome.toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground">Income</p>
                        </div>
                        <div>
                          <p className="text-2xl font-semibold text-secondary/90">
                            ₹{userData.finances.monthlyExpenses.toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground">Expenses</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-background to-background/40">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Current Savings Progress</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <Progress value={userData.finances.monthlyIncome > 0 
                          ? ((userData.finances.monthlyIncome - userData.finances.monthlyExpenses) / userData.finances.monthlyIncome) * 100 
                          : 0} 
                          className="h-2 shadow-sm" 
                        />
                        <p className="text-xs text-muted-foreground">
                          {userData.finances.monthlyIncome > 0 
                            ? Math.round(((userData.finances.monthlyIncome - userData.finances.monthlyExpenses) / userData.finances.monthlyIncome) * 100)
                            : 0}% of your income saved
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-background to-background/40">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Financial Health Score</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <Progress value={userData.finances.healthScore} className="h-2 shadow-sm" />
                        <p className="text-xs text-muted-foreground">{userData.finances.healthScore.toFixed(1)}% health score</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>

            {/* Goals Progress Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <Card className="shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-background to-background/40">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-lg font-medium">Financial Goals</CardTitle>
                      <CardDescription>Track your progress</CardDescription>
                    </div>
                    <Button 
                      variant="outline" 
                      className="rounded-xl border-2 transition-colors hover:bg-primary hover:text-primary-foreground"
                      onClick={() => router.push('/dashboard/goals')}
                    >
                      <Target className="h-4 w-4 mr-2" />
                      View All
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {goals.slice(0, 3).map((goal) => (
                      <div key={goal.id} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{goal.title}</span>
                          <span className="text-sm text-muted-foreground">
                            ₹{goal.currentAmount.toLocaleString()} / ₹{goal.amount.toLocaleString()}
                          </span>
                        </div>
                        <Progress 
                          value={(goal.currentAmount / goal.amount) * 100}
                          className="h-2"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Due: {new Date(goal.deadline).toLocaleDateString()}</span>
                          <span className={cn(
                            goal.priority === "high" && "text-red-500",
                            goal.priority === "medium" && "text-yellow-500",
                            goal.priority === "low" && "text-green-500"
                          )}>
                            {goal.priority.charAt(0).toUpperCase() + goal.priority.slice(1)} Priority
                          </span>
                        </div>
                      </div>
                    ))}
                    {goals.length === 0 && (
                      <div className="text-center py-4 text-muted-foreground">
                        No goals set yet. Start by adding a financial goal!
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-background to-background/40">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-lg font-medium">Budget vs. Actual Spending</CardTitle>
                      <CardDescription>Compare your planned budget with actual spending</CardDescription>
                    </div>
                    <Button 
                      variant="outline" 
                      className="rounded-xl border-2 transition-colors hover:bg-primary hover:text-primary-foreground"
                      onClick={() => router.push('/dashboard/finance')}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Manage
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] p-4">
                    <BudgetComparisonChart 
                      data={{
                        last_month: {
                          planned: budgets.reduce((sum, budget) => sum + budget.amount, 0),
                          actual: budgets.reduce((sum, budget) => sum + budget.spent, 0)
                        }
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Financial Insights Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <Card className="shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-background to-background/40">
                <CardHeader>
                  <CardTitle className="text-lg font-medium">Where Your Money Goes</CardTitle>
                  <CardDescription>Expense Breakdown</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] p-4">
                    <ExpenseBreakdownChart data={expenseBreakdown} />
                  </div>
                  <p className="text-sm text-center mt-4">
                    You spent {expenseBreakdown.needs}% on needs, {expenseBreakdown.wants}% on wants, and
                    saved {expenseBreakdown.savings}%.
                    <span className="font-medium ml-1 text-primary">
                      {getFeedback(
                        expenseBreakdown.needs,
                        expenseBreakdown.wants,
                        expenseBreakdown.savings,
                      )}
                    </span>
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-background to-background/40">
                <CardHeader>
                  <CardTitle className="text-lg font-medium">Suggested Action Plan</CardTitle>
                  <CardDescription>Based on your current financial goals</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="p-4 border rounded-lg bg-card">
                      <h3 className="font-medium mb-2">Saving Goal</h3>
                      <p className="text-sm text-muted-foreground">Try setting aside ₹500 more this month!</p>
                    </div>
                    <div className="p-4 border rounded-lg bg-card">
                      <h3 className="font-medium mb-2">Investing Goal</h3>
                      <p className="text-sm text-muted-foreground">
                        Consider learning about Mutual Funds. We have a guide for you!
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Educational Section */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg font-medium">Finance Made Easy</CardTitle>
                <CardDescription>Learn finance in simple steps</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <EducationalCard
                    title="How to Save Money"
                    description="A beginner's guide to saving money effectively"
                    icon="💰"
                    readTime="3 min read"
                  />
                  <EducationalCard
                    title="What is Investing?"
                    description="Investing explained in simple terms"
                    icon="📈"
                    readTime="3 min read"
                  />
                  <EducationalCard
                    title="How to Avoid Debt Traps"
                    description="Simple strategies to stay debt-free"
                    icon="💳"
                    readTime="3 min read"
                  />
                </div>

                <h3 className="font-medium text-base mb-4">Quick 1-Minute Video Tutorials</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <VideoTutorialCard
                    title="How to Budget Like a Pro"
                    thumbnail="/placeholder.svg?height=120&width=240"
                    duration="1:00"
                  />
                  <VideoTutorialCard
                    title="Why Credit Scores Matter"
                    thumbnail="/placeholder.svg?height=120&width=240"
                    duration="1:00"
                  />
                </div>

                <div className="bg-muted p-4 rounded-lg flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-base">AI-Powered FAQ Chatbot</h3>
                    <p className="text-sm text-muted-foreground">Ask me anything about finance!</p>
                  </div>
                  <Button 
                    variant="outline" 
                    className="rounded-xl border-2 transition-colors hover:bg-primary hover:text-primary-foreground"
                    onClick={() => router.push('/dashboard/ask')}
                  >
                    <MessageSquareText className="h-4 w-4 mr-2" />
                    Ask a Question
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions Panel */}
            <Card className="shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-background to-background/40">
              <CardHeader>
                <CardTitle className="text-lg font-medium">Quick Actions</CardTitle>
                <CardDescription>Easy-to-use shortcuts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button 
                    className="h-auto py-4 flex flex-col items-center justify-center gap-2 rounded-xl shadow-lg hover:shadow-xl hover:translate-y-[-2px] transition-all bg-gradient-to-br from-primary to-primary/90"
                    variant="default"
                  >
                    <PlusCircle className="h-6 w-6 drop-shadow" />
                    <span>Add Expense</span>
                  </Button>
                  <Button 
                    className="h-auto py-4 flex flex-col items-center justify-center gap-2 rounded-xl border-2 shadow-lg hover:shadow-xl hover:translate-y-[-2px] transition-all bg-gradient-to-br from-background to-background/40"
                    variant="outline"
                  >
                    <Target className="h-6 w-6 drop-shadow" />
                    <span>Set a Goal</span>
                  </Button>
                  <Button 
                    className="h-auto py-4 flex flex-col items-center justify-center gap-2 rounded-xl border-2 shadow-lg hover:shadow-xl hover:translate-y-[-2px] transition-all bg-gradient-to-br from-background to-background/40"
                    variant="outline"
                    onClick={() => router.push('/dashboard/ask')}
                  >
                    <MessageSquareText className="h-6 w-6 drop-shadow" />
                    <span>Ask AI</span>
                  </Button>
                  <Button 
                    className="h-auto py-4 flex flex-col items-center justify-center gap-2 rounded-xl border-2 shadow-lg hover:shadow-xl hover:translate-y-[-2px] transition-all bg-gradient-to-br from-background to-background/40"
                    variant="outline"
                  >
                    <Lightbulb className="h-6 w-6 drop-shadow" />
                    <span>Money-Saving Tip</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </Suspense>
        </div>
      </div>
    </div>
  )
} 

