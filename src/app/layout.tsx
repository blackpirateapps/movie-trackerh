import React from 'react';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'CineTracker - Utilitarian Media Tracker & Log',
  description: 'Minimalist media tracking system. Rate films, track TV seasons, log episode progress, and share watch history.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#121212] text-[#EDEDED] antialiased min-h-screen flex flex-col selection:bg-[#00FF66] selection:text-[#121212]">
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
