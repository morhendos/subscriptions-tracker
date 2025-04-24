"use client";

import { HeaderControls } from "../settings/HeaderControls";
import LogoutButton from "../auth/LogoutButton";
import { useSession } from "next-auth/react";
import { isAdmin } from "@/utils/auth";
import Link from "next/link";

export function PageHeader() {
  const { data: session } = useSession();
  const hasAdminRole = session && isAdmin(session.user);

  return (
    <header className="animate-fade-in border-b border-gray-100 dark:border-gray-800">
      <div className="container mx-auto">
        <div className="flex h-16 items-center justify-between px-4">
          {/* Left side */}
          <div className="flex items-center gap-4">
            <LogoutButton />
            
            {/* Admin panel link - only visible for admin users */}
            {hasAdminRole && (
              <Link
                href="/admin"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring px-3 py-2 bg-primary text-primary-foreground shadow hover:bg-primary/90"
              >
                Admin Panel
              </Link>
            )}
          </div>

          {/* Center - logo and title */}
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold text-foreground tracking-tight">
              <img src="/logo-st.svg" alt="Logo" className=" h-10" />
            </h1>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            <HeaderControls />
          </div>
        </div>
      </div>

      {/* Gradient divider */}
      <div className="h-[1px] bg-gradient-to-r from-transparent via-accent/20 to-transparent" />
    </header>
  );
}
