'use client';

import { Suspense, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { PlusCircle, Target, MessageSquareText, Lightbulb, LogOut } from "lucide-react"
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

interface UserData {
  profile: {
    name: string;
    image: string;
  };
  finances: {
    income: {
      monthly: number;
      annual: number;
    };
    expenses: {
      monthly: number;
      breakdown: {
        housing: number;
        food: number;
        transportation: number;
        utilities: number;
        healthcare: number;
        entertainment: number;
      };
    };
    expenseBreakdown: {
      needs: number;
      wants: number;
      savings: number;
    };
  };
  budgetComparison: {
    [key: string]: {
      planned: number;
      actual: number;
    };
  };
  nextGoal: {
    name: string;
    target: number;
    current: number;
  };
  savingsProgress: number;
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

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
        
        const data = userDoc.data();
        // Calculate savings progress
        const savingsProgress = Math.round((data.finances.expenseBreakdown.savings / 20) * 100); // 20% is the target
        
        // Get the first goal as next goal
        const nextGoal = data.finances.goals?.[0] || {
          name: 'Emergency Fund',
          target: 50000,
          current: 0
        };

        setUserData({
          ...data,
          savingsProgress,
          nextGoal
        } as UserData);
      } catch (error) {
        console.error('Error fetching user data:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    }

    fetchUserData();
  }, [user, router]);

  if (loading || !userData) {
    return <DashboardSkeleton />;
  }

  // Determine feedback based on expense breakdown
  const getFeedback = (needs: number, wants: number, savings: number) => {
    if (savings >= 30) return "Great job!"
    if (savings >= 20) return "Good progress!"
    if (savings >= 10) return "You can do better!"
    return "Let's improve your savings!"
  }

  // Calculate goal progress percentage
  const goalProgress = (userData.nextGoal.current / userData.nextGoal.target) * 100

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
                            ₹{userData.finances.income.monthly.toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground">Income</p>
                        </div>
                        <div>
                          <p className="text-2xl font-semibold text-secondary/90">
                            ₹{userData.finances.expenses.monthly.toLocaleString()}
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
                        <Progress value={userData.savingsProgress} className="h-2 shadow-sm" />
                        <p className="text-xs text-muted-foreground">{userData.savingsProgress}% of your target</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-background to-background/40">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Next Goal: {userData.nextGoal.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <Progress value={goalProgress} className="h-2 shadow-sm" />
                        <div className="flex justify-between">
                          <p className="text-xs text-muted-foreground">₹{userData.nextGoal.current.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">₹{userData.nextGoal.target.toLocaleString()}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>

            {/* Financial Insights Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <Card className="shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-background to-background/40">
                <CardHeader>
                  <CardTitle className="text-lg font-medium">Where Your Money Goes</CardTitle>
                  <CardDescription>Expense Breakdown</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] p-4">
                    <ExpenseBreakdownChart data={userData.finances.expenseBreakdown} />
                  </div>
                  <p className="text-sm text-center mt-4">
                    You spent {userData.finances.expenseBreakdown.needs}% on needs, {userData.finances.expenseBreakdown.wants}% on wants, and
                    saved {userData.finances.expenseBreakdown.savings}%.
                    <span className="font-medium ml-1 text-primary">
                      {getFeedback(
                        userData.finances.expenseBreakdown.needs,
                        userData.finances.expenseBreakdown.wants,
                        userData.finances.expenseBreakdown.savings,
                      )}
                    </span>
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-background to-background/40">
                <CardHeader>
                  <CardTitle className="text-lg font-medium">Budget vs. Actual Spending</CardTitle>
                  <CardDescription>Compare your planned budget with actual spending</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] p-4">
                    <BudgetComparisonChart data={userData.budgetComparison} />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Suggested Action Plan */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg font-medium">Suggested Action Plan</CardTitle>
                <CardDescription>Based on your current financial goals</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

