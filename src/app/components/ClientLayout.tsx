'use client';

import { usePathname } from 'next/navigation';
import Header from './Header';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const showNavbar = pathname === '/'; // Only show navbar on the landing page

  return (
    <>
      {showNavbar && <Header />}
      {children}
    </>
  );
} 