'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Header from './Header';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const showNavbar = pathname === '/'; // Only show navbar on the landing page
  
  // Add viewport height fix for mobile browsers
  useEffect(() => {
    const setVhProperty = () => {
      // Set a CSS variable equal to 1% of the viewport height
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    // Set the property initially
    setVhProperty();

    // Update the property when the window is resized
    window.addEventListener('resize', setVhProperty);
    
    // Clean up the event listener
    return () => window.removeEventListener('resize', setVhProperty);
  }, []);

  return (
    <div className="min-h-screen min-h-[calc(var(--vh,1vh)*100)] flex flex-col">
      {showNavbar && <Header />}
      <main className="flex-1">{children}</main>
    </div>
  );
} 