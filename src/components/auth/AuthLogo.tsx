"use client";

import React from "react";

const AuthLogo = () => (
  <div className="flex flex-col items-center mb-8 select-none">
    <div className="flex items-center justify-center w-24 h-24 mb-4 rounded-full bg-primary/10">
      <img src="/logo-st.svg" alt="Logo" className="h-10" />
    </div>
    <h1 className="text-2xl font-semibold text-foreground">
      Subscription Tracker
    </h1>
    <p className="text-sm text-muted-foreground mt-2">
      Manage your subscriptions effortlessly
    </p>
  </div>
);

export default AuthLogo;
