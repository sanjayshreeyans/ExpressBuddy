import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useKindeAuth } from '@kinde-oss/kinde-auth-react';
import { SignInPage } from '../ui/sign-in';

export default function AuthPage() {
  const navigate = useNavigate();
  const { login, register } = useKindeAuth();


  const handleSignInSubmit = () => {
    login();
  };

  const handleGoogleSignIn = () => {
    login();
  };


  const handleCreateAccount = () => {
    register();
  };

  const handleResetPassword = () => {
    console.log('Reset password clicked');
  };

  return (
    <SignInPage
      title={
        <span className="font-light text-gray-800 tracking-tighter">
          Welcome to <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-bold">ExpressBuddy</span>
        </span>
      }
      description="Sign in to start your child's learning journey with personalized AI support"
      onSignIn={handleSignInSubmit}
      onSignUp={handleCreateAccount}

    />
  );
}
