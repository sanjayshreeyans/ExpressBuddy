import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useKindeAuth } from '@kinde-oss/kinde-auth-react';
import { SignInPage } from '../ui/sign-in';

export default function AuthPage() {
  const navigate = useNavigate();
  const { login, register } = useKindeAuth();

  const handleSignInSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
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
      heroImageSrc="hero"
      onSignIn={handleSignInSubmit}
      onGoogleSignIn={handleGoogleSignIn}
      onCreateAccount={handleCreateAccount}
      onResetPassword={handleResetPassword}
      testimonials={[
        {
          avatarSrc: "https://images.unsplash.com/photo-1494790108755-2616c33ec826?w=150&h=150&fit=crop&crop=face",
          name: "Sarah M.",
          handle: "@sarahm",
          text: "ExpressBuddy helped my son with autism express his emotions better. Amazing results!"
        },
        {
          avatarSrc: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face", 
          name: "Mike D.",
          handle: "@miked",
          text: "The AI companion is so patient and understanding. Perfect for children with social anxiety."
        }
      ]}
    />
  );
}
