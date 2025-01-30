"use client";

import React from "react";
import { Wallet } from "lucide-react";

const AuthLogo = () => (
  <div className="flex flex-col items-center mb-8 select-none">
    <div className="flex items-center justify-center w-24 h-24 mb-4 rounded-full bg-primary/10">
      <Wallet className="w-12 h-12 text-primary" />
    </div>
    <h1 className="text-2xl font-semibold text-foreground">Subscription Tracker</h1>
    <p className="text-sm text-muted-foreground mt-2">Manage your subscriptions effortlessly</p>
  </div>
);

export default AuthLogo;
