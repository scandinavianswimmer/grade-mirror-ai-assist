import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LayoutDashboard, Sparkles, GraduationCap, LogOut, User, ChevronDown, Feather, CreditCard, BarChart3, History } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/lib/supabase';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  const getInitials = (email: string) => email.substring(0, 2).toUpperCase();

  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/submit-assignment', label: 'Grade', icon: Sparkles },
    { path: '/upload-training', label: 'Train', icon: GraduationCap },
    { path: '/metrics', label: 'Metrics', icon: BarChart3 },
    { path: '/history', label: 'History', icon: History },
  ];

  return (
    <>
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <nav aria-label="Primary navigation" className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between gap-6">
          <div className="flex items-center gap-8">
            <Link to="/" className="group flex items-center gap-2.5">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground shadow-sm transition-transform group-hover:-rotate-6">
                <Feather aria-hidden="true" className="h-[18px] w-[18px]" />
              </span>
              <span className="font-display text-[1.6rem] font-semibold leading-none tracking-tight text-foreground">
                ai<span className="text-primary">TA</span>
              </span>
            </Link>

            <div className="hidden items-center gap-1 md:flex">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    aria-current={isActive ? 'page' : undefined}
                    className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    <Icon aria-hidden="true" className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" aria-label="Account menu" className="flex items-center gap-2 px-2 hover:bg-muted">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary text-sm font-medium text-primary-foreground">
                        {getInitials(user.email || '')}
                      </AvatarFallback>
                    </Avatar>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-60">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">Signed in</p>
                      <p className="truncate text-xs leading-none text-muted-foreground">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/profile')} className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile &amp; style</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/billing')} className="cursor-pointer">
                    <CreditCard className="mr-2 h-4 w-4" />
                    <span>Plans &amp; billing</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link to="/auth">
                <Button>Sign in</Button>
              </Link>
            )}
          </div>
        </div>

        <div className="grid grid-cols-5 gap-1 border-t border-border/60 py-1.5 md:hidden">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                aria-current={isActive ? 'page' : undefined}
                className={`flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-md px-1 py-2 text-[11px] font-medium leading-none transition-colors ${
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <Icon aria-hidden="true" className="h-5 w-5 shrink-0" />
                <span className="max-w-full truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
      </nav>
    </>
  );
};

export default Navbar;
