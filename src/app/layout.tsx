import React from 'react';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'CineTracker - Track, Rate & Review Movies',
  description: 'Discover, rate, and review movies. Track your watch history, import from Letterboxd, and follow fellow movie lovers.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-black text-white antialiased min-h-screen flex flex-col">
        <AuthProvider>
          <Navbar />
          <main className="flex-1">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
