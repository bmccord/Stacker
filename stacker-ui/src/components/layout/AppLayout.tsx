import { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Menu, BookOpen, Users, Library, PenLine, Shield, BarChart3, LogOut, KeyRound } from 'lucide-react';
import ChangePasswordDialog from './ChangePasswordDialog';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/use-auth';

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    label: 'Content',
    items: [
      { to: '/app', label: 'Dashboard', icon: <BarChart3 className="h-4 w-4" /> },
      { to: '/app/books', label: 'Books', icon: <BookOpen className="h-4 w-4" /> },
      { to: '/app/authors', label: 'Authors', icon: <PenLine className="h-4 w-4" /> },
    ],
  },
  {
    label: 'Administration',
    items: [
      { to: '/app/users', label: 'Users', icon: <Users className="h-4 w-4" /> },
      { to: '/app/groups', label: 'Permission Groups', icon: <Shield className="h-4 w-4" /> },
    ],
  },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation();

  return (
    <div className="flex flex-col gap-4">
      {navSections.map((section) => (
        <div key={section.label}>
          <p className="text-xs font-semibold text-white/50 uppercase tracking-widest mb-2 px-3">
            {section.label}
          </p>
          <nav className="flex flex-col gap-1">
            {section.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/app'}
                onClick={onNavigate}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                    isActive || (item.to !== '/app' && location.pathname.startsWith(item.to))
                      ? 'bg-white/20 text-white'
                      : 'text-white/70 hover:bg-white/10 hover:text-white'
                  )
                }
              >
                {item.icon}
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      ))}
    </div>
  );
}

function SidebarUserMenu() {
  const [changePwOpen, setChangePwOpen] = useState(false);
  const { user, signOut } = useAuth();

  const initials = [user?.firstName, user?.lastName]
    .filter(Boolean)
    .map((n) => n![0])
    .join('')
    .toUpperCase() || '?';

  return (
    <>
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-full bg-white/20 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-white truncate">{user?.firstName} {user?.lastName}</p>
          <p className="text-xs text-white/50 truncate">{user?.email}</p>
        </div>
        <button
          onClick={() => setChangePwOpen(true)}
          className="text-white/50 hover:text-white transition-colors flex-shrink-0"
          title="Change password"
        >
          <KeyRound className="h-4 w-4" />
        </button>
        <button
          onClick={() => { signOut(); window.location.href = '/'; }}
          className="text-white/50 hover:text-white transition-colors flex-shrink-0"
          title="Sign out"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
      <ChangePasswordDialog open={changePwOpen} onOpenChange={setChangePwOpen} />
    </>
  );
}

export default function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="flex h-full overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-primary text-primary-foreground flex-shrink-0">
        <div className="p-4 border-b border-white/10">
          <button
            onClick={() => navigate('/app')}
            className="flex items-center gap-2 text-left text-sm font-bold leading-tight hover:opacity-90 transition-opacity w-full"
          >
            <Library className="h-5 w-5" />
            Stacker
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <SidebarContent />
        </div>
        <div className="p-4 border-t border-white/10">
          <SidebarUserMenu />
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <header className="md:hidden bg-primary text-primary-foreground px-4 py-3 flex items-center justify-between flex-shrink-0">
          <button
            onClick={() => navigate('/app')}
            className="flex items-center gap-2 text-sm font-bold hover:opacity-90 transition-opacity"
          >
            <Library className="h-5 w-5" />
            Stacker
          </button>
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/10"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Open menu</span>
          </Button>
        </header>

        {/* Mobile sheet */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="bg-primary text-white border-r-0 p-0">
            <SheetHeader className="p-4 border-b border-white/10">
              <SheetTitle className="text-white text-sm font-bold text-left">Stacker</SheetTitle>
            </SheetHeader>
            <div className="p-4">
              <SidebarContent onNavigate={() => setMobileOpen(false)} />
            </div>
            <div className="p-4 border-t border-white/10 mt-auto">
              <SidebarUserMenu />
            </div>
          </SheetContent>
        </Sheet>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
