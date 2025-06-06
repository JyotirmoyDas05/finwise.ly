'use client';

import React, { useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { gsap } from 'gsap';
import { ContainerScroll } from '../../components/ui/container-scroll-animation';

const Hero = () => {
  const heroRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const buttonsRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const backgroundRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Initial state - hide elements
      gsap.set([titleRef.current, subtitleRef.current, buttonsRef.current], {
        opacity: 0,
        y: 50,
      });

      gsap.set(imageRef.current, {
        opacity: 0,
        scale: 0.8,
        y: 100,
      });

      // Background animations
      const backgroundElements = backgroundRef.current?.children;
      if (backgroundElements) {
        gsap.set(backgroundElements, {
          opacity: 0,
          scale: 0.5,
        });

        gsap.to(backgroundElements, {
          opacity: 1,
          scale: 1,
          duration: 2,
          stagger: 0.3,
          ease: 'power2.out',
        });
      }

      // Main animation timeline
      const tl = gsap.timeline({ delay: 0.5 });

      tl.to(titleRef.current, {
        opacity: 1,
        y: 0,
        duration: 1,
        ease: 'power3.out',
      })
      .to(subtitleRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: 'power2.out',
      }, '-=0.6')
      .to(buttonsRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: 'back.out(1.7)',
      }, '-=0.4')
      .to(imageRef.current, {
        opacity: 1,
        scale: 1,
        y: 0,
        duration: 1.2,
        ease: 'power2.out',
      }, '-=0.8');

      // Floating animation for background elements
      const floatingElements = backgroundRef.current?.querySelectorAll('.floating-element');
      if (floatingElements) {
        floatingElements.forEach((element, index) => {
          gsap.to(element, {
            y: '+=20',
            duration: 3 + (index * 0.5),
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut',
            delay: index * 0.2,
          });
        });
      }

      // Button hover animations
      const buttons = buttonsRef.current?.querySelectorAll('a');
      if (buttons) {
        buttons.forEach(button => {
          button.addEventListener('mouseenter', () => {
            gsap.to(button, {
              scale: 1.05,
              duration: 0.3,
              ease: 'power2.out',
            });
          });

          button.addEventListener('mouseleave', () => {
            gsap.to(button, {
              scale: 1,
              duration: 0.3,
              ease: 'power2.out',
            });
          });
        });
      }
    }, heroRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={heroRef} id="hero" className="overflow-hidden bg-gradient-to-br from-blue-50 via-green-50 to-blue-100 dark:from-dark-950 dark:via-dark-900 dark:to-dark-800 relative">
      {/* Background decorative elements */}
      <div ref={backgroundRef} className="absolute inset-0 overflow-hidden">
        {/* Gradient vector shapes */}
        <div className="floating-element absolute -top-40 -right-40 w-[500px] h-[500px] bg-gradient-to-br from-blue-400/20 to-green-400/20 rounded-full blur-3xl dark:from-blue-500/5 dark:to-green-500/5"></div>
        <div className="floating-element absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-gradient-to-tr from-green-400/20 to-blue-400/20 rounded-full blur-3xl dark:from-green-500/5 dark:to-blue-500/5"></div>
        <div className="floating-element absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-br from-blue-300/10 to-green-300/10 rounded-full blur-3xl dark:from-blue-400/2 dark:to-green-400/2"></div>
        
        {/* Grid overlay */}
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-20 dark:[mask-image:linear-gradient(180deg,rgba(255,255,255,0.1),rgba(255,255,255,0))] dark:opacity-5"></div>
        
        {/* Animated gradient border */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-400/10 via-green-400/10 to-blue-400/10 dark:from-blue-900/10 dark:via-green-900/10 dark:to-blue-900/10"></div>
      </div>

      <div className="flex flex-col overflow-hidden">
        <ContainerScroll
          titleComponent={
            <>
              <div className="mb-20 pt-10">
                <h1 ref={titleRef} className="font-sans text-4xl sm:text-5xl font-bold text-dark-900 dark:text-white mb-6 leading-tight">
                  Master Your Finances with <span className="text-green relative">
                    AI-Powered
                    <span className="absolute -bottom-1 left-0 w-full h-1 bg-green/20 rounded-full"></span>
                  </span> Guidance!
                </h1>
                <p ref={subtitleRef} className="font-body text-lg md:text-xl font-medium text-dark-700 dark:text-gray-300 mb-8 leading-relaxed">
                  Get real-time financial advice, track expenses, learn and <span className="text-green font-semibold">improve your money habits</span>.
                </p>
                <div ref={buttonsRef} className="flex flex-wrap gap-4 justify-center">
                  <Link 
                    href="/signup" 
                    className="font-sans inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-semibold rounded-full text-white bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 transition-all duration-300 shadow-lg hover:shadow-xl shadow-primary/20"
                  >
                    Get Started Free
                  </Link>
                  <Link 
                    href="#features" 
                    className="font-sans inline-flex items-center justify-center px-8 py-3 border border-green text-base font-semibold rounded-full text-green bg-white hover:bg-green-50 dark:hover:bg-dark-800 transition-all duration-300 shadow-md hover:shadow-lg"
                  >
                    Learn More
                  </Link>
                </div>
              </div>
            </>
          }
        >
          <div ref={imageRef}>
            <Image
              src="/DashBoard.png"
              alt="AI-powered financial guidance"
              width={1400}
              height={720}
              className="w-full h-full object-contain max-w-[90vw] md:max-w-[85vw] lg:max-w-[80vw] mx-auto rounded-2xl"
              priority
            />
          </div>
        </ContainerScroll>
      </div>
    </section>
  );
};

export default Hero;