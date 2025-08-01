import React from 'react';
import { Navigate } from 'react-router-dom';
import { useKindeAuth } from '@kinde-oss/kinde-auth-react';
import { useUser } from '../../contexts/UserContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiresProfile?: boolean;
}

export default function ProtectedRoute({ children, requiresProfile = false }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading: kindeLoading } = useKindeAuth();
  const { child, loading: userLoading, isFirstTimeUser } = useUser();

  const isLoading = kindeLoading || userLoading;

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

  // If route requires profile and user is first time, redirect to onboarding
  if (requiresProfile && isFirstTimeUser) {
    return <Navigate to="/onboarding" replace />;
  }

  // If user is on onboarding but already has a profile, redirect to dashboard
  if (window.location.pathname === '/onboarding' && !isFirstTimeUser && child) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
