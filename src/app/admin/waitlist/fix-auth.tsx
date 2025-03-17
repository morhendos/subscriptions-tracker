'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';

export default function WaitlistAuthFix() {
  const { data: session } = useSession();
  const [email, setEmail] = useState('');
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const addAdminRole = async () => {
    if (!email) {
      setResult({
        success: false,
        message: 'Please enter an email address'
      });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/admin/fix-auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      
      setResult({
        success: response.ok,
        message: data.message || (response.ok ? 'Admin role added successfully' : 'Failed to add admin role')
      });
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'An unexpected error occurred'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-lg border bg-card shadow-sm mb-6">
      <div className="p-4">
        <h3 className="font-medium mb-2">Fix Admin Authorization</h3>
        
        <div className="text-sm text-muted-foreground mb-4">
          <p>Current user: {session?.user?.email || 'Not signed in'}</p>
          <p>Current roles: {session?.user?.roles ? JSON.stringify(session.user.roles) : 'None'}</p>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="email">
              User Email to Add Admin Role
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter user email"
              className="w-full md:w-80 rounded-md border border-input px-3 py-2 text-sm"
            />
          </div>
          
          <button
            onClick={addAdminRole}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Add Admin Role'}
          </button>
          
          {result && (
            <div className={`mt-4 p-3 rounded-md text-sm ${result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {result.message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
