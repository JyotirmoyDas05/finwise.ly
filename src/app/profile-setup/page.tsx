'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface ProfileData {
  name: string;
  monthlyIncome: number;
  monthlyExpenses: {
    housing: number;
    food: number;
    transportation: number;
    utilities: number;
    healthcare: number;
    entertainment: number;
  };
  expenseBreakdown: {
    needs: number;
    wants: number;
    savings: number;
  };
  goals: {
    name: string;
    target: number;
    current: number;
  }[];
  photoURL: string;
  preferences: {
    categories: string[];
    aiPreference: 'detailed' | 'quick';
  };
}

interface FirebaseError {
  code?: string;
  message: string;
}

const expenseCategories = [
  { id: 'housing', label: 'Housing', isNeed: true },
  { id: 'food', label: 'Food', isNeed: true },
  { id: 'transportation', label: 'Transportation', isNeed: true },
  { id: 'utilities', label: 'Utilities', isNeed: true },
  { id: 'healthcare', label: 'Healthcare', isNeed: true },
  { id: 'entertainment', label: 'Entertainment', isNeed: false },
];

const financialGoals = [
  { id: 'emergency_fund', label: 'Emergency Fund', defaultTarget: 50000 },
  { id: 'savings', label: 'Savings', defaultTarget: 100000 },
  { id: 'investment', label: 'Investment', defaultTarget: 100000 },
  { id: 'debt_repayment', label: 'Debt Repayment', defaultTarget: 50000 },
  { id: 'retirement', label: 'Retirement', defaultTarget: 1000000 },
];

export default function ProfileSetup() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewImage, setPreviewImage] = useState<string>('');
  
  const [profileData, setProfileData] = useState<ProfileData>({
    name: '',
    monthlyIncome: 0,
    monthlyExpenses: {
      housing: 0,
      food: 0,
      transportation: 0,
      utilities: 0,
      healthcare: 0,
      entertainment: 0,
    },
    expenseBreakdown: {
      needs: 50, // Default 50-30-20 rule
      wants: 30,
      savings: 20,
    },
    goals: [
      {
        name: 'Emergency Fund',
        target: 50000,
        current: 0,
      }
    ],
    photoURL: '',
    preferences: {
      categories: [],
      aiPreference: 'detailed',
    },
  });

  useEffect(() => {
    if (!user) {
      router.push('/login');
    } else {
      setProfileData(prev => ({
        ...prev,
        name: user.displayName || '',
        photoURL: user.photoURL || '',
      }));
      if (user.photoURL) {
        setPreviewImage(user.photoURL);
      }
    }
  }, [user, router]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setPreviewImage(base64String);
        setProfileData(prev => ({ ...prev, photoURL: base64String }));
      };
      reader.readAsDataURL(file);
    }
  };

  const calculateExpenseBreakdown = (expenses: ProfileData['monthlyExpenses']) => {
    const totalExpenses = Object.values(expenses).reduce((sum, expense) => sum + expense, 0);
    const needsExpenses = expenseCategories
      .filter(cat => cat.isNeed)
      .reduce((sum, cat) => sum + expenses[cat.id as keyof typeof expenses], 0);
    
    const wantsExpenses = totalExpenses - needsExpenses;
    const savingsAmount = profileData.monthlyIncome - totalExpenses;

    const total = profileData.monthlyIncome;
    return {
      needs: Math.round((needsExpenses / total) * 100),
      wants: Math.round((wantsExpenses / total) * 100),
      savings: Math.round((savingsAmount / total) * 100),
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert('You must be logged in to save your profile');
      router.push('/login');
      return;
    }

    try {
      setLoading(true);

      // Calculate expense breakdown
      const expenseBreakdown = calculateExpenseBreakdown(profileData.monthlyExpenses);
      
      // Prepare budget comparison data
      const totalExpenses = Object.values(profileData.monthlyExpenses).reduce((sum, expense) => sum + expense, 0);
      const budgetComparisonData = {
        last_week: {
          planned: Math.round(totalExpenses / 4), // Weekly budget
          actual: Math.round((totalExpenses / 4) * 0.95), // Assuming 95% spent
        },
        last_month: {
          planned: totalExpenses,
          actual: Math.round(totalExpenses * 0.95),
        },
        last_3_months: {
          planned: totalExpenses * 3,
          actual: Math.round(totalExpenses * 3 * 0.95),
        },
        last_6_months: {
          planned: totalExpenses * 6,
          actual: Math.round(totalExpenses * 6 * 0.95),
        },
        all_time: {
          planned: totalExpenses * 12, // Yearly
          actual: Math.round(totalExpenses * 12 * 0.95),
        },
      };

      // Create user document with dashboard structure
      await setDoc(doc(db, 'users', user.uid), {
        profile: {
          name: profileData.name,
          image: profileData.photoURL || '/placeholder.svg',
        },
        finances: {
          income: {
            monthly: profileData.monthlyIncome,
            annual: profileData.monthlyIncome * 12,
          },
          expenses: {
            monthly: totalExpenses,
            breakdown: profileData.monthlyExpenses,
            categories: Object.entries(profileData.monthlyExpenses).map(([category, amount]) => ({
              name: category,
              budgeted: amount,
              actual: Math.round(amount * 0.95), // Initial actual spending (95% of budget)
            })),
          },
          expenseBreakdown: expenseBreakdown,
          goals: profileData.goals,
        },
        budgetComparison: budgetComparisonData,
        settings: {
          categories: profileData.preferences.categories,
          aiPreference: profileData.preferences.aiPreference,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      router.push('/dashboard');
    } catch (error: unknown) {
      console.error('Error saving profile:', error);
      const firebaseError = error as FirebaseError;
      alert(firebaseError.message || 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/40 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground">Complete Your Profile</h1>
          <p className="mt-2 text-muted-foreground">Let&apos;s personalize your financial dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Profile Picture */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center space-y-4">
                <Avatar className="w-32 h-32 ring-2 ring-primary/20 shadow-lg">
                  {previewImage && <AvatarImage src={previewImage} alt="Profile" />}
                  <AvatarFallback>{profileData.name?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
                <div className="flex gap-4">
                  <Button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    className="rounded-xl"
                  >
                    Change Photo
                  </Button>
                  {previewImage && (
                    <Button
                      type="button"
                      variant="destructive"
                      className="rounded-xl"
                      onClick={() => {
                        setPreviewImage('');
                        setProfileData(prev => ({ ...prev, photoURL: '' }));
                      }}
                    >
                      Remove
                    </Button>
                  )}
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  className="hidden"
                />
              </div>
            </CardContent>
          </Card>

          {/* Basic Information */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Basic Information</h2>
                <div>
                  <label className="block text-sm font-medium mb-1">Name</label>
                  <input
                    type="text"
                    value={profileData.name}
                    onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full rounded-xl border-2 p-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Monthly Income</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2">₹</span>
                    <input
                      type="number"
                      value={profileData.monthlyIncome || ''}
                      onChange={(e) => setProfileData(prev => ({ ...prev, monthlyIncome: Number(e.target.value) }))}
                      className="w-full rounded-xl border-2 p-2 pl-8"
                      required
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Monthly Expenses */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Monthly Expenses</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {expenseCategories.map((category) => (
                    <div key={category.id}>
                      <label className="block text-sm font-medium mb-1">{category.label}</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2">₹</span>
                        <input
                          type="number"
                          value={profileData.monthlyExpenses[category.id as keyof typeof profileData.monthlyExpenses] || ''}
                          onChange={(e) => setProfileData(prev => ({
                            ...prev,
                            monthlyExpenses: {
                              ...prev.monthlyExpenses,
                              [category.id]: Number(e.target.value)
                            }
                          }))}
                          className="w-full rounded-xl border-2 p-2 pl-8"
                          required
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Financial Goals */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Financial Goals</h2>
                <div className="grid grid-cols-1 gap-4">
                  {financialGoals.map((goal) => (
                    <div key={goal.id} className="flex items-center gap-4">
                      <input
                        type="checkbox"
                        id={goal.id}
                        checked={profileData.goals.some(g => g.name === goal.label)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setProfileData(prev => ({
                              ...prev,
                              goals: [...prev.goals, { name: goal.label, target: goal.defaultTarget, current: 0 }]
                            }));
                          } else {
                            setProfileData(prev => ({
                              ...prev,
                              goals: prev.goals.filter(g => g.name !== goal.label)
                            }));
                          }
                        }}
                        className="rounded-lg border-2"
                      />
                      <label htmlFor={goal.id} className="flex-1">
                        <span className="font-medium">{goal.label}</span>
                        <div className="text-sm text-muted-foreground">Target: ₹{goal.defaultTarget.toLocaleString()}</div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl py-6 text-lg shadow-lg hover:shadow-xl transition-all"
          >
            {loading ? 'Saving...' : 'Complete Profile Setup'}
          </Button>
        </form>
      </div>
    </div>
  );
} 