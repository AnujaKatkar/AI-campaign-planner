import { ArrowRight, CalendarDays, Megaphone, MessageSquareText } from 'lucide-react';
import Logo from '@/components/Logo';

type LandingProps = {
  onStart: () => void;
  onSignIn: () => void;
};

const STEPS = [
  {
    icon: MessageSquareText,
    title: 'Tell us about your business',
    body: 'Answer a few plain questions: what you sell, who you want to reach, and what you want them to do.',
  },
  {
    icon: CalendarDays,
    title: 'Get a phased calendar',
    body: 'Flaunt plans your posts across four phases, sized to the time you actually have.',
  },
  {
    icon: Megaphone,
    title: 'Post with ready-made words',
    body: 'Hooks, captions, ad scripts and a creative brief are written for you. Edit, then post.',
  },
];

const PREVIEW_ITEMS = [
  { day: 'Mon', channel: 'Instagram', color: 'bg-[#D6286A]', title: 'Behind the counter at 6am' },
  { day: 'Wed', channel: 'TikTok', color: 'bg-[#00807A]', title: 'Our five-minute sourdough fix' },
  { day: 'Fri', channel: 'Email', color: 'bg-[#B85A00]', title: 'Weekend pastry preorder' },
];

export default function Landing({ onStart, onSignIn }: LandingProps) {
  return (
    <div className="overflow-hidden">
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-20 pt-14 lg:grid-cols-2 lg:pt-24">
        <div className="relative">
          <p className="mb-6 inline-flex items-center rounded-full border border-line bg-blush px-4 py-1.5 text-sm font-semibold text-ink">
            AI campaign studio for small businesses
          </p>
          <h1 className="text-5xl font-extrabold md:text-7xl">Stop hoping and start posting.</h1>
          <div className="mt-6">
            <Logo size="lg" />
          </div>
          <p className="mt-8 max-w-xl text-lg text-muted">
            Answer a few quick questions and get a full, phased marketing campaign: posts, ad scripts, copy and a
            creative brief, ready to paste.
          </p>
          <div className="mt-10 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <button type="button" onClick={onStart} className="btn-press">
              Flaunt your first campaign <ArrowRight className="h-5 w-5" aria-hidden />
            </button>
            <p className="text-sm text-muted">
              Already have an account?{' '}
              <button type="button" onClick={onSignIn} className="font-bold text-teal underline-offset-4 hover:underline">
                Sign in
              </button>
            </p>
          </div>
          <div className="mt-10 flex flex-wrap gap-3">
            <span className="sticker -rotate-2">No marketing degree required</span>
            <span className="sticker rotate-1">60 seconds, tops</span>
          </div>
        </div>

        <div className="relative">
          <div className="card rotate-1 p-6 shadow-[0_24px_60px_-20px_rgba(43,29,22,0.35)]">
            <div className="flex items-center justify-between border-b border-line pb-4">
              <div>
                <p className="font-mono text-xs uppercase tracking-wide text-muted">Week 1 of 4</p>
                <p className="text-lg font-bold">Whisper phase</p>
              </div>
              <span className="rounded-full bg-sage/15 px-3 py-1 text-sm font-semibold text-sage">3 posts</span>
            </div>
            <ul className="mt-4 space-y-3">
              {PREVIEW_ITEMS.map((item) => (
                <li key={item.title} className="flex items-start gap-3 rounded-2xl border border-line p-4">
                  <span className="font-mono text-sm font-medium text-muted">{item.day}</span>
                  <div className="min-w-0">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold text-white ${item.color}`}>
                      {item.channel}
                    </span>
                    <p className="mt-1.5 font-semibold text-ink">{item.title}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <span className="sticker absolute -right-2 -top-4 rotate-3">Ready to post</span>
        </div>
      </section>

      <div className="overflow-hidden bg-espresso py-4" aria-hidden>
        <div className="marquee-track flex w-max gap-10 whitespace-nowrap font-display text-2xl font-extrabold text-honey">
          {Array.from({ length: 2 }).map((_, round) => (
            <span key={round} className="flex gap-10">
              <span>Flaunt your grand opening</span>
              <span>Holiday drop</span>
              <span>New menu</span>
              <span>Weekend special</span>
            </span>
          ))}
        </div>
      </div>

      <section className="mx-auto max-w-6xl px-5 py-20">
        <h2 className="text-4xl font-extrabold md:text-5xl">Three steps. One clear plan.</h2>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {STEPS.map((step, index) => (
            <article key={step.title} className="card p-6">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blush text-rose">
                  <step.icon className="h-5 w-5" aria-hidden />
                </span>
                <span className="font-mono text-sm text-muted">0{index + 1}</span>
              </div>
              <h3 className="mt-5 text-xl font-bold">{step.title}</h3>
              <p className="mt-2 text-muted">{step.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-24">
        <div className="flex flex-col items-start justify-between gap-6 rounded-card bg-espresso p-10 md:flex-row md:items-center">
          <div>
            <h2 className="text-3xl font-extrabold text-cream md:text-4xl">Your next post is one brief away.</h2>
            <p className="mt-2 text-cream/80">Takes about a minute. Save it when you are happy with it.</p>
          </div>
          <button type="button" onClick={onStart} className="btn-press shrink-0">
            Flaunt it <ArrowRight className="h-5 w-5" aria-hidden />
          </button>
        </div>
      </section>
    </div>
  );
}
