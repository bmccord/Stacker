import { useState } from 'react';
import { useMutation } from '@apollo/client/react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '@/lib/use-auth';
import { RESET_PASSWORD } from '@/graphql/queries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { extractErrorMessage } from '@/lib/errors';

export default function ResetPasswordPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [doReset, { loading }] = useMutation<{
    resetPassword: { token: string; user: { id: string; email: string; firstName?: string; lastName?: string; emailVerified?: boolean } };
  }>(RESET_PASSWORD);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({ variant: 'destructive', title: 'Passwords do not match' });
      return;
    }
    try {
      const { data } = await doReset({ variables: { token, password } });
      if (data) {
        signIn(data.resetPassword.token, data.resetPassword.user);
        navigate('/app');
      }
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: extractErrorMessage(err) });
    }
  }

  if (!token) {
    return (
      <div className="flex-1 flex items-center justify-center py-16 px-4">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-primary">Invalid Reset Link</h1>
          <p className="text-muted-foreground">This password reset link is invalid or has expired.</p>
          <Link to="/forgot-password" className="text-primary hover:text-primary/80 font-medium text-sm">Request a new link</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex items-center justify-center py-16 px-4 bg-gradient-to-b from-primary/5 to-transparent">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-primary">Set New Password</h1>
          <p className="text-sm text-muted-foreground mt-1">Choose a new password for your account.</p>
        </div>

        <div className="rounded-xl border border-border bg-white shadow-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="password">New Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} autoFocus />
            </div>
            <div className="space-y-1">
              <Label htmlFor="confirm">Confirm Password</Label>
              <Input id="confirm" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={8} />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Resetting...' : 'Reset Password'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
