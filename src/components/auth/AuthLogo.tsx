"use client";

import React from "react";
import Link from "next/link";

// Define landing page URL
const LANDING_PAGE_URL = "https://subscriptions-tracker.com";

const AuthLogo = () => (
  <div className="flex flex-col items-center mb-8 select-none">
    <Link 
      href={LANDING_PAGE_URL} 
      className="flex items-center justify-center mb-4 rounded-full bg-primary/10 p-2 transition-all hover:bg-primary/20 cursor-pointer"
      title="Go to Subscriptions Tracker homepage"
      target="_blank"
      rel="noopener noreferrer"
    >
      <img src="/logo-st.svg" alt="Logo" className="h-20" />
    </Link>
  </div>
);

export default AuthLogo;
