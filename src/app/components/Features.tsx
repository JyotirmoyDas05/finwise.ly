'use client';

import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Wallet, LineChart, PiggyBank, Shield, LucideIcon } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  index: number;
}

const FeatureCard = ({ icon: Icon, title, description, index }: FeatureCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const iconRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Initial state
      gsap.set(cardRef.current, {
        opacity: 0,
        y: 50,
        scale: 0.9,
      });

      // Animate in when scrolled into view
      gsap.to(cardRef.current, {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.8,
        ease: 'back.out(1.7)',
        delay: index * 0.1,
        scrollTrigger: {
          trigger: cardRef.current,
          start: 'top 85%',
          toggleActions: 'play none none reverse',
        }
      });

      // Icon animation on hover
      const card = cardRef.current;
      const icon = iconRef.current;

      if (card && icon) {
        card.addEventListener('mouseenter', () => {
          gsap.to(icon, {
            rotation: 360,
            scale: 1.2,
            duration: 0.6,
            ease: 'back.out(1.7)',
          });
        });

        card.addEventListener('mouseleave', () => {
          gsap.to(icon, {
            rotation: 0,
            scale: 1,
            duration: 0.4,
            ease: 'power2.out',
          });
        });
      }
    }, cardRef);

    return () => ctx.revert();
  }, [index]);

  return (
    <div 
      ref={cardRef}
      className="feature-card p-6 bg-white/80 dark:bg-dark-800/80 backdrop-blur-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-dark-700/50 group cursor-pointer"
    >
      <div 
        ref={iconRef}
        className="w-12 h-12 bg-gradient-to-br from-blue-400/20 to-green-400/20 dark:from-blue-500/5 dark:to-green-500/5 rounded-lg flex items-center justify-center mb-4 shadow-lg"
      >
        <Icon className="w-6 h-6 text-green dark:text-green-400" />
      </div>
      <h3 className="font-sans text-xl font-bold text-dark-900 dark:text-white mb-2 group-hover:text-green dark:group-hover:text-green-400 transition-colors duration-300">
        {title}
      </h3>
      <p className="font-body text-dark-700 dark:text-gray-300 font-medium">
        {description}
      </p>
    </div>
  );
};

const Features = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const backgroundRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Background animations
      const backgroundElements = backgroundRef.current?.children;
      if (backgroundElements) {
        Array.from(backgroundElements).forEach((element, index) => {
          gsap.to(element, {
            rotation: 360,
            duration: 20 + (index * 5),
            repeat: -1,
            ease: 'none',
          });
        });
      }

      // Title animations
      gsap.fromTo(titleRef.current, 
        {
          opacity: 0,
          y: 30,
        },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: titleRef.current,
            start: 'top 80%',
            toggleActions: 'play none none reverse',
          }
        }
      );

      gsap.fromTo(subtitleRef.current, 
        {
          opacity: 0,
          y: 20,
        },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'power2.out',
          delay: 0.3,
          scrollTrigger: {
            trigger: subtitleRef.current,
            start: 'top 80%',
            toggleActions: 'play none none reverse',
          }
        }
      );

      // Parallax effect for background elements
      gsap.to('.floating-bg', {
        yPercent: -50,
        ease: 'none',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        }
      });

    }, sectionRef);

    return () => ctx.revert();
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
      <div ref={backgroundRef} className="absolute inset-0 overflow-hidden">
        {/* Gradient vector shapes */}
        <div className="floating-bg absolute -top-40 -right-40 w-[500px] h-[500px] bg-gradient-to-br from-blue-400/20 to-green-400/20 rounded-full blur-3xl dark:from-blue-500/5 dark:to-green-500/5"></div>
        <div className="floating-bg absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-gradient-to-tr from-green-400/20 to-blue-400/20 rounded-full blur-3xl dark:from-green-500/5 dark:to-blue-500/5"></div>
        <div className="floating-bg absolute top-1/2 right-1/4 w-[300px] h-[300px] bg-gradient-to-br from-purple-400/15 to-pink-400/15 rounded-full blur-2xl dark:from-purple-500/3 dark:to-pink-500/3"></div>
        
        {/* Grid overlay */}
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-20 dark:[mask-image:linear-gradient(180deg,rgba(255,255,255,0.1),rgba(255,255,255,0))] dark:opacity-5"></div>
      </div>

      <div className="container mx-auto px-6 relative">
        <div className="text-center mb-16">
          <h2 ref={titleRef} className="font-roboto text-3xl md:text-4xl font-semibold text-dark-900 dark:text-white mb-4">
            Powerful <span className="text-green relative">
              Features
              <span className="absolute -bottom-1 left-0 w-full h-1 bg-green/20 rounded-full"></span>
            </span> for Your Success
          </h2>
          <p ref={subtitleRef} className="font-body text-lg text-dark-700 dark:text-gray-300 font-medium max-w-2xl mx-auto">
            Everything you need to manage your finances effectively and achieve your financial goals.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <FeatureCard key={index} index={index} {...feature} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;