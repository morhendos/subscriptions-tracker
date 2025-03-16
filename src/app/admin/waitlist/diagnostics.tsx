'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, Database, ServerCrash, Search, CheckCircle2 } from 'lucide-react';

// Simple function to test the database directly
async function testDatabaseConnection() {
  try {
    const response = await fetch('/api/admin/test-connection', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ test: true }),
    });
    
    if (!response.ok) {
      throw new Error(`Server responded with status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Test connection error:', error);
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export default function WaitlistDiagnostics() {
  const [isOpen, setIsOpen] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const runTests = async () => {
    setIsLoading(true);
    try {
      const results = await testDatabaseConnection();
      setTestResults(results);
    } catch (error) {
      setTestResults({ error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="rounded-lg border bg-card shadow-sm mb-6">
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          <h3 className="font-medium">Waitlist Diagnostics</h3>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          {isOpen ? 'Hide Details' : 'Show Details'}
        </button>
      </div>
      
      {isOpen && (
        <div className="px-4 pb-4 space-y-4">
          <div className="text-sm text-muted-foreground">
            <p>This diagnostic panel will help troubleshoot issues with the waitlist data.</p>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium flex items-center gap-2 text-sm">
              <Database className="h-4 w-4" />
              Manual Inspection
            </h4>
            <ul className="list-disc pl-6 text-sm space-y-1">
              <li>Check MongoDB for a collection named exactly <code className="bg-muted px-1 py-0.5 rounded">waitlist</code> (not waitlists)</li>
              <li>Verify the current user has the <code className="bg-muted px-1 py-0.5 rounded">admin</code> role in their user document</li>
              <li>Check server logs for any errors related to database connections</li>
            </ul>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium flex items-center gap-2 text-sm">
              <Search className="h-4 w-4" />
              Common Issues
            </h4>
            <ul className="list-disc pl-6 text-sm space-y-1">
              <li>Collection name mismatch (expected 'waitlist' but might be different)</li>
              <li>Authentication issues (user missing admin role)</li>
              <li>Schema mismatch (database field names don't match model)</li>
              <li>MongoDB connection string issues</li>
            </ul>
          </div>
          
          <div className="pt-2">
            <p className="text-sm text-muted-foreground mb-2">The server logs should contain detailed information about database operations. Look for lines containing "[ADMIN ACTIONS]", "[WAITLIST MODEL]" prefixes.</p>
            
            {/* Add test data button */}
            <div className="pt-2 flex flex-wrap gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`
db.waitlist.insertOne({
  email: "test@example.com",
  name: "Test User",
  status: "active",
  tags: ["test", "sample"],
  createdAt: new Date(),
  updatedAt: new Date()
})
                  `.trim());
                  alert("MongoDB command copied to clipboard! Run this in your MongoDB shell to add a test entry.");
                }}
                className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium bg-blue-50 text-blue-700 hover:bg-blue-100"
              >
                <CheckCircle2 className="h-4 w-4" />
                Copy Test Data Command
              </button>
              
              <button
                onClick={runTests}
                disabled={isLoading}
                className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80"
              >
                <ServerCrash className="h-4 w-4" />
                {isLoading ? 'Testing...' : 'Test Database Connection'}
              </button>
            </div>
            
            {testResults && (
              <div className="mt-4 p-3 bg-muted rounded-md text-sm">
                <pre className="overflow-x-auto">{JSON.stringify(testResults, null, 2)}</pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
