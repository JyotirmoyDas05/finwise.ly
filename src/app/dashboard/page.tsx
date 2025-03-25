import { Suspense } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { PlusCircle, Target, MessageSquareText, Lightbulb } from "lucide-react"
import { ExpenseBreakdownChart } from "@/components/expense-breakdown-chart"
import { BudgetComparisonChart } from "@/components/budget-comparison-chart"
import { EducationalCard } from "@/components/educational-card"
import { VideoTutorialCard } from "@/components/video-tutorial-card"
import { DashboardSkeleton } from "@/components/dashboard-skeleton"
import { DashboardSidebar } from "@/components/dashboard-sidebar"

export default function Dashboard() {
  // Mock data - in a real app, this would come from your backend
  const userData = {
    name: "Rahul",
    profileImage: "/placeholder.svg?height=40&width=40",
    incomeVsExpenses: {
      income: 50000,
      expenses: 35000,
    },
    savingsProgress: 65,
    nextGoal: {
      name: "Emergency Fund",
      target: 100000,
      current: 65000,
    },
    expenseBreakdown: {
      needs: 40,
      wants: 30,
      savings: 30,
    },
    budgetComparison: {
      categories: ["Housing", "Food", "Transport", "Entertainment", "Dining"],
      budget: [15000, 8000, 5000, 3000, 4000],
      actual: [14000, 7500, 4800, 3500, 3900],
    },
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
    <div className="flex h-screen">
      <DashboardSidebar />
      <div className="flex-1 overflow-auto">
        <div className="container mx-auto px-4 py-6">
          <Suspense fallback={<DashboardSkeleton />}>
            {/* Welcome Section */}
            <Card className="mb-6">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="flex items-center space-x-4">
                  <Avatar>
                    <AvatarImage src={userData.profileImage} alt={userData.name} />
                    <AvatarFallback>{userData.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-2xl">Welcome, {userData.name}!</CardTitle>
                    <CardDescription>Let's Make Finance Simple Today!</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground mb-4">
                  <span className="inline-flex items-center">
                    <Lightbulb className="h-4 w-4 mr-1 text-yellow-500" />
                    {/* Space for AI tip */}
                    <em>Tip: Try saving 20% of your income. It's easier than you think!</em>
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Income vs. Expenses</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-2xl font-bold">₹{userData.incomeVsExpenses.income.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">Income</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold">₹{userData.incomeVsExpenses.expenses.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">Expenses</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Current Savings Progress</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <Progress value={userData.savingsProgress} className="h-2" />
                        <p className="text-xs text-muted-foreground">{userData.savingsProgress}% of your target</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Next Goal: {userData.nextGoal.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <Progress value={goalProgress} className="h-2" />
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
              <Card>
                <CardHeader>
                  <CardTitle>Where Your Money Goes</CardTitle>
                  <CardDescription>Expense Breakdown</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ExpenseBreakdownChart data={userData.expenseBreakdown} />
                  </div>
                  <p className="text-center mt-4">
                    You spent {userData.expenseBreakdown.needs}% on needs, {userData.expenseBreakdown.wants}% on wants, and
                    saved {userData.expenseBreakdown.savings}%.
                    <span className="font-medium">
                      {" "}
                      {getFeedback(
                        userData.expenseBreakdown.needs,
                        userData.expenseBreakdown.wants,
                        userData.expenseBreakdown.savings,
                      )}
                    </span>
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Your Monthly Budget & Alerts</CardTitle>
                  <CardDescription>Budget vs. Actual Spending</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <BudgetComparisonChart data={userData.budgetComparison} />
                  </div>
                  <div className="mt-4 p-3 bg-muted rounded-md">
                    <span className="inline-flex items-center text-sm">
                      <Lightbulb className="h-4 w-4 mr-1 text-yellow-500" />
                      {/* Space for AI alert */}
                      <em>🚨 You're close to overspending on dining this month!</em>
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Suggested Action Plan */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Suggested Action Plan</CardTitle>
                <CardDescription>Based on your current financial goals</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-medium mb-2">Saving Goal</h3>
                    <p className="text-sm text-muted-foreground">Try setting aside ₹500 more this month!</p>
                  </div>
                  <div className="p-4 border rounded-lg">
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
                <CardTitle>Finance Made Easy</CardTitle>
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

                <h3 className="font-medium mb-4">Quick 1-Minute Video Tutorials</h3>
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
                    <h3 className="font-medium">AI-Powered FAQ Chatbot</h3>
                    <p className="text-sm text-muted-foreground">Ask me anything about finance!</p>
                  </div>
                  <Button variant="outline">
                    <MessageSquareText className="h-4 w-4 mr-2" />
                    Ask a Question
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions Panel */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Easy-to-use shortcuts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button className="h-auto py-4 flex flex-col items-center justify-center gap-2">
                    <PlusCircle className="h-6 w-6" />
                    <span>Add Expense</span>
                  </Button>
                  <Button className="h-auto py-4 flex flex-col items-center justify-center gap-2" variant="outline">
                    <Target className="h-6 w-6" />
                    <span>Set a Goal</span>
                  </Button>
                  <Button className="h-auto py-4 flex flex-col items-center justify-center gap-2" variant="outline">
                    <MessageSquareText className="h-6 w-6" />
                    <span>Ask AI</span>
                  </Button>
                  <Button className="h-auto py-4 flex flex-col items-center justify-center gap-2" variant="outline">
                    <Lightbulb className="h-6 w-6" />
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

