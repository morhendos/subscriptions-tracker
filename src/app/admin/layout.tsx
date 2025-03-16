'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { isAdmin } from '@/utils/auth';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  
  // Navigation items
  const navItems = [
    { name: 'Dashboard', path: '/admin' },
    { name: 'Waitlist', path: '/admin/waitlist' },
  ];
  
  // Check authentication status
  const loading = status === 'loading';
  const authenticated = status === 'authenticated';
  const hasAdminRole = session && isAdmin(session.user);
  
  // Don't need to show error here since middleware will redirect to login
  // This is just a fallback for any edge cases
  if (!loading && (!authenticated || !hasAdminRole)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Access Denied</h1>
          <p className="mt-4 text-muted-foreground">
            You don't have permission to access this page.
          </p>
          <div className="mt-8">
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
            >
              Return to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex min-h-screen flex-col pt-16"> {/* Added pt-16 to account for the main header */}
      <header className="sticky top-16 z-30 w-full border-b bg-background/95 backdrop-blur">
        <div className="container flex h-14 items-center">
          <div className="mr-4 flex">
            <Link href="/admin" className="font-semibold">
              Admin Dashboard
            </Link>
          </div>
          <nav className="flex items-center space-x-4 lg:space-x-6 mx-6">
            {navItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  pathname === item.path
                    ? 'text-foreground'
                    : 'text-muted-foreground'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center space-x-4">
            <Link
              href="/"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Back to App
            </Link>
          </div>
        </div>
      </header>
      
      <main className="flex-1 p-6">
        <div className="container mx-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
            </div>
          ) : (
            children
          )}
        </div>
      </main>
      
      <footer className="border-t py-6">
        <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-center text-sm text-muted-foreground md:text-left">
            &copy; {new Date().getFullYear()} Subscriptions Tracker. Admin Panel.
          </p>
        </div>
      </footer>
    </div>
  );
}
