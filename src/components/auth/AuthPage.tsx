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
          title: 'Welcome back to ExpressBuddy',
          description: 'Sign in to keep supporting your child with personalized AI-powered guidance.',
          buttonLabel: 'Sign In',
        }
      : {
          title: 'Create your ExpressBuddy account',
          description: 'Start your trial and unlock tailored learning paths crafted for children with autism and speech delays.',
          buttonLabel: 'Create Account',
        };
  }, [mode]);

  const toggleMode = (nextMode: AuthMode) => {
    if (mode === nextMode) return;
    setMode(nextMode);
    setError('');
    setMessage('');
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
        const { error: signUpError } = await signUp(email, password);
        if (signUpError) {
          setError(signUpError.message || 'We could not create your account.');
        } else {
          setMessage('Account created. Please check your email to verify your address before signing in.');
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
    <div className="min-h-screen bg-slate-50 py-16">
      <div className={containerClass}>
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)] lg:items-center">
          <div className="space-y-8">
            <Badge variant="outline" className="w-fit rounded-full border-teal-200 bg-teal-50 px-3 py-1 text-sm font-medium text-teal-700">
              Families first
            </Badge>
            <div className="space-y-4">
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                Secure access to ExpressBuddy
              </h1>
              <p className="text-lg text-slate-600">
                ExpressBuddy pairs breakthrough AI with evidence-based therapy practices to build confidence, communication, and social skills tailored to every child.
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
                    <p className="text-sm text-slate-500">Your child’s data stays secure and in your control.</p>
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
                    <p className="text-sm text-slate-500">Built with clinicians and families to support autism and speech delays.</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <Card className="mx-auto w-full max-w-md border border-slate-200 bg-white shadow-sm">
            <CardHeader className="space-y-1">
              <div className="grid grid-cols-2 gap-2 rounded-lg bg-slate-100 p-1">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => toggleMode('login')}
                  disabled={isSubmitting}
                  className={cn(
                    'h-10 text-sm font-medium transition',
                    mode === 'login'
                      ? 'bg-white text-teal-700 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
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
                    'h-10 text-sm font-medium transition',
                    mode === 'signup'
                      ? 'bg-white text-teal-700 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  )}
                >
                  Create account
                </Button>
              </div>
              <CardTitle className="text-2xl font-semibold text-slate-900">
                {modeCopy.title}
              </CardTitle>
              <CardDescription className="text-base text-slate-600">
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
                  className="w-full bg-teal-600 text-white transition hover:bg-teal-700"
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
            <CardFooter className="flex flex-col gap-2 text-center text-xs text-slate-500">
              <p>
                By continuing you agree to our&nbsp;
                <button
                  type="button"
                  className="font-medium text-teal-700 hover:underline"
                  onClick={() => window.open('/privacy', '_blank')}
                >
                  Privacy Policy
                </button>
                &nbsp;and&nbsp;
                <button
                  type="button"
                  className="font-medium text-teal-700 hover:underline"
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
                    className="font-medium text-teal-700 hover:underline"
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
                    className="font-medium text-teal-700 hover:underline"
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
