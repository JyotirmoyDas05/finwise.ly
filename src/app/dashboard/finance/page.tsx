"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { db } from "@/app/lib/firebase";
import { doc, getDoc, updateDoc, collection, addDoc, query, where, getDocs, deleteDoc } from "firebase/firestore";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Plus, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useRouter } from "next/navigation";
import { StyledDialog } from "@/components/ui/styled-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import EmojiPicker from "emoji-picker-react";
import { Theme } from "emoji-picker-react";

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

interface FinancialOverview {
  netWorth: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  healthScore: number;
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

export default function FinancePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [overview, setOverview] = useState<FinancialOverview>({
    netWorth: 0,
    monthlyIncome: 0,
    monthlyExpenses: 0,
    healthScore: 0,
  });
  const [newBudget, setNewBudget] = useState({
    name: "",
    amount: 0,
    emoji: "💰",
    category: "",
    classification: "need" as "need" | "want",
  });
  const [newTransaction, setNewTransaction] = useState({
    type: "expense" as "income" | "expense",
    amount: 0,
    category: "",
    description: "",
  });
  const [showBudgetDialog, setShowBudgetDialog] = useState(false);
  const [showTransactionDialog, setShowTransactionDialog] = useState(false);
  const [showNewBudgetDialog, setShowNewBudgetDialog] = useState(false);
  const [showNewTransactionDialog, setShowNewTransactionDialog] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showIncomeDialog, setShowIncomeDialog] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [showEditBudgetDialog, setShowEditBudgetDialog] = useState(false);

  useEffect(() => {
    if (!user?.uid) {
      router.push("/login");
      return;
    }

    fetchFinancialData();
  }, [user, router]);

  useEffect(() => {
    if (!showNewBudgetDialog) {
      setShowEmojiPicker(false);
    }
  }, [showNewBudgetDialog]);

  const fetchFinancialData = async () => {
    try {
      const userDoc = await getDoc(doc(db, "users", user!.uid));
      if (!userDoc.exists()) {
        router.push("/profile-setup");
        return;
      }

      // Fetch budgets
      const budgetsQuery = query(collection(db, "budgets"), where("userId", "==", user!.uid));
      const budgetsSnapshot = await getDocs(budgetsQuery);
      const budgetsData = budgetsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Budget[];
      setBudgets(budgetsData);

      // Fetch transactions
      const transactionsQuery = query(collection(db, "transactions"), where("userId", "==", user!.uid));
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
      
      // Calculate health score (simple implementation)
      const healthScore = calculateHealthScore(budgetsData, transactionsData);

      setOverview({
        netWorth,
        monthlyIncome,
        monthlyExpenses,
        healthScore,
      });
    } catch (error) {
      console.error("Error fetching financial data:", error);
      toast.error("Failed to load financial data");
    } finally {
      setLoading(false);
    }
  };

  const calculateHealthScore = (budgets: Budget[], transactions: Transaction[]): number => {
    // Simple health score calculation based on:
    // 1. Budget utilization (40%)
    // 2. Income to expense ratio (30%)
    // 3. Savings rate (30%)
    
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

  const handleAddBudget = async () => {
    if (!user?.uid) return;

    try {
      const budgetRef = await addDoc(collection(db, "budgets"), {
        ...newBudget,
        userId: user.uid,
        spent: 0,
        createdAt: new Date().toISOString(),
      });

      setBudgets(prev => [...prev, { id: budgetRef.id, ...newBudget, spent: 0 }]);
      setNewBudget({ name: "", amount: 0, emoji: "💰", category: "", classification: "need" });
      setShowBudgetDialog(false);
      toast.success("Budget added successfully");
    } catch (error) {
      console.error("Error adding budget:", error);
      toast.error("Failed to add budget");
    }
  };

  const handleAddTransaction = async () => {
    if (!user?.uid) return;

    try {
      const transactionRef = await addDoc(collection(db, "transactions"), {
        ...newTransaction,
        userId: user.uid,
        date: new Date().toISOString(),
      });

      setTransactions(prev => [...prev, { id: transactionRef.id, ...newTransaction, date: new Date().toISOString() }]);
      
      // Update budget spent amount
      if (newTransaction.type === "expense") {
        const budget = budgets.find(b => b.category === newTransaction.category);
        if (budget) {
          await updateDoc(doc(db, "budgets", budget.id), {
            spent: budget.spent + newTransaction.amount
          });
          setBudgets(prev => prev.map(b => 
            b.id === budget.id 
              ? { ...b, spent: b.spent + newTransaction.amount }
              : b
          ));
        }
      }

      setNewTransaction({ type: "expense", amount: 0, category: "", description: "" });
      setShowTransactionDialog(false);
      toast.success("Transaction added successfully");
      fetchFinancialData(); // Refresh overview
    } catch (error) {
      console.error("Error adding transaction:", error);
      toast.error("Failed to add transaction");
    }
  };

  const getBudgetStatusColor = (spent: number, amount: number) => {
    const percentage = (spent / amount) * 100;
    if (percentage >= 90) return "bg-red-500";
    if (percentage >= 70) return "bg-yellow-500";
    return "bg-green-500";
  };

  const handleEditBudget = async () => {
    if (!user?.uid || !editingBudget) return;

    try {
      await updateDoc(doc(db, "budgets", editingBudget.id), {
        name: editingBudget.name,
        amount: editingBudget.amount,
        emoji: editingBudget.emoji,
        category: editingBudget.category,
      });

      setBudgets(prev => prev.map(b => 
        b.id === editingBudget.id ? editingBudget : b
      ));
      setShowEditBudgetDialog(false);
      setEditingBudget(null);
      toast.success("Budget updated successfully");
    } catch (error) {
      console.error("Error updating budget:", error);
      toast.error("Failed to update budget");
    }
  };

  const handleDeleteBudget = async (budgetId: string) => {
    if (!user?.uid) return;

    try {
      await deleteDoc(doc(db, "budgets", budgetId));
      setBudgets(prev => prev.filter(b => b.id !== budgetId));
      toast.success("Budget deleted successfully");
      fetchFinancialData(); // Refresh all financial data including monthly expenses
    } catch (error) {
      console.error("Error deleting budget:", error);
      toast.error("Failed to delete budget");
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-100">
        <DashboardSidebar />
        <div className="flex-1 p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
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
        <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">My Finance</h1>

        {/* Financial Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-gray-100 dark:border-gray-700 shadow-xl hover:shadow-2xl transition-all duration-300 rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Net Worth</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                ₹{overview.netWorth.toLocaleString()}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-gray-100 dark:border-gray-700 shadow-xl hover:shadow-2xl transition-all duration-300 rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Income</CardTitle>
              <StyledDialog 
                open={showIncomeDialog} 
                onOpenChange={setShowIncomeDialog} 
                title="Add Income"
                trigger={
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="hover:bg-blue-50 dark:hover:bg-blue-900/20">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                }
              >
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Amount</Label>
                    <Input
                      type="number"
                      value={newTransaction.amount.toString()}
                      onChange={(e) => setNewTransaction(prev => ({
                        ...prev,
                        amount: parseFloat(e.target.value) || 0,
                        type: "income"
                      }))}
                      className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Input
                      value={newTransaction.description}
                      onChange={(e) => setNewTransaction(prev => ({
                        ...prev,
                        description: e.target.value
                      }))}
                      className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  <Button 
                    onClick={() => {
                      handleAddTransaction();
                      setShowIncomeDialog(false);
                    }}
                    className="bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl w-full"
                  >
                    Add Income
                  </Button>
                </div>
              </StyledDialog>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{overview.monthlyIncome.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-gray-100 dark:border-gray-700 shadow-xl hover:shadow-2xl transition-all duration-300 rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{overview.monthlyExpenses.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-gray-100 dark:border-gray-700 shadow-xl hover:shadow-2xl transition-all duration-300 rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Financial Health Score</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview.healthScore.toFixed(1)}%</div>
              <Progress value={overview.healthScore} className="mt-2" />
            </CardContent>
          </Card>
        </div>

        {/* Monthly Budget Tracking */}
        <Card className="mb-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-gray-100 dark:border-gray-700 shadow-xl hover:shadow-2xl transition-all duration-300 rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Monthly Budget Tracking</CardTitle>
            <StyledDialog 
              open={showNewBudgetDialog} 
              onOpenChange={setShowNewBudgetDialog} 
              title="Add New Budget Category"
              trigger={
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl">
                    Add New Category
                  </Button>
                </DialogTrigger>
              }
            >
              <div className="space-y-4">
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex-1">
                    <Label>Category Name</Label>
                    <Input
                      placeholder="Category Name"
                      value={newBudget.category}
                      onClick={() => setShowEmojiPicker(false)}
                      onChange={(e) => setNewBudget({ ...newBudget, category: e.target.value })}
                      className="bg-white/50 dark:bg-gray-800/50 border-gray-200/50 dark:border-gray-700/50 rounded-xl mt-2"
                    />
                  </div>
                  <div className="relative">
                    <Label>Emoji</Label>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-12 h-12 text-2xl flex items-center justify-center rounded-full mt-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowEmojiPicker(!showEmojiPicker);
                      }}
                    >
                      {newBudget.emoji}
                    </Button>
                    {showEmojiPicker && (
                      <div className="absolute z-50 left-full ml-2 top-0">
                        <EmojiPicker
                          onEmojiClick={(emojiData) => {
                            setNewBudget({ ...newBudget, emoji: emojiData.emoji });
                            setShowEmojiPicker(false);
                          }}
                          width={300}
                          height={400}
                          theme={Theme.LIGHT}
                          searchPlaceholder="Search emoji..."
                          previewConfig={{
                            showPreview: false
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Classification</Label>
                  <Select
                    value={newBudget.classification}
                    onValueChange={(value) => setNewBudget({ ...newBudget, classification: value as "need" | "want" })}
                  >
                    <SelectTrigger className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50 rounded-xl shadow-sm">
                      <SelectValue placeholder="Select classification" />
                    </SelectTrigger>
                    <SelectContent className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50 rounded-xl shadow-lg">
                      <SelectItem value="need">Need</SelectItem>
                      <SelectItem value="want">Want</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Budget Amount</Label>
                  <Input
                    type="number"
                    placeholder="Budget Amount"
                    value={newBudget.amount.toString()}
                    onClick={() => setShowEmojiPicker(false)}
                    onChange={(e) => setNewBudget({ ...newBudget, amount: parseFloat(e.target.value) || 0 })}
                    className="bg-white/50 dark:bg-gray-800/50 border-gray-200/50 dark:border-gray-700/50 rounded-xl"
                  />
                </div>
                <Button 
                  onClick={handleAddBudget}
                  className="bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white rounded-full w-full"
                >
                  Add Budget
                </Button>
              </div>
            </StyledDialog>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {budgets.map((budget) => (
                <div key={budget.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span>{budget.emoji}</span>
                      <span className="font-medium">{budget.name || budget.category}</span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-sm text-muted-foreground">
                        ₹{budget.spent.toLocaleString()} / ₹{budget.amount.toLocaleString()}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditingBudget(budget);
                          setShowEditBudgetDialog(true);
                        }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteBudget(budget.id)}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                      </Button>
                    </div>
                  </div>
                  <Progress 
                    value={(budget.spent / budget.amount) * 100} 
                    className={`h-2 ${getBudgetStatusColor(budget.spent, budget.amount)} shadow-sm rounded-full`}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Transaction Overview */}
        <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-gray-100 dark:border-gray-700 shadow-xl hover:shadow-2xl transition-all duration-300 rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Transaction Overview</CardTitle>
            <StyledDialog 
              open={showNewTransactionDialog} 
              onOpenChange={setShowNewTransactionDialog} 
              title="Add New Transaction"
              trigger={
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl">
                    Add New Transaction
                  </Button>
                </DialogTrigger>
              }
            >
              <div className="space-y-4">
                <Input
                  placeholder="Description"
                  value={newTransaction.description}
                  onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })}
                  className="bg-white/50 dark:bg-gray-800/50 border-gray-200/50 dark:border-gray-700/50 rounded-xl"
                />
                <Input
                  type="number"
                  placeholder="Amount"
                  value={newTransaction.amount.toString()}
                  onChange={(e) => setNewTransaction({ ...newTransaction, amount: parseFloat(e.target.value) || 0 })}
                  className="bg-white/50 dark:bg-gray-800/50 border-gray-200/50 dark:border-gray-700/50 rounded-xl"
                />
                <Select
                  value={newTransaction.type}
                  onValueChange={(value) => setNewTransaction({ ...newTransaction, type: value as 'income' | 'expense' })}
                >
                  <SelectTrigger className="bg-white/50 dark:bg-gray-800/50 border-gray-200/50 dark:border-gray-700/50 rounded-xl">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50 rounded-xl">
                    <SelectItem value="income">Income</SelectItem>
                    <SelectItem value="expense">Expense</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={newTransaction.category}
                  onValueChange={(value) => setNewTransaction({ ...newTransaction, category: value })}
                >
                  <SelectTrigger className="bg-white/50 dark:bg-gray-800/50 border-gray-200/50 dark:border-gray-700/50 rounded-xl">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50 rounded-xl">
                    {budgets.map((budget) => (
                      <SelectItem key={budget.id} value={budget.category}>
                        {budget.category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button 
                  onClick={handleAddTransaction}
                  className="bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white rounded-full"
                >
                  Add Transaction
                </Button>
              </div>
            </StyledDialog>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Transactions List */}
              <div className="space-y-4">
                <h3 className="font-semibold mb-4">Recent Transactions</h3>
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-4">
                  {transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((transaction, index) => (
                    <div
                      key={transaction.id}
                      className={`flex items-center justify-between p-4 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl border border-gray-100/50 dark:border-gray-700/50 transition-all duration-200
                        ${index === 0 
                          ? "shadow-[0_8px_16px_-6px_rgba(0,0,0,0.1)] hover:shadow-[0_12px_20px_-6px_rgba(0,0,0,0.15)] dark:shadow-[0_8px_16px_-6px_rgba(0,0,0,0.3)] dark:hover:shadow-[0_12px_20px_-6px_rgba(0,0,0,0.4)] hover:bg-white/90 dark:hover:bg-gray-800/90" 
                          : "shadow-[0_2px_4px_-2px_rgba(0,0,0,0.05)] hover:shadow-[0_4px_8px_-4px_rgba(0,0,0,0.1)] dark:shadow-[0_2px_4px_-2px_rgba(0,0,0,0.2)] dark:hover:shadow-[0_4px_8px_-4px_rgba(0,0,0,0.3)] hover:bg-white/70 dark:hover:bg-gray-800/70"
                        }
                        ${index === 0 ? "z-10" : "z-0"}`}
                    >
                      <div className="flex flex-col">
                        <span className={`font-medium text-gray-900 dark:text-gray-100 ${index === 0 ? "text-base" : "text-[15px]"}`}>
                          {transaction.description}
                        </span>
                        <span className={`text-gray-500 dark:text-gray-400 ${index === 0 ? "text-sm" : "text-[13px]"}`}>
                          {transaction.category} • {new Date(transaction.date).toLocaleDateString()}
                        </span>
                      </div>
                      <span className={`font-semibold ${
                        transaction.type === 'income' 
                          ? 'text-emerald-600 dark:text-emerald-400' 
                          : 'text-red-600 dark:text-red-400'
                      } ${index === 0 ? "text-base" : "text-[15px]"}`}>
                        {transaction.type === 'income' ? '+' : '-'}₹{transaction.amount.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Expense Distribution */}
              <div>
                <h3 className="font-semibold mb-4">Expense Distribution</h3>
                <div className="h-[400px] flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={budgets.map(budget => ({
                          name: budget.category,
                          value: budget.spent
                        }))}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        className="drop-shadow-xl"
                        label={({ name, value, percent, cx, cy, midAngle, innerRadius, outerRadius }) => {
                          const RADIAN = Math.PI / 180;
                          const radius = outerRadius + 20;
                          const x = cx + radius * Math.cos(-midAngle * RADIAN);
                          const y = cy + radius * Math.sin(-midAngle * RADIAN);
                          return (
                            <text
                              x={x}
                              y={y}
                              fill="#333"
                              textAnchor={x > cx ? 'start' : 'end'}
                              dominantBaseline="central"
                              className="text-xs"
                            >
                              {`${name}: ₹${value.toLocaleString()}`}
                            </text>
                          );
                        }}
                      >
                        {budgets.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `₹${Number(value).toLocaleString()}`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Edit Budget Dialog */}
        <StyledDialog
          open={showEditBudgetDialog}
          onOpenChange={setShowEditBudgetDialog}
          title="Edit Budget Category"
        >
          {editingBudget && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex-1">
                  <Label>Category Name</Label>
                  <Input
                    placeholder="Category Name"
                    value={editingBudget.category}
                    onClick={() => setShowEmojiPicker(false)}
                    onChange={(e) => setEditingBudget({ ...editingBudget, category: e.target.value })}
                    className="bg-white/50 dark:bg-gray-800/50 border-gray-200/50 dark:border-gray-700/50 rounded-xl mt-2"
                  />
                </div>
                <div className="relative">
                  <Label>Emoji</Label>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-12 h-12 text-2xl flex items-center justify-center rounded-full mt-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowEmojiPicker(!showEmojiPicker);
                    }}
                  >
                    {editingBudget.emoji}
                  </Button>
                  {showEmojiPicker && (
                    <div className="absolute z-50 left-full ml-2 top-0">
                      <EmojiPicker
                        onEmojiClick={(emojiData) => {
                          setEditingBudget({ ...editingBudget, emoji: emojiData.emoji });
                          setShowEmojiPicker(false);
                        }}
                        width={300}
                        height={400}
                        theme={Theme.LIGHT}
                        searchPlaceholder="Search emoji..."
                        previewConfig={{
                          showPreview: false
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Classification</Label>
                <Select
                  value={editingBudget.classification}
                  onValueChange={(value) => setEditingBudget({ ...editingBudget, classification: value as "need" | "want" })}
                >
                  <SelectTrigger className="bg-white/50 dark:bg-gray-800/50 border-gray-200/50 dark:border-gray-700/50 rounded-xl">
                    <SelectValue placeholder="Select classification" />
                  </SelectTrigger>
                  <SelectContent className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50 rounded-xl">
                    <SelectItem value="need">Need</SelectItem>
                    <SelectItem value="want">Want</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Budget Amount</Label>
                <Input
                  type="number"
                  placeholder="Budget Amount"
                  value={editingBudget.amount.toString()}
                  onClick={() => setShowEmojiPicker(false)}
                  onChange={(e) => setEditingBudget({ ...editingBudget, amount: parseFloat(e.target.value) || 0 })}
                  className="bg-white/50 dark:bg-gray-800/50 border-gray-200/50 dark:border-gray-700/50 rounded-xl"
                />
              </div>
              <Button 
                onClick={handleEditBudget}
                className="bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white rounded-full w-full"
              >
                Update Budget
              </Button>
            </div>
          )}
        </StyledDialog>
      </div>
    </div>
  );
} 