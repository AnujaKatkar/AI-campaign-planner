import { useState, type FormEvent } from 'react';
import { AlertCircle, Loader2, MailCheck } from 'lucide-react';
import Logo from '@/components/Logo';
import { passwordResetRedirect, supabase } from '@/lib/supabase';

type AuthPageProps = {
  onAuthed: () => void;
  onBack: () => void;
  initialMode?: Mode;
};

type Mode = 'signin' | 'signup' | 'forgot' | 'reset';

const COPY: Record<Mode, { title: string; intro: string; submit: string }> = {
  signup: { title: 'Create your account', intro: 'Save your campaigns so you can come back to them anytime.', submit: 'Create account' },
  signin: { title: 'Welcome back', intro: 'Sign in to see your saved campaigns.', submit: 'Sign in' },
  forgot: { title: 'Reset your password', intro: 'Enter your email and we’ll send you a link to choose a new password.', submit: 'Send reset link' },
  reset: { title: 'Choose a new password', intro: 'Pick something you don’t use anywhere else.', submit: 'Save new password' },
};

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  invalid_credentials: 'That email and password do not match. Try again.',
  user_already_exists: 'An account with this email already exists. Sign in instead.',
  email_exists: 'An account with this email already exists. Sign in instead.',
  weak_password: 'That password is too easy to guess. Try a longer one that is not used elsewhere.',
  email_address_invalid: 'That email address does not look right. Check it and try again.',
  over_email_send_rate_limit: 'Too many attempts. Wait a few minutes and try again.',
  over_request_rate_limit: 'Too many attempts. Wait a few minutes and try again.',
  same_password: 'That is your current password. Pick a new one.',
  session_not_found: 'This reset link has expired. Ask for a new one.',
};

function friendlyError(err: unknown): string {
  const { code, name } = (err ?? {}) as { code?: string; name?: string };
  if (code && AUTH_ERROR_MESSAGES[code]) return AUTH_ERROR_MESSAGES[code];
  // An old or already-used reset link leaves no usable session behind.
  if (name === 'AuthSessionMissingError' || code === 'bad_jwt') return AUTH_ERROR_MESSAGES.session_not_found;
  return 'Something went wrong. Check your connection and try again.';
}

export default function AuthPage({ onAuthed, onBack, initialMode = 'signup' }: AuthPageProps) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const isSignup = mode === 'signup';
  const copy = COPY[mode];

  function switchMode(next: Mode) {
    setError(null);
    setResetSent(false);
    setMode(next);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === 'forgot') {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: passwordResetRedirect });
        if (resetError) throw resetError;
        // Same message whether or not the email has an account, so the form can't be used to check.
        setResetSent(true);
        return;
      }
      if (mode === 'reset') {
        const { error: updateError } = await supabase.auth.updateUser({ password });
        if (updateError) throw updateError;
      } else if (isSignup) {
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
        <h1 className="text-3xl font-extrabold">{copy.title}</h1>
        <p className="mt-2 text-muted">{copy.intro}</p>

        {resetSent ? (
          <div className="mt-8 flex items-start gap-3 rounded-2xl bg-sage/10 px-4 py-4 text-sm" role="status">
            <MailCheck className="mt-0.5 h-5 w-5 shrink-0 text-sage" aria-hidden />
            <p>
              If <strong>{email.trim()}</strong> has an account, a reset link is on its way. Open it on this device to choose a new
              password. Nothing there? Check spam, or wait a minute and try again.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {mode !== 'reset' && (
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
            )}
            {mode !== 'forgot' && (
              <div>
                <div className="mb-2 flex items-baseline justify-between">
                  <label htmlFor="auth-password" className="block text-sm font-semibold">
                    {mode === 'reset' ? 'New password' : 'Password'}
                  </label>
                  {mode === 'signin' && (
                    <button type="button" onClick={() => switchMode('forgot')} className="text-sm font-semibold text-teal underline-offset-4 hover:underline">
                      Forgot password?
                    </button>
                  )}
                </div>
                <input
                  id="auth-password"
                  type="password"
                  required
                  minLength={6}
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="field"
                />
              </div>
            )}

            {error && (
              <p role="alert" className="flex items-start gap-2 rounded-2xl bg-rose/10 px-4 py-3 text-sm font-medium text-rose-deep">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                {error}
              </p>
            )}

            <button type="submit" disabled={busy} className="btn-press w-full">
              {busy && <Loader2 className="h-5 w-5 animate-spin" aria-hidden />}
              {copy.submit}
            </button>
          </form>
        )}

        {mode === 'forgot' ? (
          <p className="mt-6 text-center text-sm text-muted">
            Remembered it?{' '}
            <button type="button" onClick={() => switchMode('signin')} className="font-bold text-teal underline-offset-4 hover:underline">
              Back to sign in
            </button>
          </p>
        ) : mode !== 'reset' && (
          <p className="mt-6 text-center text-sm text-muted">
            {isSignup ? 'Already have an account?' : 'New here?'}{' '}
            <button
              type="button"
              onClick={() => switchMode(isSignup ? 'signin' : 'signup')}
              className="font-bold text-teal underline-offset-4 hover:underline"
            >
              {isSignup ? 'Sign in' : 'Create an account'}
            </button>
          </p>
        )}
      </div>
      <button type="button" onClick={onBack} className="mt-6 text-sm font-semibold text-muted hover:text-ink">
        Back to home
      </button>
    </div>
  );
}
