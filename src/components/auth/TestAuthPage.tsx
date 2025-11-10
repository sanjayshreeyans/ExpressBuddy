/**
 * Test Authentication Page Component
 * Minimal implementation to test Supabase auth
 */

import React from 'react';
import { useSupabaseAuth } from '../../contexts/SupabaseAuthContext';
import { Button } from '../ui/button';
import { useNavigate } from 'react-router-dom';

interface TestAuthPageProps {
  onBack: () => void;
}

export default function TestAuthPage({ onBack }: TestAuthPageProps) {
  const { isAuthenticated, loading } = useSupabaseAuth();
  const navigate = useNavigate();

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold">Authentication Test</h1>
        
        <div className="space-y-2">
          <Button onClick={() => navigate('/login')}>
            Go to Login
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
