import { useState } from 'react';
import { useMutation } from '@apollo/client/react';
import { Link } from 'react-router-dom';
import { REQUEST_PASSWORD_RESET } from '@/graphql/queries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { extractErrorMessage } from '@/lib/errors';

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [doReset, { loading }] = useMutation(REQUEST_PASSWORD_RESET);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await doReset({ variables: { email: email.trim() } });
      setSent(true);
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: extractErrorMessage(err) });
    }
  }

  return (
    <div className="flex-1 flex items-center justify-center py-16 px-4 bg-gradient-to-b from-primary/5 to-transparent">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-primary">Reset Password</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {sent ? 'Check your email for a reset link.' : 'Enter your email to receive a reset link.'}
          </p>
        </div>

        {!sent && (
          <div className="rounded-xl border border-border bg-white shadow-lg p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Sending...' : 'Send Reset Link'}
              </Button>
            </form>
          </div>
        )}

        <p className="text-center text-sm text-muted-foreground mt-4">
          <Link to="/sign-in" className="text-primary hover:text-primary/80 font-medium">Back to Sign In</Link>
        </p>
      </div>
    </div>
  );
}
