import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

export default function VerifyPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { verifyToken } = useAuth();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (!token) {
      setStatus('error');
      setErrorMessage('No verification token provided');
      return;
    }

    const verify = async () => {
      try {
        await verifyToken({ token });
        setStatus('success');
      } catch (error: any) {
        setStatus('error');
        setErrorMessage(error.message || 'Failed to verify token');
      }
    };

    verify();
  }, [searchParams, verifyToken]);

  if (status === 'verifying') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
            </div>
            <CardTitle className="text-2xl">Verifying your login</CardTitle>
            <CardDescription>
              Please wait while we verify your magic link...
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center">
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <div className="bg-blue-600 h-full rounded-full animate-pulse" style={{ width: '70%' }} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-6 w-6 text-emerald-600" />
            </div>
            <CardTitle className="text-2xl">Login successful!</CardTitle>
            <CardDescription>
              You've been successfully authenticated. Redirecting to your dashboard...
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center text-sm text-slate-500">
              If you're not redirected automatically,{' '}
              <button
                onClick={() => navigate('/assessments')}
                className="text-blue-600 hover:underline"
              >
                click here
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
          <div className="mx-auto w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mb-4">
            <XCircle className="h-6 w-6 text-rose-600" />
          </div>
          <CardTitle className="text-2xl">Verification failed</CardTitle>
          <CardDescription>
            {errorMessage || 'The magic link is invalid or has expired'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-slate-50 rounded-lg p-4 text-sm text-slate-600">
            <p className="mb-2">This could happen if:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>The link has expired (links are valid for 10 minutes)</li>
              <li>The link has already been used</li>
              <li>The link was copied incorrectly</li>
            </ul>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => navigate('/auth/login')}
              className="flex-1"
            >
              Request new link
            </Button>
            <Button
              onClick={() => navigate('/')}
              variant="outline"
              className="flex-1"
            >
              Go to home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}