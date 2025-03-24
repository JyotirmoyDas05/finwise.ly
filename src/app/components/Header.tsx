'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X, Moon, Sun } from 'lucide-react';
import { useTheme } from './ThemeProvider';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setIsMenuOpen(false);
    }
  };

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled ? 'bg-white/80 dark:bg-dark-900/80 backdrop-blur-lg shadow-lg' : 'bg-transparent'
    }`}>
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="text-2xl font-bold text-dark-900 dark:text-white">
            FinWise.ly
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <button 
              onClick={() => scrollToSection('features')}
              className="font-sans text-base font-semibold text-dark-900 dark:text-white hover:text-green transition-colors"
            >
              Features
            </button>
            <button 
              onClick={() => scrollToSection('how-it-works')}
              className="font-sans text-base font-semibold text-dark-900 dark:text-white hover:text-green transition-colors"
            >
              How It Works
            </button>
            <button 
              onClick={() => scrollToSection('pricing')}
              className="font-sans text-base font-semibold text-dark-900 dark:text-white hover:text-green transition-colors"
            >
              Pricing
            </button>
            <button 
              onClick={() => scrollToSection('contact')}
              className="font-sans text-base font-semibold text-dark-900 dark:text-white hover:text-green transition-colors"
            >
              Contact
            </button>
          </nav>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Theme toggle temporarily disabled
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-full bg-white/80 dark:bg-dark-800/80 backdrop-blur-sm hover:bg-white dark:hover:bg-dark-800 transition-colors shadow-md"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5 text-yellow-500" />
              ) : (
                <Moon className="w-5 h-5 text-gray-700" />
              )}
            </button>
            */}
            <Link 
              href="/login" 
              className="font-sans px-6 py-2 text-base font-semibold text-dark-900 dark:text-white hover:text-green transition-colors"
            >
              Login
            </Link>
            <Link 
              href="/signup" 
              className="font-sans px-6 py-2 text-base font-semibold text-white bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 rounded-md transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
              Sign Up
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-lg bg-white/80 dark:bg-dark-800/80 backdrop-blur-sm hover:bg-white dark:hover:bg-dark-800 transition-colors shadow-md"
          >
            {isMenuOpen ? (
              <X className="w-6 h-6 text-dark-900 dark:text-white" />
            ) : (
              <Menu className="w-6 h-6 text-dark-900 dark:text-white" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 bg-white/95 dark:bg-dark-900/95 backdrop-blur-lg rounded-lg shadow-xl mt-2">
            <nav className="flex flex-col space-y-4">
              <button 
                onClick={() => scrollToSection('features')}
                className="font-sans text-base font-semibold text-dark-900 dark:text-white hover:text-green transition-colors px-4 py-2"
              >
                Features
              </button>
              <button 
                onClick={() => scrollToSection('how-it-works')}
                className="font-sans text-base font-semibold text-dark-900 dark:text-white hover:text-green transition-colors px-4 py-2"
              >
                How It Works
              </button>
              <button 
                onClick={() => scrollToSection('pricing')}
                className="font-sans text-base font-semibold text-dark-900 dark:text-white hover:text-green transition-colors px-4 py-2"
              >
                Pricing
              </button>
              <button 
                onClick={() => scrollToSection('contact')}
                className="font-sans text-base font-semibold text-dark-900 dark:text-white hover:text-green transition-colors px-4 py-2"
              >
                Contact
              </button>
              <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>
              {/* Theme toggle temporarily disabled
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="font-sans text-base font-semibold text-dark-900 dark:text-white hover:text-green transition-colors px-4 py-2 flex items-center space-x-2"
              >
                {theme === 'dark' ? (
                  <>
                    <Sun className="w-5 h-5" />
                    <span>Light Mode</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-5 h-5" />
                    <span>Dark Mode</span>
                  </>
                )}
              </button>
              */}
              <Link 
                href="/login" 
                className="font-sans text-base font-semibold text-dark-900 dark:text-white hover:text-green transition-colors px-4 py-2"
              >
                Login
              </Link>
              <Link 
                href="/signup" 
                className="font-sans text-base font-semibold text-white bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 rounded-md transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5 px-4 py-2 text-center"
              >
                Sign Up
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header; 