"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { db } from "@/app/lib/firebase";
import { doc, getDoc, collection, addDoc, query, where, getDocs, updateDoc, deleteDoc } from "firebase/firestore";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Plus, Target, Lightbulb, AlertCircle } from "lucide-react";
import { Calendar as CalendarIcon } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { StyledDialog } from "@/components/ui/styled-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface Goal {
  id: string;
  type: "savings" | "debt" | "emergency" | "purchase";
  amount: number;
  currentAmount: number;
  deadline: string;
  priority: "low" | "medium" | "high";
  title: string;
  description?: string;
  createdAt: string;
}

interface GoalInsight {
  title: string;
  description: string;
  type: "tip" | "warning" | "success";
}

export default function GoalsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [showNewGoalDialog, setShowNewGoalDialog] = useState(false);
  const [newGoal, setNewGoal] = useState<Partial<Goal>>({
    type: "savings",
    amount: 0,
    currentAmount: 0,
    deadline: new Date().toISOString(),
    priority: "medium",
    title: "",
  });
  const [insights, setInsights] = useState<GoalInsight[]>([]);
  const [date, setDate] = useState<Date>();

  useEffect(() => {
    if (!user?.uid) {
      router.push("/login");
      return;
    }

    fetchGoals();
  }, [user, router]);

  const fetchGoals = async () => {
    try {
      const goalsQuery = query(collection(db, "users", user!.uid, "goals"));
      const goalsSnapshot = await getDocs(goalsQuery);
      const goalsData = goalsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Goal[];
      setGoals(goalsData);
      generateInsights(goalsData);
    } catch (error) {
      console.error("Error fetching goals:", error);
      toast.error("Failed to load goals");
    } finally {
      setLoading(false);
    }
  };

  const generateInsights = (goals: Goal[]) => {
    const newInsights: GoalInsight[] = [];

    // Check for high-priority goals
    const highPriorityGoals = goals.filter(g => g.priority === "high");
    if (highPriorityGoals.length > 0) {
      newInsights.push({
        title: "High Priority Goals",
        description: `You have ${highPriorityGoals.length} high-priority goals. Focus on these first!`,
        type: "warning"
      });
    }

    // Check for approaching deadlines
    const now = new Date();
    goals.forEach(goal => {
      const deadline = new Date(goal.deadline);
      const daysUntilDeadline = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (daysUntilDeadline <= 30 && daysUntilDeadline > 0) {
        newInsights.push({
          title: "Approaching Deadline",
          description: `${goal.title} is due in ${daysUntilDeadline} days. Keep pushing!`,
          type: "warning"
        });
      }
    });

    // Check for good progress
    goals.forEach(goal => {
      const progress = (goal.currentAmount / goal.amount) * 100;
      if (progress >= 75) {
        newInsights.push({
          title: "Great Progress!",
          description: `You're ${Math.round(progress)}% towards your ${goal.title} goal!`,
          type: "success"
        });
      }
    });

    setInsights(newInsights);
  };

  const handleAddGoal = async () => {
    if (!user?.uid) return;

    // Validate required fields
    if (!newGoal.title?.trim()) {
      toast.error("Please enter a goal title");
      return;
    }
    if (!newGoal.amount || newGoal.amount <= 0) {
      toast.error("Please enter a valid target amount");
      return;
    }
    if (!newGoal.deadline) {
      toast.error("Please select a deadline");
      return;
    }

    try {
      const goalData = {
        ...newGoal,
        createdAt: new Date().toISOString(),
      };

      const goalRef = await addDoc(collection(db, "users", user.uid, "goals"), goalData);

      const newGoalWithId = {
        id: goalRef.id,
        ...goalData
      } as Goal;

      setGoals(prev => [...prev, newGoalWithId]);
      setNewGoal({
        type: "savings" as const,
        amount: 0,
        currentAmount: 0,
        deadline: new Date().toISOString(),
        priority: "medium",
        title: "",
      });
      setShowNewGoalDialog(false);
      toast.success("Goal added successfully");
      generateInsights([...goals, newGoalWithId]);
    } catch (error) {
      console.error("Error adding goal:", error);
      toast.error("Failed to add goal");
    }
  };

  const handleUpdateProgress = async (goalId: string, newAmount: number) => {
    if (!user?.uid) return;

    try {
      await updateDoc(doc(db, "users", user.uid, "goals", goalId), {
        currentAmount: newAmount
      });

      setGoals(prev => prev.map(g => 
        g.id === goalId ? { ...g, currentAmount: newAmount } : g
      ));
      toast.success("Progress updated successfully");
      generateInsights(goals.map(g => 
        g.id === goalId ? { ...g, currentAmount: newAmount } : g
      ));
    } catch (error) {
      console.error("Error updating progress:", error);
      toast.error("Failed to update progress");
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (!user?.uid) return;

    try {
      await deleteDoc(doc(db, "users", user.uid, "goals", goalId));
      setGoals(prev => prev.filter(g => g.id !== goalId));
      toast.success("Goal deleted successfully");
      generateInsights(goals.filter(g => g.id !== goalId));
    } catch (error) {
      console.error("Error deleting goal:", error);
      toast.error("Failed to delete goal");
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "text-red-500";
      case "medium": return "text-yellow-500";
      case "low": return "text-green-500";
      default: return "text-gray-500";
    }
  };

  const getGoalTypeIcon = (type: string) => {
    switch (type) {
      case "savings": return "💰";
      case "debt": return "💳";
      case "emergency": return "🚨";
      case "purchase": return "🛍️";
      default: return "🎯";
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-100">
        <DashboardSidebar />
        <div className="flex-1 p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2].map((i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#f8fafc] dark:bg-gray-900">
      <DashboardSidebar />
      <div className="flex-1 p-8 overflow-y-auto bg-gradient-to-b from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Financial Goals</h1>
          <StyledDialog 
            open={showNewGoalDialog} 
            onOpenChange={(open) => {
              setShowNewGoalDialog(open);
              if (!open) {
                setNewGoal({
                  type: "savings" as const,
                  amount: 0,
                  currentAmount: 0,
                  deadline: new Date().toISOString(),
                  priority: "medium",
                  title: "",
                });
                setDate(undefined);
              }
            }}
            title="Add New Goal"
            trigger={
              <Button 
                className="bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl"
                onClick={() => setShowNewGoalDialog(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Goal
              </Button>
            }
          >
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Goal Title</Label>
                <Input
                  placeholder="Enter goal title"
                  value={newGoal.title}
                  onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                  className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div className="space-y-2">
                <Label>Goal Type</Label>
                <Select
                  value={newGoal.type}
                  onValueChange={(value) => setNewGoal({ ...newGoal, type: value as Goal["type"] })}
                >
                  <SelectTrigger className="bg-white/50 dark:bg-gray-800/50 border-gray-200/50 dark:border-gray-700/50 rounded-xl">
                    <SelectValue placeholder="Select goal type" />
                  </SelectTrigger>
                  <SelectContent className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50 rounded-xl">
                    <SelectItem value="savings">Savings Goal</SelectItem>
                    <SelectItem value="debt">Debt Repayment Goal</SelectItem>
                    <SelectItem value="emergency">Emergency Fund Goal</SelectItem>
                    <SelectItem value="purchase">Purchase Goal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Target Amount</Label>
                <Input
                  type="number"
                  placeholder="Enter target amount"
                  value={newGoal.amount?.toString()}
                  onChange={(e) => setNewGoal({ ...newGoal, amount: parseFloat(e.target.value) || 0 })}
                  className="bg-white/50 dark:bg-gray-800/50 border-gray-200/50 dark:border-gray-700/50 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label>Deadline</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal bg-white/50 dark:bg-gray-800/50 border-gray-200/50 dark:border-gray-700/50 rounded-xl",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-4 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-700/50" align="start">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={(newDate: Date | undefined) => {
                        setDate(newDate);
                        if (newDate) {
                          setNewGoal(prev => ({ ...prev, deadline: newDate.toISOString() }));
                        }
                      }}
                      disabled={(date: Date) => date < new Date()}
                      fromDate={new Date()}
                      className="rounded-lg border-none bg-transparent"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>Priority Level</Label>
                <Select
                  value={newGoal.priority}
                  onValueChange={(value) => setNewGoal({ ...newGoal, priority: value as Goal["priority"] })}
                >
                  <SelectTrigger className="bg-white/50 dark:bg-gray-800/50 border-gray-200/50 dark:border-gray-700/50 rounded-xl">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50 rounded-xl">
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={handleAddGoal}
                className="bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl w-full"
              >
                Add Goal
              </Button>
            </div>
          </StyledDialog>
        </div>

        {/* Goals Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {goals.map((goal) => (
            <Card key={goal.id} className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-gray-100 dark:border-gray-700 shadow-xl hover:shadow-2xl transition-all duration-300 rounded-2xl">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl filter drop-shadow-sm">{getGoalTypeIcon(goal.type)}</span>
                  <CardTitle className="text-lg font-medium bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">{goal.title}</CardTitle>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={cn(
                    "text-sm font-medium px-2 py-1 rounded-full",
                    goal.priority === "high" && "bg-red-100 text-red-600 dark:bg-red-900/30",
                    goal.priority === "medium" && "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30",
                    goal.priority === "low" && "bg-green-100 text-green-600 dark:bg-green-900/30"
                  )}>
                    {goal.priority.charAt(0).toUpperCase() + goal.priority.slice(1)}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 hover:text-red-600 transition-colors"
                    onClick={() => handleDeleteGoal(goal.id)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium text-blue-600 dark:text-blue-400">
                        ₹{goal.currentAmount.toLocaleString()} / ₹{goal.amount.toLocaleString()}
                      </span>
                    </div>
                    <Progress 
                      value={(goal.currentAmount / goal.amount) * 100} 
                      className="h-2 shadow-sm rounded-full bg-blue-100 dark:bg-blue-900/30"
                    />
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Deadline</span>
                    <span className="font-medium text-blue-600 dark:text-blue-400">
                      {format(new Date(goal.deadline), "PPP")}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Input
                      type="number"
                      placeholder="Update progress"
                      value={goal.currentAmount.toString()}
                      onChange={(e) => handleUpdateProgress(goal.id, parseFloat(e.target.value) || 0)}
                      className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500/20"
                    />
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" size="icon" className="hover:bg-blue-50 dark:hover:bg-blue-900/20">
                            <AlertCircle className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 shadow-xl rounded-xl">
                          <p>Update your progress towards this goal</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Insights Section */}
        <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-gray-100 dark:border-gray-700 shadow-xl hover:shadow-2xl transition-all duration-300 rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg font-medium bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">Goal Insights & Tips</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {insights.map((insight, index) => (
                <div
                  key={index}
                  className={cn(
                    "p-4 rounded-xl border backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300",
                    insight.type === "warning" && "bg-yellow-50/80 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-700/30",
                    insight.type === "success" && "bg-green-50/80 border-green-200 dark:bg-green-900/20 dark:border-green-700/30",
                    insight.type === "tip" && "bg-blue-50/80 border-blue-200 dark:bg-blue-900/20 dark:border-blue-700/30"
                  )}
                >
                  <div className="flex items-start space-x-2">
                    <Lightbulb className={cn(
                      "h-5 w-5 mt-0.5 filter drop-shadow",
                      insight.type === "warning" && "text-yellow-500",
                      insight.type === "success" && "text-green-500",
                      insight.type === "tip" && "text-blue-500"
                    )} />
                    <div>
                      <h3 className="font-medium">{insight.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{insight.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 