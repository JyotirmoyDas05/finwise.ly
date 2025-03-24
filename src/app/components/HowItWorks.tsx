'use client';

import React from 'react';
import { UserPlus, Brain, LineChart, Target } from 'lucide-react';

const StepCard = ({ number, icon: Icon, title, description }: { number: number; icon: any; title: string; description: string }) => (
  <div className="p-6 bg-white/80 dark:bg-dark-800/80 backdrop-blur-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-100 dark:border-dark-700 group">
    <div className="w-12 h-12 bg-gradient-to-br from-blue-400/20 to-green-400/20 dark:from-blue-500/10 dark:to-green-500/10 rounded-full flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
      <span className="font-roboto font-semibold text-lg text-green dark:text-green-400">{number}</span>
    </div>
    <div className="w-12 h-12 bg-gradient-to-br from-blue-400/20 to-green-400/20 dark:from-blue-500/10 dark:to-green-500/10 rounded-lg flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
      <Icon className="w-6 h-6 text-green dark:text-green-400" />
    </div>
    <h3 className="font-roboto font-semibold text-xl text-dark-900 dark:text-white mb-2 group-hover:text-green transition-colors duration-300">{title}</h3>
    <p className="font-roboto font-normal text-dark-700 dark:text-gray-300">{description}</p>
  </div>
);

const HowItWorks = () => {
  const steps = [
    {
      icon: UserPlus,
      title: 'Create Your Account',
      description: 'Sign up for free and connect your financial accounts securely.'
    },
    {
      icon: Brain,
      title: 'AI Analysis',
      description: 'Our AI analyzes your financial data to understand your spending patterns.'
    },
    {
      icon: LineChart,
      title: 'Get Insights',
      description: 'Receive personalized recommendations and financial insights.'
    },
    {
      icon: Target,
      title: 'Track Progress',
      description: 'Monitor your financial goals and see your progress in real-time.'
    }
  ];

  return (
    <section id="how-it-works" className="py-24 bg-gradient-to-br from-blue-50 via-green-50 to-blue-100 dark:from-dark-900 dark:to-dark-800 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Gradient vector shapes */}
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-gradient-to-br from-blue-400/20 to-green-400/20 rounded-full blur-3xl dark:from-blue-500/10 dark:to-green-500/10 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-gradient-to-tr from-green-400/20 to-blue-400/20 rounded-full blur-3xl dark:from-green-500/10 dark:to-blue-500/10 animate-pulse delay-1000"></div>
        
        {/* Grid overlay */}
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-20"></div>
      </div>

      <div className="container mx-auto px-6 relative">
        <div className="text-center mb-16">
          <h2 className="font-roboto font-semibold text-3xl md:text-4xl text-dark-900 dark:text-white mb-4">
            How It <span className="text-green relative">
              Works
              <span className="absolute -bottom-1 left-0 w-full h-1 bg-green/20 rounded-full"></span>
            </span>
          </h2>
          <p className="font-roboto font-normal text-lg text-dark-700 dark:text-gray-300 max-w-2xl mx-auto">
            Everything you need to manage your finances effectively and achieve your financial goals.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <StepCard key={index} number={index + 1} {...step} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks; 