import { Library, LogIn, LogOut } from 'lucide-react';
import Logo from '@/components/Logo';

type SiteHeaderProps = {
  signedIn: boolean;
  onHome: () => void;
  onLibrary: () => void;
  onSignIn: () => void;
  onSignOut: () => void;
};

export default function SiteHeader({ signedIn, onHome, onLibrary, onSignIn, onSignOut }: SiteHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-cream/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3">
        <button type="button" onClick={onHome} aria-label="Flaunt home" className="rounded-xl">
          <Logo />
        </button>
        <nav className="flex items-center gap-1">
          {signedIn ? (
            <>
              <button type="button" onClick={onLibrary} className="nav-link">
                <Library className="h-4 w-4" aria-hidden /> My campaigns
              </button>
              <button type="button" onClick={onSignOut} className="nav-link">
                <LogOut className="h-4 w-4" aria-hidden /> Sign out
              </button>
            </>
          ) : (
            <button type="button" onClick={onSignIn} className="nav-link">
              <LogIn className="h-4 w-4" aria-hidden /> Sign in
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
