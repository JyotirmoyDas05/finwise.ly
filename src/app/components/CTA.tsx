'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const CTA = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const buttonsRef = useRef<HTMLDivElement>(null);
  const backgroundRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Initial state
      gsap.set([titleRef.current, subtitleRef.current, buttonsRef.current], {
        opacity: 0,
        y: 50,
      });

      gsap.set(sectionRef.current, {
        scale: 0.95,
        opacity: 0,
      });

      // Background animations
      const backgroundElements = backgroundRef.current?.children;
      if (backgroundElements) {
        Array.from(backgroundElements).forEach((element, index) => {
          gsap.to(element, {
            rotation: 360,
            duration: 20 + (index * 10),
            repeat: -1,
            ease: 'none',
          });
        });
      }

      // Main animation timeline
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 80%',
          toggleActions: 'play none none reverse',
        }
      });

      tl.to(sectionRef.current, {
        scale: 1,
        opacity: 1,
        duration: 1,
        ease: 'power2.out',
      })
      .to(titleRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: 'power2.out',
      }, '-=0.6')
      .to(subtitleRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: 'power2.out',
      }, '-=0.4')
      .to(buttonsRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: 'back.out(1.7)',
      }, '-=0.4');

      // Button hover animations
      const buttons = buttonsRef.current?.querySelectorAll('a');
      if (buttons) {
        buttons.forEach(button => {
          button.addEventListener('mouseenter', () => {
            gsap.to(button, {
              scale: 1.05,
              y: -5,
              duration: 0.3,
              ease: 'power2.out',
            });
          });

          button.addEventListener('mouseleave', () => {
            gsap.to(button, {
              scale: 1,
              y: 0,
              duration: 0.3,
              ease: 'power2.out',
            });
          });
        });
      }

      // Parallax effect
      gsap.to(backgroundRef.current, {
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

  return (
    <section 
      ref={sectionRef}
      className="py-24 overflow-hidden bg-gradient-to-br from-blue-500 via-green-500 to-blue-600 dark:from-blue-600 dark:via-green-600 dark:to-blue-700 relative rounded-2xl mx-4"
    >
      {/* Background decorative elements */}
      <div ref={backgroundRef} className="absolute inset-0 overflow-hidden rounded-2xl">
        {/* Gradient vector shapes */}
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-gradient-to-br from-white/10 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-gradient-to-tr from-white/10 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-white/5 to-transparent rounded-full blur-2xl"></div>
        
        {/* Grid overlay */}
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-10"></div>
        
        {/* Animated gradient border */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-transparent to-white/10"></div>
      </div>

      <div className="container mx-auto max-w-4xl px-6 text-center relative">
        <h2 ref={titleRef} className="font-sans text-3xl md:text-4xl font-bold text-white mb-6">
          Ready to take control of your <span className="text-green-200 relative">
            financial future
            <span className="absolute -bottom-1 left-0 w-full h-1 bg-white/20 rounded-full"></span>
          </span>?
        </h2>
        <p ref={subtitleRef} className="font-body text-lg text-white/90 font-medium mb-8 max-w-2xl mx-auto leading-relaxed">
          Join thousands of users who are already improving their finances with <span className="text-green-200 font-semibold">FinWise.ly&apos;s AI-powered</span> guidance.
        </p>
        <div ref={buttonsRef} className="flex flex-wrap justify-center gap-4">
          <Link 
            href="/signup" 
            className="font-sans inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-semibold rounded-full text-blue-600 bg-white hover:bg-gray-100 transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            Get Started Now
          </Link>
          <Link 
            href="#features" 
            className="font-sans inline-flex items-center justify-center px-8 py-3 border border-white text-base font-semibold rounded-full text-white bg-transparent hover:bg-white/10 transition-all duration-300"
          >
            Learn More
          </Link>
        </div>
      </div>
    </section>
  );
};

export default CTA;