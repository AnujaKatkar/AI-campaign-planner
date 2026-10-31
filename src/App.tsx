import { useState } from 'react';
import Landing from '@/pages/Landing';
import AuthPage from '@/pages/AuthPage';
import BriefWizard from '@/pages/BriefWizard';
import CampaignLibrary from '@/pages/CampaignLibrary';
import CampaignWorkspace from '@/pages/CampaignWorkspace';
import SiteHeader from '@/components/SiteHeader';
import { useSession } from '@/hooks/useSession';
import { supabase } from '@/lib/supabase';

type Screen = 'landing' | 'auth' | 'brief' | 'library' | 'campaign';

function App() {
  const { session, loading } = useSession();
  const [screen, setScreen] = useState<Screen>('landing');
  const [afterAuth, setAfterAuth] = useState<Screen>('library');
  const [campaignId, setCampaignId] = useState<string | null>(null);

  function requireSignIn(next: Screen) {
    if (session) {
      setScreen(next);
      return;
    }
    setAfterAuth(next);
    setScreen('auth');
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    setScreen('landing');
  }

  if (loading) {
    return <div className="min-h-screen bg-cream" aria-busy="true" />;
  }

  return (
    <div className="min-h-screen bg-cream text-ink">
      <SiteHeader
        signedIn={!!session}
        onHome={() => setScreen('landing')}
        onLibrary={() => requireSignIn('library')}
        onSignIn={() => requireSignIn('library')}
        onSignOut={handleSignOut}
      />
      <main>
        {screen === 'landing' && (
          <Landing onStart={() => requireSignIn('brief')} onSignIn={() => requireSignIn('library')} />
        )}
        {screen === 'auth' && (
          <AuthPage onAuthed={() => setScreen(afterAuth)} onBack={() => setScreen('landing')} />
        )}
        {screen === 'brief' && (
          <BriefWizard
            onCreated={(id) => {
              setCampaignId(id);
              setScreen('campaign');
            }}
            onExit={() => setScreen('landing')}
          />
        )}
        {screen === 'library' && (
          <CampaignLibrary
            onStart={() => requireSignIn('brief')}
            onOpen={(id) => {
              setCampaignId(id);
              setScreen('campaign');
            }}
          />
        )}
        {screen === 'campaign' && campaignId && (
          <CampaignWorkspace campaignId={campaignId} onBack={() => setScreen('library')} />
        )}
      </main>
    </div>
  );
}

export default App;
