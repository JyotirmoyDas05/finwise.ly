'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"

interface ProfileData {
  name: string;
  monthlyIncome: string;
  monthlyExpenses: string;
  selectedGoals: string[];
  selectedCategories: string[];
  aiPreference: 'detailed' | 'quick';
  photoURL: string;
}

interface FirebaseError {
  code?: string;
  message: string;
}

const financialCategories = [
  { id: 'business', label: 'Business' },
  { id: 'personal', label: 'Personal Finance' },
  { id: 'investments', label: 'Investments' },
  { id: 'crypto', label: 'Cryptocurrency' },
  { id: 'stocks', label: 'Stocks & Trading' },
  { id: 'realestate', label: 'Real Estate' },
];

const financialGoals = [
  { id: 'saving', label: 'Saving' },
  { id: 'investing', label: 'Investing' },
  { id: 'debt', label: 'Debt Repayment' },
  { id: 'budgeting', label: 'Budgeting' },
  { id: 'retirement', label: 'Retirement Planning' },
];

export default function ProfileSetup() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewImage, setPreviewImage] = useState<string>('');
  const [profileData, setProfileData] = useState<ProfileData>({
    name: '',
    monthlyIncome: '',
    monthlyExpenses: '',
    selectedGoals: [],
    selectedCategories: [],
    aiPreference: 'detailed',
    photoURL: '',
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

  const triggerFileInput = () => {
    fileInputRef.current?.click();
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
      await setDoc(doc(db, 'userProfiles', user.uid), {
        ...profileData,
        userId: user.uid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      router.push('/dashboard');
    } catch (error: unknown) {
      console.error('Error saving profile:', error);
      let errorMessage = 'Failed to save profile. Please try again.';
      
      const firebaseError = error as FirebaseError;
      if (firebaseError.code === 'permission-denied') {
        errorMessage = 'Permission denied. Please make sure you are properly logged in.';
      } else if (firebaseError.code === 'not-found') {
        errorMessage = 'Database not found. Please check your Firebase configuration.';
      } else if (firebaseError.code === 'unauthenticated') {
        errorMessage = 'Your session has expired. Please log in again.';
        router.push('/login');
      }
      
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-[700] font-poppins text-gray-900">Customize Your Profile</h1>
          <p className="mt-2 text-gray-600">Let&apos;s personalize your financial journey</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8 bg-white p-8 rounded-lg shadow">
          {/* Profile Picture Upload */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">Profile Picture</h2>
            <div className="flex flex-col items-center space-y-4">
              <Avatar className="w-32 h-32">
                {previewImage && <AvatarImage src={previewImage} alt="Profile picture" />}
                <AvatarFallback>
                  {profileData.name ? profileData.name.charAt(0).toUpperCase() : 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex items-center space-x-4">
                <Button
                  type="button"
                  onClick={triggerFileInput}
                  variant="outline"
                  className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Change Photo
                </Button>
                {previewImage && (
                  <Button
                    type="button"
                    variant="outline"
                    className="text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50"
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
              <p className="text-sm text-gray-500">
                Upload a profile picture or use your Google profile photo
              </p>
            </div>
          </div>

          {/* Profile Information */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">Profile Information</h2>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Name
              </label>
              <input
                type="text"
                id="name"
                value={profileData.name}
                onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Financial Information */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">Financial Information</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="monthlyIncome" className="block text-sm font-medium text-gray-700">
                  Monthly Income
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input
                    type="number"
                    id="monthlyIncome"
                    value={profileData.monthlyIncome}
                    onChange={(e) => setProfileData(prev => ({ ...prev, monthlyIncome: e.target.value }))}
                    className="pl-7 mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="monthlyExpenses" className="block text-sm font-medium text-gray-700">
                  Monthly Expenses
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input
                    type="number"
                    id="monthlyExpenses"
                    value={profileData.monthlyExpenses}
                    onChange={(e) => setProfileData(prev => ({ ...prev, monthlyExpenses: e.target.value }))}
                    className="pl-7 mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Financial Goals */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">Financial Goals</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {financialGoals.map((goal) => (
                <label key={goal.id} className="relative flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      type="checkbox"
                      checked={profileData.selectedGoals.includes(goal.id)}
                      onChange={(e) => {
                        const goals = e.target.checked
                          ? [...profileData.selectedGoals, goal.id]
                          : profileData.selectedGoals.filter(g => g !== goal.id);
                        setProfileData(prev => ({ ...prev, selectedGoals: goals }));
                      }}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <span className="text-gray-700">{goal.label}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Financial Categories */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">Preferred Financial Categories</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {financialCategories.map((category) => (
                <label key={category.id} className="relative flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      type="checkbox"
                      checked={profileData.selectedCategories.includes(category.id)}
                      onChange={(e) => {
                        const categories = e.target.checked
                          ? [...profileData.selectedCategories, category.id]
                          : profileData.selectedCategories.filter(c => c !== category.id);
                        setProfileData(prev => ({ ...prev, selectedCategories: categories }));
                      }}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <span className="text-gray-700">{category.label}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* AI Preferences */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">AI Assistant Preferences</h2>
            <div className="space-y-2">
              <label className="relative flex items-start">
                <div className="flex items-center h-5">
                  <input
                    type="radio"
                    checked={profileData.aiPreference === 'detailed'}
                    onChange={() => setProfileData(prev => ({ ...prev, aiPreference: 'detailed' }))}
                    className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <span className="text-gray-700">Detailed Financial Advice</span>
                </div>
              </label>
              <label className="relative flex items-start">
                <div className="flex items-center h-5">
                  <input
                    type="radio"
                    checked={profileData.aiPreference === 'quick'}
                    onChange={() => setProfileData(prev => ({ ...prev, aiPreference: 'quick' }))}
                    className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <span className="text-gray-700">Quick Tips and Summaries</span>
                </div>
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-5">
            <button
              type="submit"
              disabled={loading}
              className="group relative overflow-hidden rounded-full bg-gradient-to-r from-blue-600 to-green-500 hover:from-blue-700 hover:to-green-600 px-14 py-4 text-lg w-full transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="absolute bottom-0 left-0 h-48 w-full origin-bottom translate-y-full transform overflow-hidden rounded-full bg-white/20 transition-all duration-300 ease-out group-hover:translate-y-14"></span>
              <span className="font-[500] font-inter text-white text-lg relative z-10">
                {loading ? 'Saving...' : 'Complete Profile Setup'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 