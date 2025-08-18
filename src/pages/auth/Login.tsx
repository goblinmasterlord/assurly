import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, ArrowRight, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: 'Email required',
        description: 'Please enter your email address',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      await login({ email });
      setIsSuccess(true);
      toast({
        title: 'Magic link sent!',
        description: `We've sent a login link to ${email}. Please check your inbox.`,
      });
    } catch (error: any) {
      toast({
        title: 'Failed to send magic link',
        description: error.message || 'Please try again later',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Development mode bypass for testing
  const handleDevBypass = () => {
    if (import.meta.env.DEV) {
      // In development, create a mock session
      const mockUser = {
        id: 'dev-user-1',
        email: 'dev@example.com',
        name: 'Development User',
        role: 'department-head' as const,
        schools: ['school-1']
      };
      
      // Store a mock token
      sessionStorage.setItem('assurly_auth_token', 'dev-token-12345');
      
      // Navigate to assessments
      toast({
        title: 'Development Mode',
        description: 'Logged in with mock credentials',
      });
      
      // Force a page reload to reinitialize auth
      window.location.href = '/assessments';
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
            <div className="bg-slate-50 rounded-lg p-4 text-sm text-slate-600">
              <p className="mb-2">📧 Click the link in your email to sign in</p>
              <p className="mb-2">⏱️ The link expires in 10 minutes</p>
              <p>🔒 You can safely close this window</p>
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
            
            {/* Development mode bypass */}
            {import.meta.env.DEV && (
              <div className="mt-4 pt-4 border-t border-slate-200">
                <p className="text-xs text-slate-500 text-center mb-2">Development Mode Only:</p>
                <Button
                  onClick={handleDevBypass}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  Skip email verification (Dev)
                </Button>
              </div>
            )}
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
            
            {/* Development mode quick login */}
            {import.meta.env.DEV && (
              <Button
                type="button"
                onClick={handleDevBypass}
                variant="ghost"
                size="sm"
                className="w-full text-xs"
              >
                Quick login (Development only)
              </Button>
            )}
            
            <div className="text-center text-xs text-slate-500">
              By signing in, you agree to our{' '}
              <Link to="/terms" className="text-blue-600 hover:underline">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link to="/privacy" className="text-blue-600 hover:underline">
                Privacy Policy
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}