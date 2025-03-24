'use client';

import React, { useEffect, useRef } from 'react';
import { Wallet, LineChart, PiggyBank, Shield, LucideIcon } from 'lucide-react';

const FeatureCard = ({ icon: Icon, title, description }: { icon: LucideIcon; title: string; description: string }) => (
  <div className="p-6 bg-white/80 dark:bg-dark-800/80 backdrop-blur-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-100 dark:border-dark-700/50 group">
    <div className="w-12 h-12 bg-gradient-to-br from-blue-400/20 to-green-400/20 dark:from-blue-500/5 dark:to-green-500/5 rounded-lg flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
      <Icon className="w-6 h-6 text-green dark:text-green-400" />
    </div>
    <h3 className="font-sans text-xl font-bold text-dark-900 dark:text-white mb-2 group-hover:text-green dark:group-hover:text-green-400 transition-colors duration-300">{title}</h3>
    <p className="font-body text-dark-700 dark:text-gray-300 font-medium">{description}</p>
  </div>
);

const Features = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('opacity-100');
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

  const features = [
    {
      icon: Wallet,
      title: 'Smart Budgeting',
      description: 'AI-powered expense tracking and budget recommendations tailored to your spending habits.'
    },
    {
      icon: LineChart,
      title: 'Investment Insights',
      description: 'Get personalized investment advice and market analysis to grow your wealth.'
    },
    {
      icon: PiggyBank,
      title: 'Savings Goals',
      description: 'Set and track your savings goals with intelligent recommendations to reach them faster.'
    },
    {
      icon: Shield,
      title: 'Secure & Private',
      description: 'Bank-level security with end-to-end encryption to protect your financial data.'
    }
  ];

  return (
    <section 
      ref={sectionRef}
      className="py-24 bg-gradient-to-br from-blue-50 via-green-50 to-blue-100 dark:from-dark-950 dark:via-dark-900 dark:to-dark-800 relative overflow-hidden"
      id="features"
    >
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Gradient vector shapes */}
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-gradient-to-br from-blue-400/20 to-green-400/20 rounded-full blur-3xl dark:from-blue-500/5 dark:to-green-500/5 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-gradient-to-tr from-green-400/20 to-blue-400/20 rounded-full blur-3xl dark:from-green-500/5 dark:to-blue-500/5 animate-pulse delay-1000"></div>
        
        {/* Grid overlay */}
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-20 dark:[mask-image:linear-gradient(180deg,rgba(255,255,255,0.1),rgba(255,255,255,0))] dark:opacity-5"></div>
      </div>

      <div className="container mx-auto px-6 relative">
        <div className="text-center mb-16">
          <h2 className="font-roboto text-3xl md:text-4xl font-semibold text-dark-900 dark:text-white mb-4">
            Powerful <span className="text-green relative">
              Features
              <span className="absolute -bottom-1 left-0 w-full h-1 bg-green/20 rounded-full"></span>
            </span> for Your Success
          </h2>
          <p className="font-body text-lg text-dark-700 dark:text-gray-300 font-medium max-w-2xl mx-auto">
            Everything you need to manage your finances effectively and achieve your financial goals.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <FeatureCard key={index} {...feature} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;