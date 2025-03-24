'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import Image from 'next/image';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const router = useRouter();
  const { signIn, signInWithGoogle, resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    setError('');
    setLoading(true);

    try {
      await signIn(email, password);
      router.push('/dashboard');
    } catch (error: any) {
      setError(error.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      router.push('/dashboard');
    } catch (error: any) {
      setError(error.message || 'Failed to sign in with Google');
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    try {
      await resetPassword(email);
      setResetSent(true);
      setError('');
    } catch (error: any) {
      setError(error.message || 'Failed to send reset email');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] dark:bg-dark-900 p-4">
      <div className="w-full max-w-[400px] bg-white dark:bg-dark-800 rounded-[24px] shadow-xl p-8">
        <h1 className="text-[28px] font-semibold text-center text-gray-900 dark:text-white mb-8">
          Sign in to your account
        </h1>

        <div className="space-y-6">
          <button
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white border-none rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
          >
            <Image
              src="/google.svg"
              alt="Google"
              width={20}
              height={20}
              className="w-5 h-5 bg-white rounded-full p-1"
            />
            <span className="text-white text-[15px] font-[Poppins] font-semibold">
              Sign in with Google
            </span>
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white dark:bg-dark-800 text-gray-500 dark:text-gray-400">
                or
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  <span className="text-gray-400">@</span>
                </div>
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-black placeholder-gray-400"
                />
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  type="password"
                  placeholder="Enter the password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-black placeholder-gray-400"
                />
              </div>
            </div>

            {error && (
              <div className="text-red-500 text-sm text-center">{error}</div>
            )}

            {resetSent && (
              <div className="text-green-500 text-sm text-center">
                Password reset email sent! Please check your inbox.
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#4f46e5] hover:bg-[#4338ca] text-white text-[15px] font-[Poppins] font-semibold rounded-xl transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Log in'}
            </button>

            <button
              type="button"
              onClick={handleForgotPassword}
              className="w-full text-sm text-[#4f46e5] hover:text-[#4338ca] dark:text-blue-400 dark:hover:text-blue-300"
            >
              Forgot your password?
            </button>
          </form>
        </div>

        <p className="mt-8 text-center text-[15px] text-gray-500 dark:text-gray-400">
          Don't have an account?{' '}
          <Link
            href="/signup"
            className="text-[#4f46e5] hover:text-[#4338ca] dark:text-blue-400 dark:hover:text-blue-300 font-[Poppins] font-semibold"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
} 