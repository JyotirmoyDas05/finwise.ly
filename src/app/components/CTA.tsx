'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';

const CTA = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('opacity-100', 'scale-100');
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  return (
    <section 
      ref={sectionRef}
      className="py-24 overflow-hidden bg-gradient-to-br from-blue-500 via-green-500 to-blue-600 dark:from-blue-600 dark:via-green-600 dark:to-blue-700 opacity-0 scale-95 transition-all duration-1000 relative"
    >
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Gradient vector shapes */}
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-gradient-to-br from-white/10 to-transparent rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-gradient-to-tr from-white/10 to-transparent rounded-full blur-3xl animate-pulse delay-1000"></div>
        
        {/* Grid overlay */}
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-10"></div>
        
        {/* Animated gradient border */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-transparent to-white/10 animate-gradient-x"></div>
      </div>

      <div className="container mx-auto max-w-4xl px-6 text-center relative">
        <h2 className="font-sans text-3xl md:text-4xl font-bold text-white mb-6">
          Ready to take control of your <span className="text-green-200 relative">
            financial future
            <span className="absolute -bottom-1 left-0 w-full h-1 bg-white/20 rounded-full"></span>
          </span>?
        </h2>
        <p className="font-body text-lg text-white/90 font-medium mb-8 max-w-2xl mx-auto leading-relaxed">
          Join thousands of users who are already improving their finances with <span className="text-green-200 font-semibold">FinWise.ly's AI-powered</span> guidance.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link 
            href="/signup" 
            className="font-sans inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-semibold rounded-md text-blue-600 bg-white hover:bg-gray-100 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
          >
            Get Started Now
          </Link>
          <Link 
            href="#features" 
            className="font-sans inline-flex items-center justify-center px-8 py-3 border border-white text-base font-semibold rounded-md text-white bg-transparent hover:bg-white/10 transition-all duration-300 hover:-translate-y-0.5"
          >
            Learn More
          </Link>
        </div>
      </div>
    </section>
  );
};

export default CTA; 