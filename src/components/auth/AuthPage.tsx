import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabaseAuth } from '../../contexts/SupabaseAuthContext';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '../../lib/supabase';

export default function AuthPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useSupabaseAuth();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-light text-gray-800 tracking-tighter mb-2">
            Welcome to <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-bold">ExpressBuddy</span>
          </h1>
          <p className="text-gray-600 mt-2">
            Sign in to start your child's learning journey with personalized AI support
          </p>
        </div>

        <div className="bg-white py-8 px-6 shadow-xl rounded-lg border border-gray-100">
          <Auth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: '#2563eb',
                    brandAccent: '#1d4ed8',
                  },
                },
              },
            }}
            providers={[]}
            redirectTo={`${window.location.origin}/dashboard`}
          />
        </div>

        <p className="text-center text-sm text-gray-600">
          By signing in, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}
