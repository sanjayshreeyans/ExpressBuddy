import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Eye, EyeOff, ShieldCheck, Sparkles } from 'lucide-react';

import { useSupabaseAuth } from '../../contexts/SupabaseAuthContext';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/card';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';

type AuthMode = 'login' | 'signup';

const containerClass = 'mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8';

export default function AuthPage() {
  const navigate = useNavigate();
  const { isAuthenticated, signIn, signUp } = useSupabaseAuth();

  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const modeCopy = useMemo(() => {
    return mode === 'login'
      ? {
          title: 'Welcome back!',
          description: 'Sign in to keep supporting your child with personalized AI-powered guidance.',
          buttonLabel: 'Sign In',
        }
      : {
          title: 'Lets get started!',
          description: 'Start your trial and unlock tailored learning paths crafted for children with autism and speech delays.',
          buttonLabel: 'Create Account',
        };
  }, [mode]);

  const toggleMode = (nextMode: AuthMode) => {
    if (mode === nextMode) return;
    setMode(nextMode);
    setError('');
    setMessage('');
    setFirstName('');
    setLastName('');
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setIsSubmitting(true);

    try {
      if (mode === 'login') {
        const { error: signInError } = await signIn(email, password);
        if (signInError) {
          setError(signInError.message || 'We could not sign you in. Please check your credentials.');
        }
      } else {
        // Validate first and last name for signup
        if (!firstName.trim() || !lastName.trim()) {
          setError('Please enter your first and last name.');
          setIsSubmitting(false);
          return;
        }

        const { error: signUpError } = await signUp(email, password, firstName.trim(), lastName.trim());
        if (signUpError) {
          setError(signUpError.message || 'We could not create your account.');
        } else {
          setMessage('Account created successfully! You can now sign in.');
        }
      }
    } catch (err) {
      console.error('Authentication error', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-white overflow-hidden">
      {/* Decorative background elements matching landing page */}
      <div className="absolute -right-24 top-[-120px] h-[420px] w-[420px] rounded-full bg-[#fff1da] blur-[1px]" />
      <div className="absolute right-16 top-24 h-40 w-40 rounded-full bg-[#f8d698]/70 blur-2xl" />
      <div className="absolute left-[-10%] bottom-1/4 h-[300px] w-[300px] rounded-full bg-[#ff946d]/20 blur-3xl" />
      
      <div className={`${containerClass} py-16 relative z-10`}>
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)] lg:items-center">
          <div className="space-y-8">
            <p className="font-['Poppins',sans-serif] text-sm font-semibold uppercase tracking-[0.35em] text-[#df6951]">
              Trusted by Families
            </p>
            <div className="space-y-6">
              <h1 className="font-['Volkhov',serif] text-[42px] leading-tight text-[#181e4b] sm:text-[52px] sm:leading-[60px]">
                ExpressBuddy
              </h1>
              <p className="max-w-xl font-['Poppins',sans-serif] text-lg leading-[30px] text-[#5e6282]">
                AI-powered learning companion designed to help children build confidence, communication, and social skills through personalized interactions.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="border-none bg-white shadow-sm">
                <CardContent className="flex items-start gap-3 p-5">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-teal-100 text-teal-700">
                    <ShieldCheck className="h-5 w-5" />
                  </span>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-slate-700">Private & COPPA compliant</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-none bg-white shadow-sm">
                <CardContent className="flex items-start gap-3 p-5">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 text-orange-700">
                    <Sparkles className="h-5 w-5" />
                  </span>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-slate-700">Specialized for neurodivergent learners</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <Card className="mx-auto w-full max-w-md overflow-hidden rounded-[36px] border-none bg-gradient-to-b from-white via-[#f9f3ff] to-[#ffe8d6] shadow-[0_60px_120px_-80px_rgba(24,30,75,0.55)]">
            <CardHeader className="space-y-4 p-8">
              <div className="grid grid-cols-2 gap-2 rounded-[12px] bg-[#f7f7f7] p-1">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => toggleMode('login')}
                  disabled={isSubmitting}
                  className={cn(
                    "h-10 rounded-[8px] font-['Poppins',sans-serif] text-sm font-medium transition",
                    mode === 'login'
                      ? 'bg-white text-[#1e88e5] shadow-sm'
                      : 'text-[#5e6282] hover:text-[#181e4b]'
                  )}
                >
                  Sign in
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => toggleMode('signup')}
                  disabled={isSubmitting}
                  className={cn(
                    "h-10 rounded-[8px] font-['Poppins',sans-serif] text-sm font-medium transition",
                    mode === 'signup'
                      ? 'bg-white text-[#1e88e5] shadow-sm'
                      : 'text-[#5e6282] hover:text-[#181e4b]'
                  )}
                >
                  Create account
                </Button>
              </div>
              <CardTitle className="font-['Volkhov',serif] text-[28px] leading-tight text-[#181e4b]">
                {modeCopy.title}
              </CardTitle>
              <CardDescription className="font-['Poppins',sans-serif] text-base leading-[28px] text-[#5e6282]">
                {modeCopy.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-5" onSubmit={handleSubmit}>
                {error && (
                  <Alert variant="destructive">
                    <AlertTitle>Authentication failed</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                {message && (
                  <Alert className="border-teal-200 bg-teal-50 text-teal-800">
                    <AlertTitle>Check your inbox</AlertTitle>
                    <AlertDescription>{message}</AlertDescription>
                  </Alert>
                )}

                {/* First and Last Name for Signup */}
                {mode === 'signup' && (
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        type="text"
                        value={firstName}
                        onChange={(event) => setFirstName(event.target.value)}
                        placeholder="First name"
                        autoComplete="given-name"
                        required
                        disabled={isSubmitting}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        type="text"
                        value={lastName}
                        onChange={(event) => setLastName(event.target.value)}
                        placeholder="Last name"
                        autoComplete="family-name"
                        required
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                )}

                <div className="grid gap-2">
                  <Label htmlFor="email">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <span className="text-xs text-slate-500">Minimum 8 characters</span>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="••••••••"
                      autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                      required
                      disabled={isSubmitting}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500 transition hover:text-slate-700"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-12 rounded-[10px] bg-[#f1a501] font-['Poppins',sans-serif] text-sm font-semibold text-white shadow-[0_22px_40px_-20px_rgba(241,165,1,0.75)] transition hover:bg-[#ffbb37]"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {mode === 'login' ? 'Signing in…' : 'Creating account…'}
                    </span>
                  ) : (
                    modeCopy.buttonLabel
                  )}
                </Button>
              </form>
            </CardContent>
            <CardFooter className="flex flex-col gap-2 text-center font-['Poppins',sans-serif] text-xs text-[#5e6282] p-8">
              <p>
                By continuing you agree to our&nbsp;
                <button
                  type="button"
                  className="font-medium text-[#1e88e5] hover:underline"
                  onClick={() => window.open('/privacy', '_blank')}
                >
                  Privacy Policy
                </button>
                &nbsp;and&nbsp;
                <button
                  type="button"
                  className="font-medium text-[#1e88e5] hover:underline"
                  onClick={() => window.open('/terms', '_blank')}
                >
                  Terms of Service
                </button>
                .
              </p>
              {mode === 'login' ? (
                <p>
                  Need an account?{' '}
                  <button
                    type="button"
                    className="font-medium text-[#1e88e5] hover:underline"
                    onClick={() => toggleMode('signup')}
                  >
                    Create one
                  </button>
                </p>
              ) : (
                <p>
                  Already registered?{' '}
                  <button
                    type="button"
                    className="font-medium text-[#1e88e5] hover:underline"
                    onClick={() => toggleMode('login')}
                  >
                    Sign in
                  </button>
                </p>
              )}
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
