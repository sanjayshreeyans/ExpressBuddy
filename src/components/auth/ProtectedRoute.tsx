import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSupabaseAuth } from '../../contexts/SupabaseAuthContext';
import { useUser } from '../../contexts/UserContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiresProfile?: boolean;
}

export default function ProtectedRoute({ children, requiresProfile = false }: ProtectedRouteProps) {
  const { isAuthenticated, loading: authLoading } = useSupabaseAuth();
  const { child, loading: userLoading, isFirstTimeUser } = useUser();

  const isLoading = authLoading || userLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // No need for onboarding redirect - profile is created during signup

  return <>{children}</>;
}
