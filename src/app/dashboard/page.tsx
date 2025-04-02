'use client';

import { Suspense, useEffect, useRef, useState } from "react"
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
import { collection, getDocs, query, where } from "firebase/firestore"
import { cn } from "@/lib/utils"
import { searchYouTubeVideos, formatDuration, YouTubeVideo } from "@/lib/youtube"

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

// Define section IDs for scroll restoration
const SECTION_IDS = {
  GOALS: "goals-section",
  FINANCES: "finances-section",
  INSIGHTS: "insights-section",
  EDUCATION: "education-section",
  QUICK_ACTIONS: "quick-actions-section"
};

export default function Dashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [tutorialVideos, setTutorialVideos] = useState<YouTubeVideo[]>([]);
  const hasMounted = useRef(false);
  
  // Ref to track if this is a back navigation
  const isBackNavigation = useRef(false);

  // Track click on section navigation
  const navigateWithSection = (path: string, sectionId: string) => {
    try {
      // Store section ID in localStorage for persistence
      localStorage.setItem('dashboardLastSection', sectionId);
      router.push(path);
    } catch (error) {
      console.error('Error storing section info:', error);
      router.push(path); // Fallback to regular navigation
    }
  };

  // Handle scroll restoration on component mount
  useEffect(() => {
    // Only run this after initial load and after data is loaded
    if (!loading && userData && !hasMounted.current) {
      hasMounted.current = true;
      
      try {
        // Get the saved section ID from localStorage
        const sectionId = localStorage.getItem('dashboardLastSection');
        if (sectionId) {
          // Small delay to ensure DOM is fully rendered
          setTimeout(() => {
            const element = document.getElementById(sectionId);
            if (element) {
              // Scroll to that section with smooth animation
              element.scrollIntoView({ behavior: 'smooth', block: 'start' });
              console.log('Scrolled to section:', sectionId);
            }
          }, 500);
        }
      } catch (error) {
        console.error('Error restoring scroll position:', error);
      }
    }
  }, [loading, userData]);

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

  useEffect(() => {
    async function fetchYouTubeVideos() {
      try {
        // Fetch short financial education videos
        const response = await searchYouTubeVideos('short personal finance tips', 4);
        setTutorialVideos(response.items);
      } catch (error) {
        console.error('Error fetching YouTube videos:', error);
      }
    }

    fetchYouTubeVideos();
  }, []);

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

  const generateActionSuggestions = (goals: Goal[], finances: UserData['finances']) => {
    const suggestions = [];

    // Analyze savings rate
    const savingsRate = ((finances.monthlyIncome - finances.monthlyExpenses) / finances.monthlyIncome) * 100;
    if (savingsRate < 20) {
      suggestions.push({
        title: "Increase Your Savings",
        description: `Your current savings rate is ${Math.round(savingsRate)}%. Try to save at least 20% of your income by reducing expenses or increasing income.`
      });
    }

    // Analyze high-priority goals
    const highPriorityGoals = goals.filter(g => g.priority === "high");
    if (highPriorityGoals.length > 0) {
      const mostUrgentGoal = highPriorityGoals.reduce((a, b) => 
        new Date(a.deadline) < new Date(b.deadline) ? a : b
      );
      suggestions.push({
        title: "Focus on High Priority Goal",
        description: `Prioritize your ${mostUrgentGoal.title} goal. You have ${Math.round((mostUrgentGoal.currentAmount / mostUrgentGoal.amount) * 100)}% progress.`
      });
    }

    // Analyze budget utilization
    const totalBudget = finances.budgets.reduce((sum, b) => sum + b.amount, 0);
    const totalSpent = finances.budgets.reduce((sum, b) => sum + b.spent, 0);
    const budgetUtilization = (totalSpent / totalBudget) * 100;
    
    if (budgetUtilization > 90) {
      suggestions.push({
        title: "Budget Warning",
        description: "You're close to exceeding your monthly budget. Consider reviewing your expenses and cutting back on non-essential items."
      });
    }

    // Analyze emergency fund
    const emergencyFundGoal = goals.find(g => g.type === "emergency");
    if (emergencyFundGoal) {
      const emergencyProgress = (emergencyFundGoal.currentAmount / emergencyFundGoal.amount) * 100;
      if (emergencyProgress < 50) {
        suggestions.push({
          title: "Build Emergency Fund",
          description: `Your emergency fund is at ${Math.round(emergencyProgress)}%. Aim to build it up to cover 3-6 months of expenses.`
        });
      }
    }

    // If no specific suggestions, provide a general one
    if (suggestions.length === 0) {
      suggestions.push({
        title: "Stay on Track",
        description: "You're doing well! Keep maintaining your current financial habits and continue working towards your goals."
      });
    }

    return suggestions;
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-background">
      <DashboardSidebar />
      <div className="flex-1 overflow-auto pt-16 md:pt-0">
        <div className="container mx-auto px-4 md:px-6 py-6 md:py-8">
          <Suspense fallback={<DashboardSkeleton />}>
            {/* Welcome Section */}
            <Card className="mb-6 md:mb-8 border-0 shadow-lg bg-gradient-to-b from-background to-background/40 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-4">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-12 w-12 ring-2 ring-primary/20 shadow-lg">
                      <AvatarImage src={userData.profile.image} alt={userData.profile.name} />
                      <AvatarFallback className="bg-primary/5">{userData.profile.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-xl md:text-2xl font-medium text-foreground/90">
                        Welcome, {userData.profile.name}!
                      </CardTitle>
                      <CardDescription className="text-base">Let&apos;s Make Finance Simple Today!</CardDescription>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="default"
                    className="px-4 md:px-6 py-2 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/50 hover:bg-primary hover:text-white backdrop-blur-sm border-2 border-primary/20 hover:border-primary rounded-xl font-medium w-full sm:w-auto"
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
                <div className="text-sm text-muted-foreground mb-4 md:mb-6">
                  <span className="inline-flex items-center bg-primary/5 px-3 py-1 rounded-xl shadow-sm">
                    <Lightbulb className="h-4 w-4 mr-2 text-primary" />
                    <em>Tip: Try saving 20% of your income. It&apos;s easier than you think!</em>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                  <Card className="border shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-background to-background/40">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Income vs. Expenses</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-lg md:text-2xl font-semibold text-primary/90">
                            ₹{userData.finances.monthlyIncome.toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground">Income</p>
                        </div>
                        <div>
                          <p className="text-lg md:text-2xl font-semibold text-secondary/90">
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-6">
              <Card id={SECTION_IDS.GOALS} className="shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-background to-background/40">
                <CardHeader>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                      <CardTitle className="text-lg font-medium">Financial Goals</CardTitle>
                      <CardDescription>Track your progress</CardDescription>
                    </div>
                    <Button 
                      variant="outline" 
                      className="rounded-xl border-2 transition-colors hover:bg-primary hover:text-primary-foreground w-full sm:w-auto"
                      onClick={() => navigateWithSection('/dashboard/goals', SECTION_IDS.GOALS)}
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

              <Card id={SECTION_IDS.FINANCES} className="shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-background to-background/40">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-lg font-medium">Budget vs. Actual Spending</CardTitle>
                      <CardDescription>Compare your planned budget with actual spending</CardDescription>
                    </div>
                    <Button 
                      variant="outline" 
                      className="rounded-xl border-2 transition-colors hover:bg-primary hover:text-primary-foreground"
                      onClick={() => navigateWithSection('/dashboard/finance', SECTION_IDS.FINANCES)}
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
            <div id={SECTION_IDS.INSIGHTS} className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-6">
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
                    {generateActionSuggestions(goals, userData.finances).map((suggestion, index) => (
                      <div key={index} className="p-4 border rounded-lg bg-card">
                        <h3 className="font-medium mb-2">{suggestion.title}</h3>
                        <p className="text-sm text-muted-foreground">{suggestion.description}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Educational Content Section */}
            <Card id={SECTION_IDS.EDUCATION} className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg font-medium">Finance Made Easy</CardTitle>
                <CardDescription>Learn finance in simple steps</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mt-6">
                  <EducationalCard
                    title="How to Save Money"
                    description="A beginner's guide to saving money effectively"
                    icon="💰"
                    readTime="3 min read"
                    link="https://www.iciciprulife.com/investments/how-to-save-money.html"
                    target="_blank"
                  />
                  <EducationalCard
                    title="What is Investing?"
                    description="Investing explained in simple terms"
                    icon="📈"
                    readTime="3 min read"
                    link="https://www.iciciprulife.com/investments.html"
                    target="_blank"
                  />
                  <EducationalCard
                    title="How to Avoid Debt Traps"
                    description="Simple strategies to stay debt-free"
                    icon="💳"
                    readTime="3 min read"
                    link="https://www.forbes.com/sites/truetamplin/2024/12/26/7-effective-strategies-to-help-you-avoid-new-debt-in-2025/"
                    target="_blank"
                  />
                </div>

                <h3 className="font-medium text-base mb-4 text-lg ">Quick  Video Tutorials</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {tutorialVideos.length > 0 ? (
                    tutorialVideos.slice(0, 2).map((video) => (
                      <VideoTutorialCard
                        key={video.id.videoId}
                        title={video.snippet.title}
                        thumbnail={video.snippet.thumbnails.high.url}
                        duration={video.contentDetails?.duration ? formatDuration(video.contentDetails.duration) : "1:00"}
                        videoId={video.id.videoId}
                      />
                    ))
                  ) : (
                    <>
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
                    </>
                  )}
                </div>

                <div className="bg-muted p-4 rounded-lg flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-base">AI-Powered FAQ Chatbot</h3>
                    <p className="text-sm text-muted-foreground">Ask me anything about finance!</p>
                  </div>
                  <Button 
                    variant="outline" 
                    className="rounded-xl border-2 transition-colors hover:bg-primary hover:text-primary-foreground"
                    onClick={() => navigateWithSection('/dashboard/ask', SECTION_IDS.EDUCATION)}
                  >
                    <MessageSquareText className="h-4 w-4 mr-2" />
                    Ask a Question
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions Section */}
            <Card id={SECTION_IDS.QUICK_ACTIONS} className="shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-background to-background/40">
              <CardHeader>
                <CardTitle className="text-lg font-medium">Quick Actions</CardTitle>
                <CardDescription>Easy-to-use shortcuts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                  <Button 
                    className="h-auto py-4 flex flex-col items-center justify-center gap-2 rounded-xl shadow-lg hover:shadow-xl hover:translate-y-[-2px] transition-all bg-gradient-to-br from-primary to-primary/90"
                    variant="default"
                    onClick={() => navigateWithSection('/dashboard/finance', SECTION_IDS.QUICK_ACTIONS)}
                  >
                    <PlusCircle className="h-6 w-6 drop-shadow" />
                    <span>Add Expense</span>
                  </Button>
                  <Button 
                    className="h-auto py-4 flex flex-col items-center justify-center gap-2 rounded-xl border-2 shadow-lg hover:shadow-xl hover:translate-y-[-2px] transition-all bg-gradient-to-br from-background to-background/40"
                    variant="outline"
                    onClick={() => navigateWithSection('/dashboard/goals', SECTION_IDS.QUICK_ACTIONS)}
                  >
                    <Target className="h-6 w-6 drop-shadow" />
                    <span>Set a Goal</span>
                  </Button>
                  <Button 
                    className="h-auto py-4 flex flex-col items-center justify-center gap-2 rounded-xl border-2 shadow-lg hover:shadow-xl hover:translate-y-[-2px] transition-all bg-gradient-to-br from-background to-background/40"
                    variant="outline"
                    onClick={() => navigateWithSection('/dashboard/ask', SECTION_IDS.QUICK_ACTIONS)}
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

