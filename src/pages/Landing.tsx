import { useEffect, useState } from 'react';
import { ArrowRight, CalendarDays, Check, Megaphone, MessageSquareText, PlayCircle, Sparkles } from 'lucide-react';
import ChannelChip from '@/components/ChannelChip';

type LandingProps = {
  onStart: () => void;
  onSample: () => void;
  onSignIn: () => void;
  signedIn: boolean;
};

const STEPS = [
  {
    icon: MessageSquareText,
    title: 'Answer 10 plain questions',
    body: 'What you sell, who it’s for, what you want them to do, and how much time you’ve actually got.',
  },
  {
    icon: CalendarDays,
    title: 'Get a plan you can keep',
    body: 'Four phases, sized to your week. Every post has a hook, a caption, a call to action and what to shoot.',
  },
  {
    icon: Megaphone,
    title: 'Post, tick, repeat',
    body: 'Tick “Posted” as you go, log a few numbers, and watch your Heat climb. Video scripts and copy included.',
  },
];

const DEMO_FIELDS = [
  ['Business', 'Ember & Oak Coffee'],
  ['Selling', 'Fresh-roasted subscription'],
  ['For', 'Busy locals who love café coffee'],
  ['Goal', 'Launch · 6 weeks'],
];

const DEMO_POSTS = [
  { day: 'Mon', channel: 'instagram', title: 'Smoke, then silence: our roaster at 5am' },
  { day: 'Tue', channel: 'tiktok', title: 'POV: you smell fresh-roasted coffee' },
  { day: 'Wed', channel: 'email', title: 'Something’s brewing (you’re on the list)' },
  { day: 'Thu', channel: 'instagram', title: 'Name our launch blend' },
];

const MARQUEE = ['Flaunt your grand opening', 'holiday drop', 'new menu', 'weekend special', 'pop-up', 'first 100 customers'];

function useDemoStep(total: number) {
  const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const [step, setStep] = useState(reduced ? total - 1 : 0);
  useEffect(() => {
    if (reduced) return;
    const timer = window.setInterval(() => setStep((s) => (s + 1) % (total + 3)), 900);
    return () => window.clearInterval(timer);
  }, [reduced, total]);
  return Math.min(step, total - 1);
}

export default function Landing({ onStart, onSample, onSignIn, signedIn }: LandingProps) {
  const demoStep = useDemoStep(DEMO_FIELDS.length + 1 + DEMO_POSTS.length);
  const fieldsShown = Math.min(demoStep + 1, DEMO_FIELDS.length);
  const morphed = demoStep >= DEMO_FIELDS.length + 1;
  const postsShown = Math.max(0, demoStep - DEMO_FIELDS.length);

  return (
    <div className="overflow-hidden">
      <section className="mx-auto grid max-w-6xl items-center gap-14 px-5 pb-20 pt-12 lg:grid-cols-[1.1fr_1fr] lg:pt-20">
        <div className="relative">
          <div className="flex flex-wrap gap-3">
            <span className="sticker -rotate-3">No marketing degree required</span>
            <span className="sticker rotate-2 !bg-surface !text-ink">60 seconds, tops</span>
          </div>
          <h1 className="mt-8 text-[3.25rem] font-extrabold leading-[0.95] tracking-tight md:text-7xl lg:text-[5.25rem]">
            <span className="block whitespace-nowrap">Stop Hoping.</span>
            <span className="block whitespace-nowrap">Start Posting.</span>
          </h1>
          <div className="mt-6 -ml-1">
            <span className="neon-plate !px-6 !py-2">
              <span className="neon-text neon-flicker font-script text-6xl leading-none md:text-7xl">Flaunt it.</span>
            </span>
          </div>
          <p className="mt-8 max-w-xl text-lg text-muted">
            The AI campaign studio for small businesses. Tell Flaunt about your business and get a phased marketing calendar
            with posts, video scripts, copy and a creative brief, sized to the hours you actually have.
          </p>
          <div className="mt-9 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <button type="button" onClick={onStart} className="btn-press">
              Flaunt your first campaign <ArrowRight className="h-5 w-5" aria-hidden />
            </button>
            <button type="button" onClick={onSample} className="btn-ghost">
              <PlayCircle className="h-5 w-5" aria-hidden /> See a sample
            </button>
          </div>
          <p className="mt-4 text-sm text-muted">
            No sign-up until you save.
            {!signedIn && (
              <>
                {' '}
                Been here before?{' '}
                <button type="button" onClick={onSignIn} className="font-bold text-teal underline-offset-4 hover:underline">
                  Sign in
                </button>
              </>
            )}
          </p>
        </div>

        <div className="relative mx-auto w-full max-w-md" aria-hidden>
          <div className="card relative min-h-[25rem] rotate-1 overflow-hidden p-6 shadow-lift">
            <div className={`transition-all duration-500 ${morphed ? 'pointer-events-none -translate-y-4 opacity-0' : ''}`}>
              <p className="eyebrow">Your brief</p>
              <ul className="mt-4 space-y-3">
                {DEMO_FIELDS.map(([label, value], i) => (
                  <li key={label} className="rounded-2xl border border-line px-4 py-2.5">
                    <p className="text-xs font-bold text-muted">{label}</p>
                    <p className={`font-semibold transition-opacity duration-300 ${i < fieldsShown ? 'opacity-100' : 'opacity-0'}`}>{value}</p>
                  </li>
                ))}
              </ul>
              <div className={`btn-press mt-5 w-full transition ${demoStep === DEMO_FIELDS.length ? 'translate-y-1 !shadow-none' : ''}`}>
                Flaunt it <Sparkles className="h-5 w-5" />
              </div>
            </div>

            <div className={`absolute inset-0 p-6 transition-all duration-500 ${morphed ? 'opacity-100' : 'pointer-events-none translate-y-6 opacity-0'}`}>
              <div className="flex items-center justify-between border-b border-line pb-4">
                <div>
                  <p className="eyebrow">Week 1 of 6 · Whisper</p>
                  <p className="text-lg font-extrabold">Make them curious</p>
                </div>
                <span className="pill bg-sage/15 !text-sm text-sage">4 posts · 2 hr</span>
              </div>
              <div className="mt-3 flex h-3 overflow-hidden rounded-full border-2 border-ink">
                <span className="w-1/4 bg-rose" />
                <span className="w-1/4 bg-honey" />
                <span className="w-1/4 bg-teal" />
                <span className="w-1/4 bg-sage" />
              </div>
              <ul className="mt-4 space-y-2.5">
                {DEMO_POSTS.map((post, i) => (
                  <li
                    key={post.title}
                    className={`flex items-center gap-3 rounded-2xl border border-line p-3 transition-all duration-300 ${
                      i < postsShown ? 'translate-x-0 opacity-100' : 'translate-x-6 opacity-0'
                    }`}
                  >
                    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-2 border-ink ${i === 0 ? 'bg-sage text-white' : ''}`}>
                      {i === 0 && <Check className="h-4 w-4" strokeWidth={3} />}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-muted">{post.day}</span>
                        <ChannelChip channel={post.channel} small />
                      </div>
                      <p className="truncate text-sm font-bold">{post.title}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <span className="sticker absolute -right-3 -top-5 rotate-6 !bg-rose !text-white">Ready to post</span>
          <span className="sticker absolute -bottom-4 -left-4 -rotate-3 font-mono">🔥 Heat 25%</span>
        </div>
      </section>

      <div className="-rotate-1 overflow-hidden border-y-2 border-espresso bg-espresso py-4" aria-hidden>
        <div className="marquee-track flex w-max gap-6 whitespace-nowrap font-display text-2xl font-extrabold text-honey md:text-3xl">
          {Array.from({ length: 2 }).map((_, round) => (
            <span key={round} className="flex gap-6">
              {MARQUEE.map((m) => (
                <span key={m} className="flex gap-6">
                  <span>{m}</span>
                  <span className="text-rose">✦</span>
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>

      <section className="mx-auto max-w-6xl px-5 py-20">
        <p className="eyebrow">How it works</p>
        <h2 className="mt-2 text-4xl font-extrabold md:text-6xl">
          Three steps. <span className="text-rose">Zero excuses.</span>
        </h2>
        <ol className="mt-12 grid gap-6 md:grid-cols-3">
          {STEPS.map((step, index) => (
            <li key={step.title} className={`card relative p-6 ${index === 1 ? 'md:translate-y-6' : index === 2 ? 'md:translate-y-12' : ''}`}>
              <span className="absolute -top-4 right-5 font-display text-6xl font-extrabold text-blush" aria-hidden>
                0{index + 1}
              </span>
              <span className="relative flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-ink bg-honey text-espresso shadow-sticker">
                <step.icon className="h-5 w-5" aria-hidden />
              </span>
              <h3 className="relative mt-5 text-xl font-extrabold">{step.title}</h3>
              <p className="relative mt-2 text-muted">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-24 pt-8">
        <div className="relative flex flex-col items-start justify-between gap-6 overflow-hidden rounded-card border-2 border-espresso bg-espresso p-8 md:flex-row md:items-center md:p-12">
          <div className="pointer-events-none absolute -left-10 -top-10 h-48 w-48 rounded-full bg-rose/30 blur-3xl" aria-hidden />
          <div className="relative">
            <h2 className="text-3xl font-extrabold text-paper md:text-5xl">Your next post is one brief away.</h2>
            <p className="mt-2 text-paper/75">Takes about a minute. Free to try. Save it when you love it.</p>
          </div>
          <button type="button" onClick={onStart} className="btn-press relative shrink-0">
            Flaunt it <ArrowRight className="h-5 w-5" aria-hidden />
          </button>
        </div>
      </section>
    </div>
  );
}
