import React, { useState } from 'react';
import { Button } from '@/components/ui/button';

export function TestStorageConnection() {
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  const testConnection = async () => {
    setStatus('Testing connection...');
    setError('');

    try {
      const response = await fetch('/api/healthz');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Connection test failed');
      }

      const data = await response.json();
      
      if (data.status === 'healthy') {
        setStatus(`✅ Connection successful!
        Latency: ${data.latency}ms
        Collections: ${data.schemas.collections.join(', ') || 'none'}`);
      } else {
        throw new Error(data.message || 'Connection test failed');
      }
    } catch (err) {
      console.error('Connection test failed:', err);
      setError(`❌ Test failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setStatus('');
    }
  };

  return (
    <div className="space-y-4">
      <Button onClick={testConnection} variant="outline">
        Test Database Connection
      </Button>
      {status && (
        <pre className="p-4 bg-gray-100 dark:bg-gray-900 rounded-lg whitespace-pre-wrap">
          {status}
        </pre>
      )}
      {error && (
        <pre className="p-4 bg-red-50 dark:bg-red-900/20 text-red-900 dark:text-red-300 rounded-lg whitespace-pre-wrap">
          {error}
        </pre>
      )}
    </div>
  );
}
