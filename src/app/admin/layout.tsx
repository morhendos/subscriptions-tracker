'use client';

import { ReactNode, useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { isAdmin } from '@/utils/auth';
import { 
  Home, 
  Users, 
  ChevronRight, 
  Menu, 
  X, 
  Settings,
  LogOut
} from 'lucide-react';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  // Navigation items
  const navItems = [
    { name: 'Dashboard', path: '/admin', icon: <Home className="h-5 w-5" /> },
    { name: 'Waitlist', path: '/admin/waitlist', icon: <Users className="h-5 w-5" /> },
  ];
  
  // Handle SSR
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Check authentication status
  const loading = status === 'loading';
  const authenticated = status === 'authenticated';
  const hasAdminRole = session && isAdmin(session.user);
  
  // Don't need to show error here since middleware will redirect to login
  // This is just a fallback for any edge cases
  if (mounted && !loading && (!authenticated || !hasAdminRole)) {
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
    <div className="flex min-h-screen bg-background">
      {/* Sidebar for larger screens */}
      <aside className={`fixed inset-y-0 left-0 z-40 hidden w-64 transform bg-card border-r shadow-sm transition-transform md:flex md:flex-col`}>
        <div className="flex h-16 items-center border-b px-6">
          <Link href="/admin" className="flex items-center gap-2">
            <img src="/logo-st.svg" alt="Logo" className="h-8 w-8" />
            <span className="text-lg font-semibold">Admin Panel</span>
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.path;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  {item.icon}
                  {item.name}
                  {isActive && <ChevronRight className="ml-auto h-4 w-4" />}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="border-t p-4">
          <div className="flex flex-col gap-2">
            <Link
              href="/"
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <LogOut className="h-5 w-5" />
              Return to App
            </Link>
            {session?.user?.name && (
              <div className="flex items-center gap-3 rounded-md bg-muted px-3 py-2 text-sm">
                <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-medium">
                  {session.user.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col">
                  <span className="font-medium">{session.user.name}</span>
                  <span className="text-xs text-muted-foreground">Admin</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>
      
      {/* Mobile header and sidebar */}
      <div className="fixed inset-x-0 top-0 z-40 md:hidden">
        <div className="flex h-16 items-center justify-between border-b bg-background px-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <Menu className="h-5 w-5" />
            </button>
            <span className="text-lg font-semibold">Admin Panel</span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <LogOut className="h-5 w-5" />
            </Link>
          </div>
        </div>
        
        {/* Mobile sidebar */}
        {sidebarOpen && (
          <>
            <div 
              className="fixed inset-0 z-40 bg-black/50" 
              onClick={() => setSidebarOpen(false)}
            />
            <div className="fixed inset-y-0 left-0 z-50 w-64 bg-card shadow-lg">
              <div className="flex h-16 items-center justify-between border-b px-6">
                <Link href="/admin" className="flex items-center gap-2">
                  <img src="/logo-st.svg" alt="Logo" className="h-8 w-8" />
                  <span className="text-lg font-semibold">Admin Panel</span>
                </Link>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-4">
                <nav className="space-y-1">
                  {navItems.map((item) => {
                    const isActive = pathname === item.path;
                    return (
                      <Link
                        key={item.path}
                        href={item.path}
                        onClick={() => setSidebarOpen(false)}
                        className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                          isActive
                            ? 'bg-primary/10 text-primary'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        }`}
                      >
                        {item.icon}
                        {item.name}
                        {isActive && <ChevronRight className="ml-auto h-4 w-4" />}
                      </Link>
                    );
                  })}
                </nav>
              </div>
            </div>
          </>
        )}
      </div>
      
      {/* Main content */}
      <div className="flex flex-1 flex-col md:pl-64">
        <main className="flex-1 p-4 md:p-8 pt-20 md:pt-8">
          {loading ? (
            <div className="flex items-center justify-center h-full py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
            </div>
          ) : (
            <div className="mx-auto max-w-7xl">
              {children}
            </div>
          )}
        </main>
        
        <footer className="border-t py-4 px-4 md:px-8">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <p className="text-center text-sm text-muted-foreground md:text-left">
              &copy; {new Date().getFullYear()} Subscriptions Tracker. Admin Panel.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
