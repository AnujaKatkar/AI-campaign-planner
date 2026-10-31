import type { ReactNode } from 'react';
import { ArrowLeft, Calculator, CalendarDays, ClipboardList, PlugZap } from 'lucide-react';
import { postTypesUsed } from '@/lib/postTypes';

type HowItWorksProps = {
  onBack: () => void;
  onSample: () => void;
};

const JOBS = [
  { icon: CalendarDays, title: 'It plans.', body: 'It decides which posts go on which days.' },
  { icon: Calculator, title: 'It estimates.', body: 'It guesses how long that work will take.' },
  { icon: ClipboardList, title: 'It adds up what you tell it.', body: 'It totals the results you type in.' },
];

const FLOW = ['You fill in the brief', 'Flaunt builds the plan', 'You post for real and tick “Posted”', 'A few days later, you copy 3 numbers into the post', 'The Results tab adds them up'];

const QA: { q: string; a: ReactNode }[] = [
  {
    q: 'What does “about 2 hr 30 min of work a week” mean?',
    a: (
      <>
        <p>
          A rough guide to how long making and posting the plan takes each week. Every post type has a fixed time estimate. Flaunt
          adds up the estimates for the week’s posts and rounds to the nearest 15 minutes. It’s an estimate, not a timer.
        </p>
        <TypesTable />
      </>
    ),
  },
  {
    q: 'Where do the post counts come from?',
    a: (
      <p>
        From your workload choice: Light is about 3 posts a week, Steady about 5, and All-in fills every slot. Posts are spread across
        each channel’s usual posting days, and Google Ads adds one setup task per phase.{' '}
        <Example>6 weeks × 5 posts + 4 ad setups = 34 posts.</Example>
      </p>
    ),
  },
  {
    q: 'Where do “people reached” and “clicks” come from?',
    a: (
      <>
        <p>
          You type them in. Open a post that’s live and fill in “How did it do?” with numbers from that app. The box tells you where to
          look for each channel:
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Instagram: the post → View insights. People reached = “Accounts reached”.</li>
          <li>Email: your email tool’s report. People reached = “Opens”.</li>
        </ul>
        <p className="mt-2">The numbers only go up when you log another post. The Results tab re-adds everything each time.</p>
      </>
    ),
  },
  {
    q: 'How does the “by channel” chart get its data?',
    a: (
      <p>
        Each post belongs to one channel. The chart takes every post you’ve logged, groups them by channel and adds up one number. The
        Goal / Reach / Clicks buttons choose which number. <Example>In the sample, TikTok shows 37 first orders from 5 logged posts.</Example>
      </p>
    ),
  },
  {
    q: 'How do sales get counted?',
    a: (
      <>
        <p>
          The third box in “How did it do?” is named after your goal: First orders, Sales, Sign-ups and so on. Enter how many came from
          that post, and they add up toward your goal target (150 by default; change it on the Results tab).
        </p>
        <p className="mt-2">To know which post made a sale, give each post a way to trace it:</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>
            its own discount code, like <code className="font-mono">ROAST-REEL1</code>
          </li>
          <li>a tracked link</li>
          <li>or ask customers “How did you hear about us?”</li>
        </ul>
        <p className="mt-2">Sales you can’t trace to a post still happened; they just don’t appear on any post.</p>
      </>
    ),
  },
  {
    q: 'What do “On track”, “At risk” and “Behind” mean?',
    a: (
      <>
        <p>It compares how much of your goal you’ve reached with how much of the plan you’ve posted: goal % ÷ posts-done %.</p>
        <ul className="mt-2 space-y-1">
          <li>
            <span className="pill bg-sage text-white">On track</span> 0.9 or higher
          </li>
          <li>
            <span className="pill bg-honey text-espresso">At risk</span> 0.6 to 0.9
          </li>
          <li>
            <span className="pill bg-rose text-on-rose">Behind</span> below 0.6
          </li>
        </ul>
        <p className="mt-2">
          <Example>Sample: 40% of goal ÷ 41% of posts = 0.98, so On track.</Example>
        </p>
      </>
    ),
  },
  {
    q: 'What is Heat?',
    a: (
      <p>
        The share of all posts you’ve ticked as Posted. <Example>In the sample, 14 of 34 = 41%.</Example> Confetti only fires for real
        progress: your first plan, each phase you finish, and 100% Heat.
      </p>
    ),
  },
  {
    q: 'What does “What’s working” use?',
    a: (
      <p>
        The channel and post type with the highest average goal results per logged post. It needs at least 3 logged posts. “Ask AI”
        sends those same numbers to the AI for three suggestions for next week.
      </p>
    ),
  },
];

export default function HowItWorks({ onBack, onSample }: HowItWorksProps) {
  return (
    <div className="mx-auto max-w-3xl px-5 py-10 md:py-14">
      <button type="button" onClick={onBack} className="inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" aria-hidden /> Back
      </button>
      <p className="eyebrow mt-8">Behind the build</p>
      <h1 className="mt-2 text-5xl font-extrabold md:text-6xl">How Flaunt works</h1>
      <p className="mt-4 text-lg text-muted">No magic, no black box. Here’s exactly where every number comes from, with worked examples.</p>

      <section className="mt-10">
        <h2 className="text-2xl font-extrabold">The one idea that explains everything</h2>
        <p className="mt-2">Flaunt does three jobs:</p>
        <ul className="mt-4 grid gap-4 sm:grid-cols-3">
          {JOBS.map((j) => (
            <li key={j.title} className="card p-5">
              <j.icon className="h-6 w-6 text-rose" aria-hidden />
              <p className="mt-3 font-display text-lg font-extrabold">{j.title}</p>
              <p className="text-sm text-muted">{j.body}</p>
            </li>
          ))}
        </ul>
        <p className="mt-5 rounded-2xl border-2 border-honey bg-honey/15 p-4">
          Flaunt does <strong>not</strong> connect to Instagram, TikTok, Google Ads or your shop yet. Planning numbers come from Flaunt.
          Results numbers (reach, clicks, sales) come only from what you type in.
        </p>
        <ol className="mt-6 flex flex-wrap items-center gap-2 text-sm font-semibold">
          {FLOW.map((step, i) => (
            <li key={step} className="flex items-center gap-2">
              <span className="rounded-full bg-blush px-3 py-1.5">{step}</span>
              {i < FLOW.length - 1 && <span className="text-rose" aria-hidden>→</span>}
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-extrabold">Your questions</h2>
        <div className="mt-4 space-y-3">
          {QA.map(({ q, a }) => (
            <details key={q} className="card group p-5 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-lg font-bold">
                {q}
                <span className="text-2xl text-rose transition-transform group-open:rotate-45" aria-hidden>
                  +
                </span>
              </summary>
              <div className="mt-3 space-y-2 text-[15px] leading-relaxed">{a}</div>
            </details>
          ))}
        </div>
      </section>

      <section className="mt-12 rounded-card border-2 border-espresso bg-espresso p-6 text-paper md:p-8">
        <h2 className="flex items-center gap-2 text-2xl font-extrabold">
          <PlugZap className="h-6 w-6 text-honey" aria-hidden /> The honest gap
        </h2>
        <p className="mt-3 text-paper/85">
          Typing results in by hand is the honest limit today. The sample campaign is saved only in your browser; your own campaigns save
          to your account. The next step is connecting Instagram, TikTok, Google Ads and shops like Shopify or Square, so reach, clicks
          and sales fill in automatically.
        </p>
        <button type="button" onClick={onSample} className="btn-press mt-6">
          Open the sample campaign
        </button>
      </section>
    </div>
  );
}

function Example({ children }: { children: ReactNode }) {
  return <span className="rounded-md bg-teal/10 px-1.5 py-0.5 font-semibold text-teal">{children}</span>;
}

function TypesTable() {
  const types = postTypesUsed(['poll', 'photo', 'email', 'reel', 'carousel', 'google', 'blog']);
  return (
    <table className="mt-3 w-full max-w-sm text-sm">
      <tbody>
        {types.map((t) => (
          <tr key={t.key} className="border-t border-line">
            <td className="py-1.5">{t.label}</td>
            <td className="py-1.5 text-right font-mono">{t.minutes} min</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
