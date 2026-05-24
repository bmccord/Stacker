import { Outlet, Link, useLocation } from 'react-router-dom';
import { Library } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PublicLayout() {
  const location = useLocation();
  const isSignIn = location.pathname === '/sign-in';

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="bg-primary text-primary-foreground px-6 py-3 flex items-center justify-between flex-shrink-0">
        <Link to="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
          <Library className="h-6 w-6" />
          <span className="text-xl font-bold tracking-tight">Stacker</span>
        </Link>
        {!isSignIn && (
          <Button asChild variant="secondary" size="sm">
            <Link to="/sign-in">Sign In</Link>
          </Button>
        )}
      </div>
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
