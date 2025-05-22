'use client';

import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import Header from './components/Header';
import Hero from './components/Hero';
import Features from './components/Features';
import HowItWorks from './components/HowItWorks';
import CTA from './components/CTA';
import Footer from './components/Footer';

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

export default function Home() {
  const pageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll-triggered animations for sections
    const sections = pageRef.current?.querySelectorAll('section');
    
    if (sections) {
      sections.forEach((section, index) => {
        gsap.fromTo(section, 
          {
            opacity: 0,
            y: 50,
          },
          {
            opacity: 1,
            y: 0,
            duration: 1,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: section,
              start: 'top 80%',
              end: 'bottom 20%',
              toggleActions: 'play none none reverse',
            }
          }
        );
      });
    }

    // Smooth scroll for anchor links in the entire page
    const anchorLinks = pageRef.current?.querySelectorAll('a[href^="#"]');
    if (anchorLinks) {
      anchorLinks.forEach(link => {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          const targetId = link.getAttribute('href');
          if (targetId && targetId !== "#") {
            gsap.to(window, {
              scrollTo: { y: targetId, offsetY: 70 }, // Adjust offsetY for fixed headers if needed
              duration: 1,
              ease: 'power2.out',
            });
          }
        });
      });
    }

    // Cleanup
    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, []);

  return (
    <div ref={pageRef} className="min-h-screen bg-white">
      <Header />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
