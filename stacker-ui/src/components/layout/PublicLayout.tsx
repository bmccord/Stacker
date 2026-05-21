import { Outlet, Link } from 'react-router-dom';
import { BookOpen } from 'lucide-react';

export default function PublicLayout() {
  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="bg-primary text-primary-foreground px-6 py-3 flex items-center justify-between flex-shrink-0">
        <Link to="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
          <BookOpen className="h-6 w-6" />
          <span className="text-xl font-bold tracking-tight">Stacker</span>
        </Link>
      </div>
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
