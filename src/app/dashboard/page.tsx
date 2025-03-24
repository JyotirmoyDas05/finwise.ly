'use client';

import { useAuth } from '../context/AuthContext';
import ProtectedRoute from '../components/ProtectedRoute';

export default function Dashboard() {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-blue-100 dark:from-dark-900 dark:to-dark-800 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/80 dark:bg-dark-800/80 backdrop-blur-lg rounded-2xl shadow-xl p-8">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl font-bold text-dark-900 dark:text-white">
                Welcome, {user?.email}
              </h1>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Logout
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white/50 dark:bg-dark-700/50 p-6 rounded-xl">
                <h2 className="text-xl font-semibold text-dark-900 dark:text-white mb-4">
                  Your Profile
                </h2>
                <p className="text-dark-700 dark:text-gray-300">
                  Email: {user?.email}
                </p>
                <p className="text-dark-700 dark:text-gray-300">
                  Account created: {user?.metadata.creationTime}
                </p>
              </div>
              <div className="bg-white/50 dark:bg-dark-700/50 p-6 rounded-xl">
                <h2 className="text-xl font-semibold text-dark-900 dark:text-white mb-4">
                  Quick Actions
                </h2>
                <div className="space-y-4">
                  <button className="w-full px-4 py-2 bg-green text-white rounded-lg hover:bg-green-600 transition-colors">
                    View Transactions
                  </button>
                  <button className="w-full px-4 py-2 bg-green text-white rounded-lg hover:bg-green-600 transition-colors">
                    Set Budget
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
} 