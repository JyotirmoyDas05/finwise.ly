'use client';

import React, { useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';

const Hero = () => {
  const textRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Animate the text and image on mount
    if (textRef.current) {
      textRef.current.classList.add('translate-y-0', 'opacity-100');
    }
    if (imageRef.current) {
      imageRef.current.classList.add('translate-y-0', 'opacity-100');
    }
  }, []);

  return (
    <section id="hero" className="py-24 lg:py-32 overflow-hidden bg-gradient-to-br from-blue-50 via-green-50 to-blue-100 dark:from-dark-950 dark:via-dark-900 dark:to-dark-800 pt-28 relative">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Gradient vector shapes */}
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-gradient-to-br from-blue-400/20 to-green-400/20 rounded-full blur-3xl dark:from-blue-500/5 dark:to-green-500/5 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-gradient-to-tr from-green-400/20 to-blue-400/20 rounded-full blur-3xl dark:from-green-500/5 dark:to-blue-500/5 animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-br from-blue-300/10 to-green-300/10 rounded-full blur-3xl dark:from-blue-400/2 dark:to-green-400/2 animate-pulse delay-500"></div>
        
        {/* Grid overlay */}
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-20 dark:[mask-image:linear-gradient(180deg,rgba(255,255,255,0.1),rgba(255,255,255,0))] dark:opacity-5"></div>
        
        {/* Animated gradient border */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-400/10 via-green-400/10 to-blue-400/10 dark:from-blue-900/10 dark:via-green-900/10 dark:to-blue-900/10 animate-gradient-x"></div>
      </div>

      <div className="container mx-auto max-w-7xl px-6 relative">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
          {/* Text Content */}
          <div 
            ref={textRef} 
            className="lg:w-1/2 transform translate-y-8 opacity-0 transition-all duration-1000 ease-out"
          >
            <h1 className="font-sans text-4xl sm:text-5xl font-bold text-dark-900 dark:text-white mb-6 leading-tight">
              Master Your Finances with <span className="text-green relative">
                AI-Powered
                <span className="absolute -bottom-1 left-0 w-full h-1 bg-green/20 rounded-full"></span>
              </span> Guidance!
            </h1>
            <p className="font-body text-lg md:text-xl font-medium text-dark-700 dark:text-gray-300 mb-8 leading-relaxed">
              Get real-time financial advice, track expenses, and <span className="text-green font-semibold">improve your money habits</span>.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link 
                href="/signup" 
                className="font-sans inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-semibold rounded-md text-white bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 transition-all duration-300 shadow-lg hover:shadow-xl shadow-primary/20 hover:-translate-y-0.5"
              >
                Get Started Free
              </Link>
              <Link 
                href="#features" 
                className="font-sans inline-flex items-center justify-center px-8 py-3 border border-green text-base font-semibold rounded-md text-green bg-white hover:bg-green-50 dark:hover:bg-dark-800 transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5"
              >
                Learn More
              </Link>
            </div>
          </div>

          {/* Hero Image */}
          <div 
            ref={imageRef} 
            className="lg:w-1/2 flex justify-center transform translate-y-8 opacity-0 transition-all duration-1000 delay-300 ease-out"
          >
            <div className="w-full max-w-lg relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-400/20 to-green-400/20 rounded-2xl blur-xl dark:from-blue-500/10 dark:to-green-500/10"></div>
              <Image
                src="/hero-illustration.svg"
                alt="AI-powered financial guidance"
                width={500}
                height={400}
                className="w-full h-auto rounded-xl shadow-2xl dark:shadow-dark-900/50 relative"
                priority
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero; 