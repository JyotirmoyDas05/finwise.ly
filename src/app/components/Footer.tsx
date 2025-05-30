'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

const Footer = () => {
  const footerRef = useRef<HTMLElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const socialRef = useRef<HTMLDivElement>(null);
  const copyrightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Initial state
      gsap.set([logoRef.current, contentRef.current, socialRef.current, copyrightRef.current], {
        opacity: 0,
        y: 30,
      });

      // Animation timeline
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: footerRef.current,
          start: 'top 85%',
          toggleActions: 'play none none reverse',
        }
      });

      tl.to(logoRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: 'power2.out',
      })
      .to(contentRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: 'power2.out',
      }, '-=0.6')
      .to(socialRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: 'power2.out',
      }, '-=0.4')
      .to(copyrightRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: 'power2.out',
      }, '-=0.3');

      // Social icons hover animations
      const socialIcons = socialRef.current?.querySelectorAll('a');
      if (socialIcons) {
        socialIcons.forEach(icon => {
          icon.addEventListener('mouseenter', () => {
            gsap.to(icon, {
              scale: 1.2,
              rotation: 10,
              duration: 0.3,
              ease: 'power2.out',
            });
          });

          icon.addEventListener('mouseleave', () => {
            gsap.to(icon, {
              scale: 1,
              rotation: 0,
              duration: 0.3,
              ease: 'power2.out',
            });
          });
        });
      }

      // Links hover animations
      const links = footerRef.current?.querySelectorAll('a[href^="#"], a[href="#"]');
      if (links) {
        links.forEach(link => {
          link.addEventListener('mouseenter', () => {
            gsap.to(link, {
              x: 5,
              duration: 0.2,
              ease: 'power2.out',
            });
          });

          link.addEventListener('mouseleave', () => {
            gsap.to(link, {
              x: 0,
              duration: 0.2,
              ease: 'power2.out',
            });
          });
        });
      }

      // Smooth scroll for anchor links
      const anchorLinks = footerRef.current?.querySelectorAll('a[href^="#"]');
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

    }, footerRef);

    return () => ctx.revert();
  }, []);

  return (
    <footer ref={footerRef} className="bg-white dark:bg-dark-900 py-12">
      <div className="container mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and Description */}
          <div ref={logoRef} className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center text-white font-normal text-lg">F</div>
              <h2 className="font-roboto text-2xl font-semibold text-dark-900 dark:text-white">FinWise.ly</h2>
            </div>
            <p className="font-body text-dark-700 dark:text-white mt-2 max-w-md leading-relaxed">
              AI-powered financial guidance to help you make smarter decisions and build <span className="text-green">better money habits</span>.
            </p>
            <div ref={socialRef} className="flex space-x-4 mt-6">
              <a href="#" className="text-dark-700 dark:text-white hover:text-green transition-colors">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                </svg>
              </a>
              <a href="#" className="text-dark-700 dark:text-white hover:text-green transition-colors">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
              <a href="#" className="text-dark-700 dark:text-white hover:text-green transition-colors">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                </svg>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div ref={contentRef}>
            <h3 className="font-sans text-lg font-medium mb-4 text-dark-900 dark:text-white">
              Quick <span className="text-green">Links</span>
            </h3>
            <ul className="font-body space-y-2">
              <li>
                <Link href="#features" className="text-dark-700 dark:text-white hover:text-green transition-colors">
                  Features
                </Link>
              </li>
              <li>
                <Link href="#how-it-works" className="text-dark-700 dark:text-white hover:text-green transition-colors">
                  How it Works
                </Link>
              </li>
              <li>
                <Link href="#" className="text-dark-700 dark:text-white hover:text-green transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="#" className="text-dark-700 dark:text-white hover:text-green transition-colors">
                  Testimonials
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-sans text-lg font-medium mb-4 text-dark-900 dark:text-white">
              <span className="text-green">Resources</span>
            </h3>
            <ul className="font-body space-y-2">
              <li>
                <Link href="#" className="text-dark-700 dark:text-white hover:text-green transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="#" className="text-dark-700 dark:text-white hover:text-green transition-colors">
                  Support
                </Link>
              </li>
              <li>
                <Link href="#" className="text-dark-700 dark:text-white hover:text-green transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="#" className="text-dark-700 dark:text-white hover:text-green transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div ref={copyrightRef} className="mt-12 border-t border-dark-200 dark:border-dark-700 pt-8 text-center text-dark-700 dark:text-white">
          <p className="font-body">&copy; {new Date().getFullYear()} FinWise.ly. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;