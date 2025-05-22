'use client';

import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { UserPlus, Brain, LineChart, Target } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

interface StepCardProps {
  number: number;
  icon: React.ElementType;
  title: string;
  description: string;
  index: number;
}

const StepCard = ({ number, icon: Icon, title, description, index }: StepCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const numberRef = useRef<HTMLDivElement>(null);
  const iconRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Initial state
      gsap.set(cardRef.current, {
        opacity: 0,
        y: 60,
        scale: 0.9,
      });

      // Card animation
      gsap.to(cardRef.current, {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.8,
        ease: 'back.out(1.7)',
        delay: index * 0.15,
        scrollTrigger: {
          trigger: cardRef.current,
          start: 'top 85%',
          toggleActions: 'play none none reverse',
        }
      });

      // Sequential number and icon animation
      gsap.fromTo([numberRef.current, iconRef.current], 
        {
          scale: 0,
          rotation: -180,
        },
        {
          scale: 1,
          rotation: 0,
          duration: 0.6,
          ease: 'back.out(1.7)',
          stagger: 0.1,
          delay: (index * 0.15) + 0.3,
          scrollTrigger: {
            trigger: cardRef.current,
            start: 'top 85%',
            toggleActions: 'play none none reverse',
          }
        }
      );

      // Hover animations
      const card = cardRef.current;
      if (card) {
        card.addEventListener('mouseenter', () => {
          gsap.to(card, {
            y: -10,
            scale: 1.02,
            duration: 0.3,
            ease: 'power2.out',
          });
          
          gsap.to([numberRef.current, iconRef.current], {
            scale: 1.1,
            rotation: 5,
            duration: 0.3,
            ease: 'power2.out',
            stagger: 0.05,
          });
        });

        card.addEventListener('mouseleave', () => {
          gsap.to(card, {
            y: 0,
            scale: 1,
            duration: 0.3,
            ease: 'power2.out',
          });
          
          gsap.to([numberRef.current, iconRef.current], {
            scale: 1,
            rotation: 0,
            duration: 0.3,
            ease: 'power2.out',
            stagger: 0.05,
          });
        });
      }

    }, cardRef);

    return () => ctx.revert();
  }, [index]);

  return (
    <div 
      ref={cardRef}
      className="step-card p-6 bg-white/80 dark:bg-dark-800/80 backdrop-blur-lg rounded-xl shadow-lg border border-gray-100 dark:border-dark-700 group cursor-pointer relative"
    >
      {/* Step Number */}
      <div 
        ref={numberRef}
        className="w-12 h-12 bg-gradient-to-br from-blue-400/20 to-green-400/20 dark:from-blue-500/10 dark:to-green-500/10 rounded-full flex items-center justify-center mb-4 shadow-lg"
      >
        <span className="font-roboto font-semibold text-lg text-green dark:text-green-400">{number}</span>
      </div>
      
      {/* Icon */}
      <div 
        ref={iconRef}
        className="w-12 h-12 bg-gradient-to-br from-blue-400/20 to-green-400/20 dark:from-blue-500/10 dark:to-green-500/10 rounded-lg flex items-center justify-center mb-4 shadow-lg"
      >
        <Icon className="w-6 h-6 text-green dark:text-green-400" />
      </div>
      
      <h3 className="font-roboto font-semibold text-xl text-dark-900 dark:text-white mb-2 group-hover:text-green transition-colors duration-300">
        {title}
      </h3>
      <p className="font-roboto font-normal text-dark-700 dark:text-gray-300">
        {description}
      </p>
      
      {/* Connecting Line */}
      {index < 3 && (
        <div className="hidden lg:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-green/50 to-blue/50 transform -translate-y-1/2 z-10">
          <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-green rounded-full"></div>
        </div>
      )}
    </div>
  );
};

const HowItWorks = () => {
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
            duration: 25 + (index * 5),
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

      // Parallax effect for background
      gsap.to('.floating-bg-how', {
        yPercent: -30,
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
    <section ref={sectionRef} id="how-it-works" className="py-24 bg-gradient-to-br from-blue-50 via-green-50 to-blue-100 dark:from-dark-900 dark:to-dark-800 relative overflow-hidden">
      {/* Background decorative elements */}
      <div ref={backgroundRef} className="absolute inset-0 overflow-hidden">
        {/* Gradient vector shapes */}
        <div className="floating-bg-how absolute -top-40 -right-40 w-[500px] h-[500px] bg-gradient-to-br from-blue-400/20 to-green-400/20 rounded-full blur-3xl dark:from-blue-500/10 dark:to-green-500/10"></div>
        <div className="floating-bg-how absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-gradient-to-tr from-green-400/20 to-blue-400/20 rounded-full blur-3xl dark:from-green-500/10 dark:to-blue-500/10"></div>
        <div className="floating-bg-how absolute top-1/2 right-1/4 w-[300px] h-[300px] bg-gradient-to-br from-purple-400/15 to-pink-400/15 rounded-full blur-2xl dark:from-purple-500/5 dark:to-pink-500/5"></div>
        
        {/* Grid overlay */}
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-20"></div>
      </div>

      <div className="container mx-auto px-6 relative">
        <div className="text-center mb-16">
          <h2 ref={titleRef} className="font-roboto font-semibold text-3xl md:text-4xl text-dark-900 dark:text-white mb-4">
            How It <span className="text-green relative">
              Works
              <span className="absolute -bottom-1 left-0 w-full h-1 bg-green/20 rounded-full"></span>
            </span>
          </h2>
          <p ref={subtitleRef} className="font-roboto font-normal text-lg text-dark-700 dark:text-gray-300 max-w-2xl mx-auto">
            Get started with FinWise.ly in just four simple steps and take control of your financial future.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          {steps.map((step, index) => (
            <StepCard key={index} number={index + 1} index={index} {...step} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;