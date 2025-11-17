import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { AuthGuard } from '@/components/providers/AuthGuard';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Portfolio Admin',
  description: 'Modern hiring analytics dashboard',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${inter.className} bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100`}
      >
        <QueryProvider>
          {/* Global login gate: prevents access to any features without authentication */}
          {/* AuthGuard will no-op on /login and redirect on protected routes */}
          <AuthGuard />
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}
