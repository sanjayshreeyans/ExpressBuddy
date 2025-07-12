/**
 * Test Authentication Page Component
 * Minimal implementation to test Kinde imports
 */

import React from 'react';
import { useKindeAuth } from '@kinde-oss/kinde-auth-react';
import { Button } from '../ui/button';

interface TestAuthPageProps {
  onBack: () => void;
}

export default function TestAuthPage({ onBack }: TestAuthPageProps) {
  const { login, register, isAuthenticated, isLoading } = useKindeAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold">Authentication Test</h1>
        
        <div className="space-y-2">
          <Button onClick={() => login()}>
            Sign In
          </Button>
          <Button onClick={() => register()}>
            Sign Up
          </Button>
          <Button onClick={onBack} variant="outline">
            Back to Landing
          </Button>
        </div>
        
        <p>Is Authenticated: {isAuthenticated ? 'Yes' : 'No'}</p>
      </div>
    </div>
  );
}
