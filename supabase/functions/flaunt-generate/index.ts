// Flaunt: turns a brief into a full campaign with OpenAI and saves it to Supabase.
// The OpenAI key is read from server secrets only; it never reaches the browser.

import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY") ?? "";
const OPENAI_MODEL = Deno.env.get("OPENAI_MODEL") ?? "gpt-5-mini";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

type Brief = {
  business_name: string;
  business_brief: string;
  target_audience: string;
  goal: "awareness" | "leads" | "sales" | "launch" | "event" | "retention";
  duration_weeks: number;
  start_date: string;
  channels: string[];
  tone?: string;
  offer?: string;
  workload?: "light" | "steady" | "allin";
  story_recipe?: "auto" | "problem" | "hero" | "backstage" | "aida";
};

type CampaignContext = { business_name: string; target_audience: string; goal: string; tone?: string | null; offer?: string | null };

type Task =
  | { task: "rewrite_item"; style: "fresh" | "shorter" | "spanish"; campaign: CampaignContext; item: Record<string, unknown> }
  | { task: "more_copy"; group: string; examples: string[]; campaign: CampaignContext }
  | { task: "next_week"; stats: unknown; campaign: CampaignContext }
  | { task: "refine_brief_field"; field: BriefField; value: string; instruction?: string; brief: Partial<Brief> }
  | { task: "plan_chat"; plan: ChatPlan; history: { role: "user" | "assistant"; text: string }[]; message: string; focus?: string | null }
  | { task: "brief_chat"; brief: Partial<Brief>; history: { role: "user" | "assistant"; text: string }[]; message: string };

type ChatPlan = {
  campaign: CampaignContext & { name?: string; big_idea?: string | null; tagline?: string | null; start_date: string; duration_weeks: number; channels: string[] };
  phases: { name: string; starts_on: string; ends_on: string }[];
  items: Record<string, unknown>[];
  scripts?: Record<string, unknown>[];
};

type BriefField = "business_name" | "business_brief" | "target_audience" | "offer";

const RECIPES: Record<string, string> = {
  auto: "pick the best story shape for the goal",
  problem: "Problem → fix: name the customer's annoyance, then show the fix",
  hero: "Customer as hero: the customer is the star, the business is the helpful guide",
  backstage: "Behind the scenes: show how it is made and who makes it",
  aida: "Hook → want → act: grab attention, build desire, ask for one action",
};

const GOAL_LABELS: Record<string, string> = {
  awareness: "New followers", leads: "Sign-ups", sales: "Sales", launch: "First orders", event: "RSVPs", retention: "Repeat orders",
};

const str = { type: "string" };
const strArr = { type: "array", items: str };
const obj = (properties: Record<string, unknown>) => ({
  type: "object",
  additionalProperties: false,
  required: Object.keys(properties),
  properties,
});

const CAMPAIGN_SCHEMA = obj({
  campaign_name: str,
  big_idea: str,
  tagline: str,
  phases: {
    type: "array",
    items: obj({ name: str, objective: str, start_day: { type: "integer" }, end_day: { type: "integer" } }),
  },
  calendar_items: {
    type: "array",
    items: obj({
      day_offset: { type: "integer" },
      channel: str, format: str, phase: str,
      title: str, hook: str, body: str, visual: str, cta: str, why: str, est_minutes: { type: "integer" },
    }),
  },
  ideas: { type: "array", items: obj({ title: str, description: str, channel: str, format: str }) },
  ad_scripts: {
    type: "array",
    items: obj({
      title: str, platform: str, length_seconds: { type: "integer" }, cta: str,
      scenes: { type: "array", items: obj({ time: str, visual: str, voiceover: str, on_screen_text: str }) },
    }),
  },
  copy: obj({ headlines: strArr, primary_texts: strArr, email_subjects: strArr, ctas: strArr, hashtags: strArr }),
  creative_brief: obj({
    background: str, objective: str, audience: str, insight: str,
    single_minded_proposition: str, reasons_to_believe: strArr, tone: str,
    mandatories: strArr, deliverables: strArr, kpis: strArr,
  }),
});

const SYSTEM_PROMPT = `You are Flaunt, a senior creative director and growth marketer with 25 years of experience.
You turn a short business brief into a complete, realistic, multi-channel campaign for a small business.
Rules:
- Structure the campaign in exactly 4 named phases that fit the goal (e.g. Whisper → Reveal → Proof → Momentum).
- Respect the workload: light = about 3 posts a week, steady = about 5, allin = Instagram 3/wk, TikTok 3/wk,
  LinkedIn 2/wk, Facebook 2/wk, Email 1/wk, Blog 1/wk. Google Ads = one setup task per phase. Use ONLY the channels provided.
- Plain English a busy owner understands. Format names in plain words: "Short video (Reel)", "Swipe post (Carousel)",
  "Story poll", "Google search ads". No marketing jargon in any field.
- Every title is unique. A poll states the question AND the options. If a title promises a question or list, the body delivers it.
- body: 2–4 sentences ready to paste, ending with the call to action. visual: one sentence on what to shoot with a phone.
- why: one plain sentence a beginner understands on why this post works for the goal.
- Follow the requested story recipe across the campaign and mention it in the creative brief tone.
- est_minutes: realistic time for a small-business owner to make and post it.
- day_offset must be between 0 and (duration_weeks*7 - 1).
- Every hook must stop a scroll in under 2 seconds. Every CTA must match the goal.
- Write in the requested tone. Be specific to the business and audience; never generic filler.
- No fabricated statistics, testimonials or claims. At most two [placeholders] in the whole campaign.
- Ad scripts: one 6s bumper, one 15s vertical hook-first, one 30s problem→solution.
- Return 8–12 ideas, 5 headlines, 3 primary texts, 5 email subjects, 4 CTAs, 6–10 hashtags.`;

function userPrompt(b: Brief) {
  return `Business: ${b.business_name}
Brief: ${b.business_brief}
Target audience: ${b.target_audience}
Goal: ${b.goal}
Offer / hook: ${b.offer ?? "(none given — propose one)"}
Duration: ${b.duration_weeks} weeks starting ${b.start_date}
Channels: ${b.channels.join(", ")}
Tone: ${b.tone ?? "warm, confident"}
Workload: ${b.workload ?? "steady"}
Story recipe: ${RECIPES[b.story_recipe ?? "auto"] ?? RECIPES.auto}`;
}

function addDays(iso: string, n: number) {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });
  const t0 = Date.now();

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    });
    // Sign-in is checked here, not by the platform gateway, which rejects this project's session tokens.
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return json({ error: "Sign in to generate a campaign." }, 401);

    const since = new Date(Date.now() - 86_400_000).toISOString();
    const { count } = await supabase.from("generations").select("id", { count: "exact", head: true })
      .eq("user_id", user.id).eq("kind", "full_campaign").gte("created_at", since);
    if ((count ?? 0) >= 20) return json({ error: "Daily generation limit reached. Try again tomorrow." }, 429);

    const body = await req.json();
    if (typeof body?.task === "string") {
      const { count: taskCount } = await supabase.from("generations").select("id", { count: "exact", head: true })
        .eq("user_id", user.id).neq("kind", "full_campaign").gte("created_at", since);
      if ((taskCount ?? 0) >= 200) return json({ error: "That's a lot of rewrites for one day. Try again tomorrow." }, 429);
      let result: unknown;
      try {
        result = await runTask(body as Task);
      } catch (e) {
        console.error(e);
        return json({ error: "The AI is busy. Try that again in a moment; nothing was changed." }, 502);
      }
      await supabase.from("generations").insert({ user_id: user.id, kind: body.task, model: OPENAI_MODEL, latency_ms: Date.now() - t0 });
      return json(result);
    }
    const brief = body as Brief;
    if (!brief.business_brief || !brief.target_audience || !brief.goal || !brief.duration_weeks) {
      return json({ error: "Brief, audience, goal and duration are required." }, 400);
    }

    const ai = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt(brief) },
        ],
        response_format: { type: "json_schema", json_schema: { name: "campaign", strict: true, schema: CAMPAIGN_SCHEMA } },
      }),
    });
    if (!ai.ok) {
      console.error("OpenAI error", ai.status, await ai.text());
      return json({ error: "The AI service is busy. Try again in a moment." }, 502);
    }
    const aiJson = await ai.json();
    const plan = JSON.parse(aiJson.choices[0].message.content);
    const maxDay = brief.duration_weeks * 7 - 1;

    const { data: campaign, error: cErr } = await supabase.from("campaigns").insert({
      user_id: user.id,
      name: plan.campaign_name, big_idea: plan.big_idea, tagline: plan.tagline,
      business_name: brief.business_name, business_brief: brief.business_brief,
      target_audience: brief.target_audience, goal: brief.goal, offer: brief.offer,
      duration_weeks: brief.duration_weeks, start_date: brief.start_date,
      channels: brief.channels, tone: brief.tone, workload: brief.workload ?? "steady", ai_model: OPENAI_MODEL,
      story_recipe: brief.story_recipe ?? "auto", goal_label: GOAL_LABELS[brief.goal], goal_target: 150,
    }).select().single();
    if (cErr) throw cErr;

    const { data: phases, error: pErr } = await supabase.from("campaign_phases").insert(
      plan.phases.map((p: any, i: number) => ({
        campaign_id: campaign.id, name: p.name, objective: p.objective, sort: i,
        starts_on: addDays(brief.start_date, Math.max(0, p.start_day)),
        ends_on: addDays(brief.start_date, Math.min(maxDay, p.end_day)),
      })),
    ).select();
    if (pErr) throw pErr;
    const phaseId = (name: string) => phases!.find((p) => p.name === name)?.id ?? null;

    const { error: iErr } = await supabase.from("calendar_items").insert(
      plan.calendar_items
        .filter((it: any) => brief.channels.includes(it.channel.toLowerCase()))
        .map((it: any, i: number) => ({
          campaign_id: campaign.id, phase_id: phaseId(it.phase),
          scheduled_on: addDays(brief.start_date, Math.min(maxDay, Math.max(0, it.day_offset))),
          channel: it.channel.toLowerCase(), format: it.format, title: it.title,
          hook: it.hook, body: it.body, visual: it.visual, why: it.why, est_minutes: it.est_minutes, cta: it.cta, status: "draft", sort: i,
        })),
    );
    if (iErr) throw iErr;

    const assets = [
      ...plan.ideas.map((x: any) => ({ kind: "idea", title: x.title, content: x })),
      ...plan.ad_scripts.map((x: any) => ({ kind: "ad_script", title: x.title, content: x })),
      { kind: "copy", title: "Campaign copy", content: plan.copy },
      { kind: "creative_brief", title: "Creative brief", content: plan.creative_brief },
    ].map((a) => ({ ...a, campaign_id: campaign.id }));
    const { error: aErr } = await supabase.from("campaign_assets").insert(assets);
    if (aErr) throw aErr;

    const { error: gErr } = await supabase.from("generations").insert({
      user_id: user.id, campaign_id: campaign.id, kind: "full_campaign", model: OPENAI_MODEL,
      prompt_tokens: aiJson.usage?.prompt_tokens, completion_tokens: aiJson.usage?.completion_tokens,
      latency_ms: Date.now() - t0,
    });
    if (gErr) console.error("Failed to log generation", gErr);

    return json({ campaign_id: campaign.id, latency_ms: Date.now() - t0 });
  } catch (e) {
    console.error(e);
    return json({ error: "Something broke while saving your campaign. Your brief is safe; try again." }, 500);
  }
});

// ---------- Small AI tasks used by the workspace -------------------------
const nullable = (type: string, extra: Record<string, unknown> = {}) => ({ type: [type, "null"], ...extra });

const SCRIPT_SCHEMA = obj({
  title: str, platform: str, length_seconds: { type: "integer" }, cta: str,
  scenes: { type: "array", items: obj({ time: str, visual: str, voiceover: str, on_screen_text: str }) },
});

const TASK_SCHEMAS = {
  rewrite_item: obj({ item: obj({ title: str, hook: str, body: str, cta: str }) }),
  more_copy: obj({ lines: strArr }),
  next_week: obj({ suggestions: strArr }),
  refine_brief_field: obj({ suggestions: strArr }),
  plan_chat: obj({
    reply: str,
    campaign: obj({
      name: nullable("string"), tagline: nullable("string"), big_idea: nullable("string"),
      offer: nullable("string"), duration_weeks: nullable("integer"),
    }),
    changes: {
      type: "array",
      items: obj({
        op: { type: "string", enum: ["update", "create", "delete"] },
        ref: { type: ["string", "null"] },
        reason: str,
        fields: obj(Object.fromEntries(
          ["title", "hook", "body", "cta", "visual", "format", "channel", "scheduled_on"].map((k) => [k, { type: ["string", "null"] }]),
        )),
      }),
    },
    scripts: {
      type: "array",
      items: obj({
        op: { type: "string", enum: ["update", "create", "delete"] },
        ref: { type: ["string", "null"] },
        reason: str,
        script: { anyOf: [SCRIPT_SCHEMA, { type: "null" }] },
      }),
    },
  }),
  brief_chat: obj({
    reply: str,
    suggestions: strArr,
    brief: obj({
      business_name: nullable("string"),
      business_brief: nullable("string"),
      target_audience: nullable("string"),
      goal: nullable("string", { enum: ["awareness", "leads", "sales", "launch", "event", "retention", null] }),
      duration_weeks: nullable("integer"),
      workload: nullable("string", { enum: ["light", "steady", "allin", null] }),
      offer: nullable("string"),
      channels: { type: ["array", "null"], items: { type: "string", enum: ["instagram", "tiktok", "linkedin", "email", "facebook", "google", "blog"] } },
      tone: nullable("string", { enum: ["Bold", "Playful", "Premium", "Warm", "Witty", null] }),
      story_recipe: nullable("string", { enum: ["auto", "problem", "hero", "backstage", "aida", null] }),
    }),
  }),
};

const BRIEF_CHAT_SYSTEM = `You are Flaunt, a friendly senior marketer brainstorming with a small-business owner before you plan their campaign.
Your job: help them think (names, angles, who to target, an offer) and, through the conversation, fill in their campaign brief.
Rules:
- reply: warm, plain English, 2–6 short sentences. Offer concrete ideas when they're unsure (e.g. 3 name options with a one-line why).
- Ask at most one question per turn, about the most important thing still missing, in this order:
  what they sell, business name, who to reach, goal, channels, tone, offer.
- brief: the whole brief as it now stands. Keep every value already in the brief unless the owner changes it.
  Only fill a field when the owner said it or clearly picked or agreed to your suggestion. Ideas you only suggested stay null.
- business_brief: one or two plain sentences on what they sell. target_audience: one or two sentences about one real kind of person.
- duration_weeks is one of 2, 4, 6, 8, 12. Leave duration_weeks, workload and story_recipe null unless the owner talks about them.
- suggestions: 2–4 short tap-to-send replies the owner might want next, in their voice (e.g. a name option, "Yes, use that", "Not sure, you pick").
- When business name, what they sell, audience, goal, channels and tone are all known, say the brief is ready and they can review it or generate the plan.
- No invented statistics, prices or claims about the business.`;

function briefChatPrompt(t: Extract<Task, { task: "brief_chat" }>): string {
  const clip = (v: unknown, n: number) => (typeof v === "string" ? v.slice(0, n) : v);
  const brief = Object.fromEntries(Object.entries(t.brief ?? {}).map(([k, v]) => [k, clip(v, 600)]).filter(([, v]) => v !== null && v !== "" && v !== undefined));
  const history = (t.history ?? []).slice(-12).map((m) => `${m.role === "user" ? "Owner" : "Flaunt"}: ${clip(m.text, 1200)}`).join("\n");
  return `Brief so far (JSON): ${JSON.stringify(brief)}
${history ? `\nConversation so far:\n${history}\n` : ""}
Owner: ${clip(t.message, 1200)}`;
}

const CHAT_SYSTEM = `You are Flaunt, a friendly senior marketer who helps a small-business owner adjust their campaign plan.
You can answer questions about the plan and propose edits to its posts, campaign details and video scripts.
Rules:
- reply: 1–4 short sentences in plain English, no jargon.
- When the owner asks for a change, put every change in this same reply. Don't ask for permission first.
- You can't change anything yourself: the owner applies your changes by accepting the cards shown under your reply.
  Never say you made, added or moved anything. Say what you're suggesting and "accept the cards below to apply".
- For questions, answer, leave changes empty and every campaign field null.
- campaign: only the campaign details the owner wants changed (name, tagline, big idea, offer, duration_weeks 1–26); everything else null.
  When duration_weeks grows, also create posts for the new weeks; when it shrinks, delete posts after the new end.
- scripts: video ad scripts. "update" gives the script's ref and the WHOLE new script; "create" has ref null and a whole script;
  "delete" gives the ref and script null. Each scene: time (e.g. "0–2s"), visual, voiceover, on_screen_text. Keep scenes inside length_seconds.
- You can change posts, those campaign details and video scripts. You can't change anything else from this chat; if asked, say so plainly
  and point to where it can be done, using only these real places:
  ideas: the Ideas tab (keep, drop or put an idea on the calendar); copy lines: the Copy tab ("more like these");
  results: open a post in the Calendar and fill in "How did it do?"; the goal number: the Results tab.
  Phases, goal type, channels and tone can't be changed after the campaign is made; say so, and offer to adjust the posts instead.
  Never invent a screen or setting that isn't in this list.
- op "update": ref is the post's ref. In fields, give ONLY the fields that change; every other field is null.
- op "create": ref is null. Give title, scheduled_on, channel and format, plus hook, body and cta when useful.
- op "delete": ref is the post's ref; all fields null.
- scheduled_on is YYYY-MM-DD from the start date to the end date (the new end date if you change duration_weeks).
- channel must be one of the campaign's channels.
- Format names in plain words: "Short video (Reel)", "Swipe post (Carousel)", "Story poll", "Photo post", "Email".
- body: 2–4 sentences ready to paste, ending with the call to action. Keep the campaign's tone and goal.
- Don't change posts with status "done" unless the owner names them. No invented statistics, testimonials or claims.
- At most 20 changes. reason: one short sentence per change.`;

function chatPrompt(t: Extract<Task, { task: "plan_chat" }>): string {
  const clip = (v: unknown, n: number) => (typeof v === "string" ? v.slice(0, n) : v);
  const c = t.plan.campaign;
  const items = (t.plan.items ?? []).slice(0, 150).map((it) =>
    Object.fromEntries(Object.entries(it).map(([k, v]) => [k, clip(v, 400)]).filter(([, v]) => v !== null && v !== "")),
  );
  const history = (t.history ?? []).slice(-10).map((m) => `${m.role === "user" ? "Owner" : "Flaunt"}: ${clip(m.text, 1000)}`).join("\n");
  return `Campaign: ${c.name ?? ""} for ${c.business_name}
Big idea: ${c.big_idea ?? "none"} · Tagline: ${c.tagline ?? "none"}
Audience: ${c.target_audience}
Goal: ${c.goal} · Tone: ${c.tone ?? "warm"} · Offer: ${c.offer ?? "none"}
Runs ${c.start_date} to ${addDays(c.start_date, c.duration_weeks * 7 - 1)} (${c.duration_weeks} weeks) · Channels: ${(c.channels ?? []).join(", ")}
Phases: ${(t.plan.phases ?? []).map((p) => `${p.name} (${p.starts_on} to ${p.ends_on})`).join("; ")}

Posts (JSON, one per line):
${items.map((it) => JSON.stringify(it)).join("\n")}

Video scripts (JSON, one per line):
${(t.plan.scripts ?? []).slice(0, 20).map((sc) => JSON.stringify(sc).slice(0, 4000)).join("\n") || "(none)"}
${history ? `\nConversation so far:\n${history}\n` : ""}${t.focus ? `\nThe owner is asking about post ${t.focus}.` : ""}
Owner: ${clip(t.message, 1000)}`;
}

// What each brief box is for, so the AI writes the right kind of answer.
const BRIEF_FIELDS: Record<BriefField, string> = {
  business_name: "the business name. A short brand name only, under 40 characters, no tagline",
  business_brief: "what the business sells or offers. One or two plain sentences: the product, what makes it different, and where or how people get it",
  target_audience: "who the campaign should reach. One or two sentences describing one real kind of person: who they are, where they are, what they care about",
  offer: "the offer or hook people act on. One short sentence with a clear reason to act now",
};

function refinePrompt(t: Extract<Task, { task: "refine_brief_field" }>): string {
  const clip = (s: unknown, n: number) => (typeof s === "string" ? s.slice(0, n) : "");
  const b = t.brief ?? {};
  const ctx = [
    ["Business", b.business_name], ["Sells", b.business_brief], ["Audience", b.target_audience],
    ["Goal", b.goal], ["Offer", b.offer], ["Tone", b.tone],
  ]
    .filter(([key, v]) => typeof v === "string" && v.trim() && key !== FIELD_KEYS[t.field])
    .map(([key, v]) => `${key}: ${clip(v, 400)}`)
    .join("\n");
  const value = clip(t.value, 1000).trim();
  const instruction = clip(t.instruction, 300).trim();
  return `A small-business owner is filling in a campaign brief. The box is ${BRIEF_FIELDS[t.field]}.
${ctx ? `What they've said so far:\n${ctx}\n` : ""}
${value ? `Their current answer (it may be rough or spoken aloud):\n"""${value}"""` : "The box is empty. Write an answer from what they've said so far."}
${instruction ? `Their request: ${instruction}` : value ? "Make it clearer and more specific, fixing grammar and filler words." : ""}
Give exactly 3 different versions they could use. Keep every real detail they gave.
Never invent prices, places, numbers, awards or claims they didn't mention; use at most one [placeholder] if a detail is truly needed.
Write in the first person plural where it fits ("we"). Plain words, no marketing jargon, no quotation marks around the answer.`;
}

const FIELD_KEYS: Record<BriefField, string> = {
  business_name: "Business", business_brief: "Sells", target_audience: "Audience", offer: "Offer",
};

const STYLE_RULES: Record<string, string> = {
  fresh: "Write a completely fresh take: new angle, new hook, same goal and channel.",
  shorter: "Make it about half as long. Keep the hook punchy and the call to action.",
  spanish: "Translate naturally into Latin American Spanish. Keep names, codes and hashtags unchanged.",
};

function taskPrompt(t: Task): string {
  if (t.task === "refine_brief_field") return refinePrompt(t);
  if (t.task === "plan_chat") return chatPrompt(t);
  if (t.task === "brief_chat") return briefChatPrompt(t);
  const c = t.campaign;
  const ctx = `Business: ${c.business_name}\nAudience: ${c.target_audience}\nGoal: ${c.goal}\nTone: ${c.tone ?? "warm"}\nOffer: ${c.offer ?? "none"}`;
  if (t.task === "rewrite_item") {
    return `${ctx}\n\n${STYLE_RULES[t.style] ?? STYLE_RULES.fresh}\nHook under 125 characters. No invented statistics or claims.\nPost to rewrite:\n${JSON.stringify(t.item)}`;
  }
  if (t.task === "more_copy") {
    return `${ctx}\n\nWrite 3 new ${t.group.replace("_", " ")} in the same voice as these, without repeating them:\n${t.examples.map((e) => `- ${e}`).join("\n")}`;
  }
  return `${ctx}\n\nHere are the campaign results the owner logged so far:\n${JSON.stringify(t.stats)}\nGive exactly 3 short, specific, plain-English suggestions for what to change next week. Base them only on these numbers.`;
}

async function runTask(t: Task) {
  const schema = TASK_SCHEMAS[t.task];
  if (!schema) throw new Error("Unknown task");
  if (t.task === "refine_brief_field" && !(t.field in BRIEF_FIELDS)) throw new Error("Unknown brief field");
  const ai = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages: [
        {
          role: "system",
          content: t.task === "plan_chat" ? CHAT_SYSTEM : t.task === "brief_chat" ? BRIEF_CHAT_SYSTEM : "You are Flaunt, a friendly senior marketer for small businesses. Plain English, no jargon, never mean.",
        },
        { role: "user", content: taskPrompt(t) },
      ],
      response_format: { type: "json_schema", json_schema: { name: t.task, strict: true, schema } },
    }),
  });
  if (!ai.ok) {
    console.error("OpenAI error", ai.status, await ai.text());
    throw new Error("AI busy");
  }
  const aiJson = await ai.json();
  return JSON.parse(aiJson.choices[0].message.content);
}
