import { Library, LogIn, LogOut, Moon, Sun } from 'lucide-react';
import Logo from '@/components/Logo';
import { useTheme } from '@/hooks/useTheme';

type SiteHeaderProps = {
  signedIn: boolean;
  onHome: () => void;
  onLibrary: () => void;
  onSignIn: () => void;
  onSignOut: () => void;
};

export default function SiteHeader({ signedIn, onHome, onLibrary, onSignIn, onSignOut }: SiteHeaderProps) {
  const { theme, toggle } = useTheme();
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-cream/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-3 sm:px-5">
        <button type="button" onClick={onHome} aria-label="Flaunt home" className="rounded-xl">
          <Logo />
        </button>
        <nav className="flex items-center gap-1">
          {signedIn ? (
            <>
              <button type="button" onClick={onLibrary} className="nav-link">
                <Library className="h-4 w-4" aria-hidden /> <span className="hidden sm:inline">My campaigns</span>
              </button>
              <button type="button" onClick={onSignOut} className="nav-link" aria-label="Sign out">
                <LogOut className="h-4 w-4" aria-hidden /> <span className="hidden sm:inline">Sign out</span>
              </button>
            </>
          ) : (
            <button type="button" onClick={onSignIn} className="nav-link">
              <LogIn className="h-4 w-4" aria-hidden /> Sign in
            </button>
          )}
          <button
            type="button"
            onClick={toggle}
            className="nav-link !px-2.5"
            aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" aria-hidden /> : <Moon className="h-4 w-4" aria-hidden />}
          </button>
        </nav>
      </div>
    </header>
  );
}
