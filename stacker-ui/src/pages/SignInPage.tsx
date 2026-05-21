import { useState } from 'react';
import { useMutation } from '@apollo/client/react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/use-auth';
import { SIGN_IN } from '@/graphql/queries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { extractErrorMessage } from '@/lib/errors';
import { BookOpen } from 'lucide-react';

export default function SignInPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [doSignIn, { loading }] = useMutation<{
    signIn: { token: string; user: { id: string; email: string; firstName?: string; lastName?: string; emailVerified?: boolean } };
  }>(SIGN_IN);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const { data } = await doSignIn({ variables: { email: email.trim(), password } });
      if (data) {
        signIn(data.signIn.token, data.signIn.user);
        navigate('/app');
      }
    } catch (err) {
      toast({ variant: 'destructive', title: 'Sign in failed', description: extractErrorMessage(err) });
    }
  }

  return (
    <div className="flex-1 flex items-center justify-center py-16 px-4 bg-gradient-to-b from-primary/5 to-transparent">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <BookOpen className="h-12 w-12 mx-auto mb-4 text-primary" />
          <h1 className="text-2xl font-bold text-primary">Stacker</h1>
          <p className="text-sm text-muted-foreground mt-1">Sign in to your account</p>
        </div>

        <div className="rounded-xl border border-border bg-white shadow-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                autoFocus
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="password" className="text-sm font-medium">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
            <p className="text-center">
              <Link to="/forgot-password" className="text-sm text-primary hover:text-primary/80">Forgot password?</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
