import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

// The sample campaign works without a backend, so a missing config should not crash the app.
export const supabaseConfigured = !!supabaseUrl && !!supabaseAnonKey;

// Read before the client starts: it removes the tokens from the URL once it has used them.
export const openedFromPasswordReset = typeof window !== 'undefined' && /type=recovery/.test(window.location.hash);

// Where the reset email sends people back to (works under the GitHub Pages base path too).
export const passwordResetRedirect = typeof window !== 'undefined' ? window.location.origin + import.meta.env.BASE_URL : undefined;

export const supabase = createClient(supabaseUrl || 'http://localhost:54321', supabaseAnonKey || 'not-configured');

// signOut() stops without clearing the saved session when the server says it already ended it
// (auth-js reports "session not found" as a non-API error), so clear it ourselves in that case.
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) await (supabase.auth as unknown as { _removeSession(): Promise<void> })._removeSession();
}
