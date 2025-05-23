'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Menu, X, Moon, Sun } from 'lucide-react';
import { useTheme } from './ThemeProvider';
import { gsap } from 'gsap';
import { AnimatePresence, motion } from 'framer-motion';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { theme, setTheme } = useTheme();
  
  const headerRef = useRef<HTMLElement>(null);
  const logoRef = useRef<HTMLAnchorElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const authButtonsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initial header animation
    const ctx = gsap.context(() => {
      gsap.set([logoRef.current, navRef.current, authButtonsRef.current], {
        opacity: 0,
        y: -20,
      });

      const tl = gsap.timeline({ delay: 0.2 });
      
      tl.to(logoRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: 'power2.out',
      })
      .to(navRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: 'power2.out',
      }, '-=0.6')
      .to(authButtonsRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: 'power2.out',
      }, '-=0.4');

      // Logo hover animation
      const logo = logoRef.current;
      if (logo) {
        logo.addEventListener('mouseenter', () => {
          gsap.to(logo, {
            scale: 1.05,
            duration: 0.3,
            ease: 'power2.out',
          });
        });

        logo.addEventListener('mouseleave', () => {
          gsap.to(logo, {
            scale: 1,
            duration: 0.3,
            ease: 'power2.out',
          });
        });
      }

      // Navigation items hover animations
      const navItems = navRef.current?.querySelectorAll('button');
      if (navItems) {
        navItems.forEach(item => {
          item.addEventListener('mouseenter', () => {
            gsap.to(item, {
              y: -2,
              duration: 0.2,
              ease: 'power2.out',
            });
          });

          item.addEventListener('mouseleave', () => {
            gsap.to(item, {
              y: 0,
              duration: 0.2,
              ease: 'power2.out',
            });
          });
        });
      }

      // Auth buttons hover animations
      const authButtons = authButtonsRef.current?.querySelectorAll('a');
      if (authButtons) {
        authButtons.forEach(button => {
          button.addEventListener('mouseenter', () => {
            gsap.to(button, {
              scale: 1.05,
              y: -2,
              duration: 0.2,
              ease: 'power2.out',
            });
          });

          button.addEventListener('mouseleave', () => {
            gsap.to(button, {
              scale: 1,
              y: 0,
              duration: 0.2,
              ease: 'power2.out',
            });
          });
        });
      }

    }, headerRef);

    return () => ctx.revert();
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMenuOpen]);

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
    <header 
      ref={headerRef}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-white/90 dark:bg-dark-900/90 backdrop-blur-lg shadow-lg' : 'bg-transparent'
      }`}
    >
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link 
            ref={logoRef}
            href="/" 
            className="text-xl md:text-2xl font-bold text-dark-900 dark:text-white cursor-pointer"
          >
            FinWise.ly
          </Link>

          {/* Desktop Navigation */}
          <nav ref={navRef} className="hidden md:flex items-center space-x-8">
            <button 
              onClick={() => scrollToSection('features')}
              className="font-sans text-base font-semibold text-dark-900 dark:text-white hover:text-green transition-colors py-2"
            >
              Features
            </button>
            <button 
              onClick={() => scrollToSection('how-it-works')}
              className="font-sans text-base font-semibold text-dark-900 dark:text-white hover:text-green transition-colors py-2"
            >
              How It Works
            </button>
            <button 
              onClick={() => scrollToSection('pricing')}
              className="font-sans text-base font-semibold text-dark-900 dark:text-white hover:text-green transition-colors py-2"
            >
              Pricing
            </button>
            <button 
              onClick={() => scrollToSection('contact')}
              className="font-sans text-base font-semibold text-dark-900 dark:text-white hover:text-green transition-colors py-2"
            >
              Contact
            </button>
          </nav>

          {/* Desktop Auth Buttons */}
          <div ref={authButtonsRef} className="hidden md:flex items-center space-x-4">
            <Link 
              href="/login" 
              className="font-sans px-6 py-2 text-base font-semibold text-dark-900 dark:text-white hover:text-green transition-colors"
            >
              Login
            </Link>
            <Link 
              href="/signup" 
              className="font-sans px-6 py-2 text-base font-semibold text-white bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              Sign Up
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-3 rounded-full bg-white/80 dark:bg-dark-800/80 backdrop-blur-sm hover:bg-white dark:hover:bg-dark-800 transition-colors shadow-md hover:shadow-lg"
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          >
            {isMenuOpen ? (
              <X className="w-6 h-6 text-dark-900 dark:text-white" />
            ) : (
              <Menu className="w-6 h-6 text-dark-900 dark:text-white" />
            )}
          </button>
        </div>

        {/* Mobile Menu - Using AnimatePresence for smoother transitions */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden py-4 bg-white/95 dark:bg-dark-900/95 backdrop-blur-lg rounded-2xl shadow-xl mt-2 border border-gray-200/50 dark:border-gray-800/50"
            >
              <nav className="flex flex-col space-y-2">
                <button 
                  onClick={() => scrollToSection('features')}
                  className="font-sans text-base font-semibold text-dark-900 dark:text-white hover:text-green transition-colors px-6 py-3 hover:bg-gray-50 dark:hover:bg-dark-800/50 rounded-xl mx-4"
                >
                  Features
                </button>
                <button 
                  onClick={() => scrollToSection('how-it-works')}
                  className="font-sans text-base font-semibold text-dark-900 dark:text-white hover:text-green transition-colors px-6 py-3 hover:bg-gray-50 dark:hover:bg-dark-800/50 rounded-xl mx-4 text-center"
                >
                  How It Works
                </button>
                <button 
                  onClick={() => scrollToSection('pricing')}
                  className="font-sans text-base font-semibold text-dark-900 dark:text-white hover:text-green transition-colors px-6 py-3 hover:bg-gray-50 dark:hover:bg-dark-800/50 rounded-xl mx-4 text-center"
                >
                  Pricing
                </button>
                <button 
                  onClick={() => scrollToSection('contact')}
                  className="font-sans text-base font-semibold text-dark-900 dark:text-white hover:text-green transition-colors px-6 py-3 hover:bg-gray-50 dark:hover:bg-dark-800/50 rounded-xl mx-4 text-center"
                >
                  Contact
                </button>
                <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>
                <Link 
                  href="/login" 
                  className="font-sans text-base font-semibold text-dark-900 dark:text-white hover:text-green transition-colors px-6 py-3 hover:bg-gray-50 dark:hover:bg-dark-800/50 rounded-xl mx-4 text-center"
                >
                  Login
                </Link>
                <Link 
                  href="/signup" 
                  className="mx-4 font-sans text-base font-semibold text-white bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl py-3 px-6 text-center"
                >
                  Sign Up
                </Link>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
};

export default Header;