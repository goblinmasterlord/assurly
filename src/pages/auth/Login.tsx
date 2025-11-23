import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, ArrowRight, Shield, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { loginRateLimiter } from '@/lib/rate-limiter';
import { z } from 'zod';

// Email validation schema
const emailSchema = z.string().email('Please enter a valid email address').max(255);

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate email format
    try {
      emailSchema.parse(email);
    } catch (error) {
      toast({
        title: 'Invalid email',
        description: 'Please enter a valid email address',
        variant: 'destructive',
      });
      return;
    }

    // Check rate limiting
    const rateLimitCheck = loginRateLimiter.checkLimit(email.toLowerCase());
    if (!rateLimitCheck.allowed) {
      toast({
        title: 'Too many attempts',
        description: `Please try again in ${rateLimitCheck.retryAfter} seconds`,
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      await login({ email: email.toLowerCase().trim() });
      setIsSuccess(true);
      // Reset rate limit on successful request
      loginRateLimiter.reset(email.toLowerCase());
      toast({
        title: 'Magic link sent!',
        description: `We've sent a login link to ${email}. Please check your inbox.`,
      });
    } catch (error: any) {
      // Show remaining attempts if rate limited
      const status = loginRateLimiter.checkLimit(email.toLowerCase());
      const description = status.remainingAttempts 
        ? `${error.message || 'Please try again later'} (${status.remainingAttempts} attempts remaining)`
        : error.message || 'Please try again later';
      
      toast({
        title: 'Failed to send magic link',
        description,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };


  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
              <Mail className="h-6 w-6 text-emerald-600" />
            </div>
            <CardTitle className="text-2xl">Check your email</CardTitle>
            <CardDescription className="mt-2">
              We've sent a magic link to <span className="font-medium text-slate-900">{email}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-slate-50 rounded-lg p-4 space-y-3">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-1 h-1 rounded-full bg-slate-400 mt-2"></div>
                <p className="text-sm text-slate-600">Check your inbox for an email from Assurly</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-1 h-1 rounded-full bg-slate-400 mt-2"></div>
                <p className="text-sm text-slate-600">Click the secure link to access your dashboard</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-1 h-1 rounded-full bg-slate-400 mt-2"></div>
                <p className="text-sm text-slate-600">The link will expire in 15 minutes for security</p>
              </div>
            </div>
            <div className="text-center text-sm text-slate-500">
              Didn't receive the email? Check your spam folder or{' '}
              <button
                onClick={() => {
                  setIsSuccess(false);
                  setEmail('');
                }}
                className="text-blue-600 hover:underline"
              >
                try again
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Shield className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">Welcome to Assurly</CardTitle>
          <CardDescription>
            Sign in to access your assessment dashboard
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-slate-700">
                Email address
              </label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
                required
                className="w-full"
                autoComplete="email"
                autoFocus
              />
            </div>
            <div className="text-xs text-slate-500">
              We'll send you a magic link to sign in. No password needed!
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-3">
            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting || !email}
            >
              {isSubmitting ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Sending magic link...
                </>
              ) : (
                <>
                  Send magic link
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
            
            <div className="text-center text-xs text-slate-500">
              By signing in, you agree to our{' '}
              <Link to="/terms" className="text-blue-600 hover:underline">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link to="/dpa" className="text-blue-600 hover:underline">
                Data Processing Agreement
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}