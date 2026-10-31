# Flaunt — Bolt.new build prompt

Paste everything below the line into Bolt as your first prompt. Then connect Supabase from Bolt's integration panel, run `supabase/schema.sql`, and deploy the `flaunt-generate` Edge Function.

---

Build **Flaunt**, an AI campaign studio. Tagline: **"Stop hoping and start posting. Flaunt it."** A small-business owner enters a short brief and gets an editable, phased marketing calendar with content ideas, ad scripts, campaign copy and a creative brief attached.

## Stack
- React + Vite + TypeScript + Tailwind CSS
- `@supabase/supabase-js` for auth (email magic link + Google) and data
- `@dnd-kit/core` for drag-and-drop on the calendar
- `canvas-confetti` for celebration moments, `lucide-react` for icons, `framer-motion` for card swipes
- AI generation calls the Supabase Edge Function `flaunt-generate` with `supabase.functions.invoke('flaunt-generate', { body: brief })`. **Never put the OpenAI key in the front end.**
- Env: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

## Design tokens (warm, welcoming, a little rebellious)
Light theme
- `--bg` #FFF8F0 (warm cream) · `--surface` #FFFFFF · `--surface-2` #FCEBE3 (blush) · `--ink` #2B1D16 (espresso) · `--muted` #85695A · `--line` #F0DACC
- `--rose` #E23E57 (primary: buttons, active states, logo) · `--rose-deep` #A82A3F (button "press" shadow)
- `--honey` #F2B33D (Heat, streaks, stickers, rewards) · `--teal` #13797A (help tips, AI moments, focus rings) · `--sage` #3E8E5E (done/kept/success)
Dark theme
- `--bg` #1A1310 · `--surface` #261C17 · `--ink` #FFF1E6 · `--muted` #C4AE9E · accents lifted: rose #FF6B7F, honey #FFC857, teal #4FC3B8, sage #7CC48F
No purple and no hard orange anywhere in the UI.
Channel colors (chips on the calendar): Instagram #D6286A, TikTok #00807A, LinkedIn #2D6CDF, Email #B85A00, Facebook #4A5FE0, Google Ads #22813D, Blog #8A5A3C

Wordmark: **"Flaunt" as a neon sign** — Yellowtail script in blush #FFF0F3 with a layered rose glow (text-shadow 4/10/22/42px in #FF6B7F/#E23E57) plus a soft honey halo, on a small espresso #1A1110 plate rotated −2°. It flickers on once at page load (skip under prefers-reduced-motion). The hero repeats it big: "Flaunt it." on a tilted neon plate.
Type: **Bricolage Grotesque** (display, 700–800, tight tracking) · **Figtree** (body) · **JetBrains Mono** (dates, numbers, script timing).
Shape: 18px radius on cards, 999px pills, chunky primary buttons with a 4px bottom "press" shadow in `--rose-deep` that collapses on :active (Duolingo-style tactile feel). Edge comes from sticker badges (2px espresso border, 3px offset shadow, slightly rotated), an espresso marquee band, and huge display headlines. One bold accent per screen.

## Voice
Cheeky, confident, on the user's side. Examples: "Stop hoping and start posting. Flaunt it." · "Flaunted. 45 posts, zero excuses." · "Nothing kept yet. Tough crowd." · "Gone. Never liked it anyway." Never mean, never jargon.

## Competitive features (round 4)
- **Brief strength meter** under the brief form title: a bar (Thin / Good / Strong) plus one tip at a time (e.g. "Add an offer so people have one clear thing to act on").
- **Story recipe** (optional chips): Let Flaunt pick · Problem → fix · Customer as hero · Behind the scenes · Hook → want → act. Sent to the AI and shown in the creative brief.
- **Why this works**: one plain sentence per post, shown in the editor.
- **Flaunt check** in the editor and as a "⚠ N to fix" pill on week cards: flags risky claims (best, #1, guaranteed, percentages), leftover [placeholders], missing hook, missing call to action, hooks over 125 characters, more than 8 hashtags.
- **Board view** (Idea / To do / Ready to post / Posted) with drag between columns, next to This week / Month / List.
- **Exports**: Google Calendar CSV (Subject, Start Date, All Day Event, Description), full plan CSV, and Copy whole plan.
- **AI rewrite buttons** per post: Fresh take · Shorter · En español.
- **Results tab** (second tab): goal card (editable target, progress bar with a marker for % of posts done, status chip On track / At risk / Behind with icon + label), Posted, People reached, Clicks; "Planned vs posted, by week" columns with a table view; "<metric> by channel" horizontal bars with Goal / Reach / Clicks toggle; Top posts table; "What's working" insight plus "Ask AI what to change next week". Results are logged per post in the editor under "How did it do?".
- Deliberately NOT included: Gantt, time tracking, resourcing, approval chains, infinite canvas, a general chat assistant.

## Navigation
Customers only ever see the app. Product thesis, design notes and build docs live behind a small "Behind the build" link, never in the main nav.

## New-user guidance (required)
- Every brief field shows a one-line "Why we ask" hint and an example placeholder. Required fields are starred.
- Selecting a goal or tone shows a one-sentence description of what it does to the plan.
- Each workspace tab has a one-line description under the tab bar.
- First visit shows a dismissible "New here?" coach card explaining the hero card, phase strip and tabs.

## Screens
1. **Landing** — Hero headline "Stop hoping and start posting. Flaunt it." with sticker badges ("No marketing degree required", "60 seconds, tops"), a 3-step how-it-works stack, a scrolling "Flaunt your grand opening ✦ holiday drop ✦ new menu" marquee, with a live mini-demo: a 4-field brief morphing into a calendar. CTA "Flaunt your first campaign" (no signup needed until save).
2. **Brief wizard** (one question per step, progress bar, Enter to advance):
   business name → what you sell → who you want to reach → what you want them to do (6 tiles: Awareness, Leads, Sales, Launch, Event, Retention) → how long (2/4/6/8/12 weeks + start date) → **how much can you handle?** (Light ≈3 posts/week, Steady ≈5, All-in) → optional offer → where you'll show up (channel chips) → how you sound (Bold, Playful, Premium, Warm, Witty). Final button: **"Flaunt it"**.
   If the user has edited the current campaign, the button first shows "This replaces your plan and the N changes you made" and needs a second press.
3. **Generating** — 6–15s loader that narrates real steps ("Finding your big idea… Mapping phases… Writing hooks…") with a filling honey bar.
4. **Campaign workspace** (main screen)
   - Header: campaign name, big idea, tagline, phase ribbon (colored segments across the date range), **Heat meter** (% of items marked done) and **"Week N: x of y posted"** chip (honest progress, no fake streaks).
   - Tabs: **Calendar · Ideas · Video scripts · Copy · Creative brief**
   - **Calendar** opens on **This week**: week N of M, the phase and its job, "5 posts · about 2 hr 30 min of work", and one card per post with a big "Posted" checkbox, date, channel, plain-English post type, minutes and hook. Prev/next arrows move between weeks. **Month** and **List** views show everything.
   - A "What do these post types mean?" expander defines every post type used (Reel, Carousel, Stitch…) in one sentence with a time estimate.
   - Month view: week rows × 7 day columns, phase-tinted backgrounds, channel-colored chips. Drag a chip to move it (updates `scheduled_on`). Click a chip → right drawer editor (title, channel, format, date, hook, body, CTA, status shown as Idea / To do / Ready to post / Posted, "What to shoot" field, Rewrite with AI (calls the Edge Function for one post), Delete). "+" on hover in any day to add an item. Toggle Week / Month / List view. Filter by channel.
   - **Ideas**: swipeable card stack (Keep → right / Toss → left, also buttons and ←/→ keys). Kept ideas can be dropped onto the calendar.
   - **Ad Scripts**: cards for 6s / 15s / 30s with a scene table (time · visual · voiceover · on-screen text) and Copy button.
   - **Copy**: grouped lists (headlines, primary texts, email subjects, CTAs, hashtags) each with one-tap copy and a "More like this" regenerate.
   - **Creative Brief**: one-page brief (background, objective, audience, insight, single-minded proposition, reasons to believe, tone, mandatories, deliverables, KPIs) with Copy all.
   - Creative brief rows use plain labels first with the industry term small underneath: "The one thing to remember (single-minded proposition)", "Why they should believe us (reasons to believe)", "How we'll know it worked (KPIs)".
5. **Library** — grid of saved campaigns from the `campaign_summary` view with progress rings (done_items / total_items) and status pills.
6. **Recap ("Flaunted")** — Spotify-Wrapped-style story cards at campaign end: posts shipped, channels used, best phase, streak. Shareable.

## Data
Use these Supabase tables (already created): `profiles`, `campaigns`, `campaign_phases`, `calendar_items`, `campaign_assets` (kind: idea | ad_script | copy | creative_brief; `content` is JSON), `generations`, view `campaign_summary`. All tables use RLS: the signed-in user only sees their own rows.
- After `flaunt-generate` returns `{ campaign_id }`, load the campaign, phases, items and assets and route to the workspace.
- Edits to calendar items save optimistically with `update` and show a small "Saved" toast.
- Update `profiles.heat_streak` / `last_active_on` once per day on first campaign open.

## Engagement rules (delight, not dark patterns)
- Celebrate real progress only: confetti on first generation, on every phase completed, and at 100% Heat.
- Streaks reward showing up; never send guilt notifications. Offer one "streak freeze" per week.
- Every empty state gives one clear next action.

## Quality bar
- Fully responsive (calendar collapses to List view under 640px), keyboard accessible, visible focus rings, `prefers-reduced-motion` respected, light + dark themes.
- Friendly error copy that says what happened and what to do next.
