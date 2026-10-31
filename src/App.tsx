import { useEffect, useState } from 'react';
import Landing from '@/pages/Landing';
import AuthPage from '@/pages/AuthPage';
import BriefWizard from '@/pages/BriefWizard';
import CampaignLibrary from '@/pages/CampaignLibrary';
import CampaignWorkspace, { type WorkspaceSource } from '@/pages/CampaignWorkspace';
import HowItWorks from '@/pages/HowItWorks';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import { ToastProvider } from '@/components/Toast';
import { useSession } from '@/hooks/useSession';
import { supabase } from '@/lib/supabase';

type Screen = 'landing' | 'auth' | 'brief' | 'library' | 'campaign' | 'how';

function App() {
  const { session, loading } = useSession();
  const [screen, setScreen] = useState<Screen>('landing');
  const [previous, setPrevious] = useState<Screen>('landing');
  const [afterAuth, setAfterAuth] = useState<Screen>('library');
  const [source, setSource] = useState<WorkspaceSource | null>(null);
  const [justCreated, setJustCreated] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [screen]);

  function go(next: Screen) {
    setPrevious(screen);
    setScreen(next);
  }

  function requireSignIn(next: Screen) {
    if (session) {
      go(next);
      return;
    }
    setAfterAuth(next);
    go('auth');
  }

  function openCampaign(id: string, created = false) {
    setSource({ kind: 'remote', id, userId: session?.user.id });
    setJustCreated(created);
    go('campaign');
  }

  function openSample() {
    setSource({ kind: 'sample' });
    setJustCreated(false);
    go('campaign');
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    go('landing');
  }

  if (loading) {
    return <div className="min-h-screen bg-cream" aria-busy="true" />;
  }

  return (
    <ToastProvider>
      <div className="flex min-h-screen flex-col bg-cream text-ink">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-cream">
          Skip to content
        </a>
        <SiteHeader
          signedIn={!!session}
          onHome={() => go('landing')}
          onLibrary={() => requireSignIn('library')}
          onSignIn={() => requireSignIn('library')}
          onSignOut={handleSignOut}
        />
        <main id="main" className="flex-1">
          {screen === 'landing' && (
            <Landing signedIn={!!session} onStart={() => go('brief')} onSample={openSample} onSignIn={() => requireSignIn('library')} />
          )}
          {screen === 'auth' && <AuthPage onAuthed={() => go(afterAuth)} onBack={() => go(previous === 'auth' ? 'landing' : previous)} />}
          {screen === 'brief' && (
            <BriefWizard
              signedIn={!!session}
              onNeedAuth={() => {
                setAfterAuth('brief');
                go('auth');
              }}
              onCreated={(id) => openCampaign(id, true)}
              onExit={() => go(session ? 'library' : 'landing')}
            />
          )}
          {screen === 'library' && <CampaignLibrary onStart={() => go('brief')} onSample={openSample} onOpen={(id) => openCampaign(id)} />}
          {screen === 'campaign' && source && (
            <CampaignWorkspace
              key={source.kind === 'remote' ? source.id : 'sample'}
              source={source}
              celebrateOnOpen={justCreated}
              onBack={() => go(source.kind === 'sample' ? (session ? 'library' : 'landing') : 'library')}
              onHowItWorks={() => go('how')}
              onStartOwn={() => go('brief')}
            />
          )}
          {screen === 'how' && <HowItWorks onBack={() => go(previous === 'how' ? 'landing' : previous)} onSample={openSample} />}
        </main>
        <SiteFooter onBehindTheBuild={() => go('how')} />
      </div>
    </ToastProvider>
  );
}

export default App;
