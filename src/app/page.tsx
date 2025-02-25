'use client';

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default function HomePage() {
  const { data: session, status } = useSession();
  
  // If the user is authenticated, redirect to subscriptions
  if (status === 'authenticated') {
    redirect('/subscriptions');
  }
  
  // Otherwise, show a welcome page
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-4xl w-full text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-8 text-gray-800 dark:text-white">
          Welcome to <span className="text-[rgb(210,50,170)]">Subscription Tracker</span>
        </h1>
        
        <p className="text-xl mb-12 text-gray-600 dark:text-gray-300">
          Your one-stop solution for managing all your recurring subscriptions
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <Link 
            href="/login" 
            className="px-8 py-3 bg-[rgb(210,50,170)] text-white rounded-md hover:bg-[rgb(180,40,150)] transition-all font-semibold"
          >
            Login
          </Link>
          
          <Link 
            href="/signup" 
            className="px-8 py-3 bg-white text-[rgb(210,50,170)] border border-[rgb(210,50,170)] rounded-md hover:bg-gray-50 transition-all font-semibold"
          >
            Sign Up
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-3 text-gray-800 dark:text-white">Track Your Expenses</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Keep track of all your subscription expenses in one place and never miss a payment.
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-3 text-gray-800 dark:text-white">Manage Billing Cycles</h3>
            <p className="text-gray-600 dark:text-gray-300">
              View upcoming payments and get a clear picture of your monthly recurring costs.
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-3 text-gray-800 dark:text-white">Multiple Currencies</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Support for multiple currencies with automatic conversion to your preferred currency.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}