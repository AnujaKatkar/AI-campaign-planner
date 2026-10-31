import { useState, type FormEvent } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import Logo from '@/components/Logo';
import { supabase } from '@/lib/supabase';

type AuthPageProps = {
  onAuthed: () => void;
  onBack: () => void;
};

type Mode = 'signin' | 'signup';

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  invalid_credentials: 'That email and password do not match. Try again.',
  user_already_exists: 'An account with this email already exists. Sign in instead.',
  email_exists: 'An account with this email already exists. Sign in instead.',
  weak_password: 'That password is too easy to guess. Try a longer one that is not used elsewhere.',
  email_address_invalid: 'That email address does not look right. Check it and try again.',
  over_email_send_rate_limit: 'Too many attempts. Wait a few minutes and try again.',
  over_request_rate_limit: 'Too many attempts. Wait a few minutes and try again.',
};

function friendlyError(err: unknown): string {
  const code = (err as { code?: string } | null)?.code;
  if (code && AUTH_ERROR_MESSAGES[code]) return AUTH_ERROR_MESSAGES[code];
  return 'Something went wrong. Check your connection and try again.';
}

export default function AuthPage({ onAuthed, onBack }: AuthPageProps) {
  const [mode, setMode] = useState<Mode>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const isSignup = mode === 'signup';

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (isSignup) {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { name: email.split('@')[0] } },
        });
        if (signUpError) throw signUpError;
        if (!data.session) {
          const { error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
          if (signInError) throw signInError;
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (signInError) throw signInError;
      }
      onAuthed();
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-5 py-16">
      <Logo />
      <div className="card mt-10 w-full p-8">
        <h1 className="text-3xl font-extrabold">{isSignup ? 'Create your account' : 'Welcome back'}</h1>
        <p className="mt-2 text-muted">
          {isSignup
            ? 'Save your campaigns so you can come back to them anytime.'
            : 'Sign in to see your saved campaigns.'}
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label htmlFor="auth-email" className="mb-2 block text-sm font-semibold">
              Email
            </label>
            <input
              id="auth-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@yourbusiness.com"
              className="field"
            />
          </div>
          <div>
            <label htmlFor="auth-password" className="mb-2 block text-sm font-semibold">
              Password
            </label>
            <input
              id="auth-password"
              type="password"
              required
              minLength={6}
              autoComplete={isSignup ? 'new-password' : 'current-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="field"
            />
          </div>

          {error && (
            <p role="alert" className="flex items-start gap-2 rounded-2xl bg-rose/10 px-4 py-3 text-sm font-medium text-rose-deep">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              {error}
            </p>
          )}

          <button type="submit" disabled={busy} className="btn-press w-full">
            {busy && <Loader2 className="h-5 w-5 animate-spin" aria-hidden />}
            {isSignup ? 'Create account' : 'Sign in'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          {isSignup ? 'Already have an account?' : 'New here?'}{' '}
          <button
            type="button"
            onClick={() => {
              setError(null);
              setMode(isSignup ? 'signin' : 'signup');
            }}
            className="font-bold text-teal underline-offset-4 hover:underline"
          >
            {isSignup ? 'Sign in' : 'Create an account'}
          </button>
        </p>
      </div>
      <button type="button" onClick={onBack} className="mt-6 text-sm font-semibold text-muted hover:text-ink">
        Back to home
      </button>
    </div>
  );
}
