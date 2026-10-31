import type { Asset, CalendarItem, CampaignDetail, CampaignStore, ItemStatus, Phase } from '@/lib/campaigns';
import { postTypeFor } from '@/lib/postTypes';
import { addDaysIso, todayIso } from '@/lib/schedule';

// The sample campaign lives only in this browser. Its results numbers are made-up examples.
const STORAGE_KEY = 'flaunt.sample.v2';

type Post = [title: string, format: string, hook: string, body: string, visual: string, why: string];

const INSTAGRAM: Post[] = [
  ['Smoke, then silence: our roaster at 5am', 'Short video (Reel)', 'This is what 5am smells like.', 'Every bag starts here, before the street wakes up. Small batches, roasted the day before they ship. Follow along: launch day is close.', 'Phone on the counter, slow pan across the roaster with the lights low.', 'Mystery plus craft makes people curious before you ask them for anything.'],
  ['Guess the origin (swipe for the answer)', 'Swipe post (Carousel)', 'Three beans. One is from a farm we visit every year.', 'Slide 1: three bean close-ups. Slides 2–4: one clue each. Slide 5: the reveal and the farmer’s name. Comment your guess.', 'Three bowls of beans on a wooden board, shot from above in daylight.', 'Games get comments, and comments tell Instagram to show the post to more people.'],
  ['Name our launch blend', 'Story poll', 'Help us name this one: "Ember Hour" or "Second Cup"?', 'Poll question: "Which name wins?" Options: Ember Hour / Second Cup. Winner is printed on the first 200 bags.', 'The unlabeled bag held up against a plain wall.', 'People who vote feel like co-owners and come back to see who won.'],
  ['The bag is here', 'Photo post', 'It’s real. It’s heavy. It smells unreal.', 'Our first subscription bag, fresh off the press. Doors open Monday, and your first bag is 20% off with code ROAST-REEL1.', 'One bag on the counter in morning light, steam from a cup behind it.', 'A clear product shot after a week of teasing gives the curiosity somewhere to land.'],
  ['How to brew it in 4 steps', 'Swipe post (Carousel)', 'Great coffee at home, no fancy kit.', 'Slide 1: what you need. Slides 2–5: grind, bloom, pour, wait. Slide 6: "Your first bag ships Tuesday. Link in bio."', 'Hands-only shots of each step on a kitchen counter.', 'Useful posts get saved, and saved posts keep getting seen for weeks.'],
  ['Meet Rosa, the farmer behind Ember Hour', 'Short video (Reel)', 'This bag has a name on it. Hers.', 'Rosa grows the beans in our launch blend. 30 seconds of her farm, in her words. Order a bag and her name ships with it.', 'Clips Rosa sent from her farm, with her voice over the top.', 'A real person behind the product builds trust faster than any claim.'],
  ['Your first-week photos', 'Photo post', 'You made the mornings look good.', 'A grid of photos from our first subscribers. Tag us with yours and we’ll share our favourites every Friday.', 'Screenshot collage of tagged customer photos, with permission.', 'Showing real customers tells new people that others already trust you.'],
  ['Subscription or one-off? Quick quiz', 'Story poll', 'How fast do you get through a bag?', 'Poll question: "One bag lasts me…" Options: A week / Two weeks / A month+. Next story: which plan fits each answer.', 'Simple text on a warm background, then the matching plan.', 'A quick question helps undecided people pick a plan without a sales pitch.'],
  ['Behind the scenes: packing day', 'Short video (Reel)', '214 bags. One afternoon. Zero spills (almost).', 'Sped-up packing footage set to a fun sound. Every order is packed by hand. Yours could be in the next batch.', 'Phone on a tripod above the packing table, time-lapse mode.', 'Behind-the-scenes content feels honest and keeps the brand human.'],
  ['What our regulars order', 'Swipe post (Carousel)', 'Steal our regulars’ go-to orders.', 'Five customers, five favourite blends and how they brew them. Swipe to find yours, then tap the link to order.', 'Portrait of each regular holding their cup, at the shop.', 'Peer picks make choosing easy for someone who is new to specialty coffee.'],
  ['Last call for the launch price', 'Photo post', 'The launch price ends Sunday.', 'Thank you for an amazing first month. The 20% launch code ends Sunday night. After that, it’s worth full price, promise.', 'Bag and a handwritten "Last call" note on the counter.', 'A real deadline gives fence-sitters a reason to act now.'],
  ['One month in: what we learned', 'Short video (Reel)', 'We sold out twice. Here’s what happened.', 'An honest look back at launch month: the wins, the mess and what’s next. Subscribe to be first for the next blend.', 'Talking to camera at the roaster, one take.', 'A candid recap turns one-time buyers into fans who stick around.'],
];

const TIKTOK: Post[] = [
  ['POV: you smell fresh-roasted coffee for the first time', 'Short video (Reel)', 'POV: you finally smell real coffee.', 'Close-up of beans dropping from the roaster, reaction shot, text: "launching soon". Follow so you don’t miss it.', 'Close-up of the cooling tray, then a friend’s honest reaction.', 'A first-person POV hook pulls people into the moment in under 2 seconds.'],
  ['Stitch: "Is expensive coffee worth it?"', 'Stitch', 'Okay, let’s actually answer this.', 'Stitch a popular "is it worth it" video. Show the cost per cup of our bag versus a café latte. Let people decide.', 'Hold a bag and a café cup side by side, talking to camera.', 'Replying to a big conversation borrows its audience.'],
  ['Day 1 of launching a coffee brand', 'Short video (Reel)', 'Day 1 of launching a coffee brand from a garage.', 'Start a daily diary series. Today: the first test roast. Follow to see if we make it to launch day.', 'Selfie-style clips through the day, with quick cuts.', 'A series gives people a reason to follow and come back tomorrow.'],
  ['Rating our beans, brutally', 'Trend video', 'We blind-tasted our own coffee. It got awkward.', 'Use the trending "rating things" sound. The team rates three blends blind. The winner becomes the launch blend.', 'Three cups, blindfolded team member, honest faces.', 'Self-aware humour on a trending sound feels native, not like an ad.'],
  ['Launch day unboxing', 'Short video (Reel)', 'The first box just left the building.', 'Pack and seal the very first order on camera. Code ROAST-REEL1 takes 20% off your first bag, this week only.', 'Hands packing a box, the label, the door closing.', 'Watching the first order ship makes the launch feel like an event.'],
  ['3 mistakes ruining your home coffee', 'Short video (Reel)', 'Stop storing coffee in the freezer.', 'Three fast fixes: storage, grind, water temperature. Save this, and try it with a fresh bag.', 'Quick-cut demo at a home kitchen counter.', 'Practical tips get saved and shared, which TikTok rewards.'],
  ['Reply to a comment: "why so expensive?"', 'Stitch', 'Someone asked why our coffee costs more. Fair.', 'Answer the comment honestly: what the farmer is paid, roasting by hand, shipping fresh. No hard sell.', 'Comment sticker on screen, then the roaster behind you.', 'Answering doubts in public turns sceptics into buyers.'],
  ['Day 14 of launching a coffee brand', 'Short video (Reel)', 'Day 14. We ran out of bags.', 'The diary continues: the first restock, the first wholesale call. Follow for day 15.', 'Empty shelves, then the new boxes arriving.', 'A sell-out moment is honest proof that others are buying.'],
  ['Coffee order personality test', 'Trend video', 'Your coffee order says a lot about you.', 'Use a trending sound. Each blend gets a personality. Comment yours and we’ll tell you which bag to try.', 'Each team member acting out a blend, quick transitions.', 'Personality content is easy to share with friends.'],
  ['Brew with me: Sunday slow pour', 'Short video (Reel)', 'Sunday morning, no rush.', 'A calm, satisfying pour-over with ambient sound. Our Sunday blend ships every two weeks. Link in bio.', 'Steady shot, natural light, sound of the kettle.', 'Calm, satisfying videos get watched to the end, which boosts reach.'],
  ['Stitch: the 5am routine trend', 'Stitch', 'My 5am routine is mostly coffee.', 'Stitch a popular morning-routine video with ours: roast, taste, pack. End with the subscription link.', 'Early-morning clips at the roaster.', 'Joining a trend with your real routine feels honest and timely.'],
  ['Thank you, first 500', 'Short video (Reel)', '500 of you took a chance on us.', 'A heartfelt thank-you with a montage of customer photos. Next blend drops soon: follow to be first.', 'Montage of tagged photos and the team waving.', 'Gratitude closes the campaign warmly and keeps people around for what’s next.'],
];

const EMAIL: Post[] = [
  ['Something’s brewing (you’re on the list)', 'Email', 'You’re first in line.', 'Short note: what we’re launching, why, and the date. One link: "Save my spot".', 'One photo of the roaster at dawn.', 'Telling your list first rewards the people most likely to buy.'],
  ['Pick the name, get first dibs', 'Email', 'Vote, and your bag ships first.', 'Two name options, one click each. Everyone who votes gets early access on launch day.', 'Two buttons with the name options.', 'A tiny action now makes the bigger action (buying) easier later.'],
  ['Doors are open', 'Email', 'Your first bag is waiting.', 'We’re live. Use code ROAST-REEL1 for 20% off your first bag. Pickup is at [pickup address] on Saturdays.', 'Hero shot of the bag with the code on top.', 'One clear offer on launch day turns built-up interest into first orders.'],
  ['How to make your first bag taste amazing', 'Email', 'Read this before you open your bag.', 'Three quick brewing tips and a link to the 4-step guide. Reply with a photo of your first cup.', 'Simple brew guide graphic.', 'Helping buyers succeed reduces regret and gets them to reorder.'],
  ['Halfway: here’s what you’re loving', 'Email', 'The blend everyone’s reordering.', 'Share the most reordered blend and two customer quotes. Button: "Add it to my subscription".', 'Bag photo plus two short quotes.', 'Showing what others reorder helps people choose with confidence.'],
  ['Last day for the launch price', 'Email', 'Tonight’s the night.', 'The launch code ends at midnight. Thank you for being here from the start. One button: "Order my bag".', 'Countdown style header.', 'A final, friendly reminder catches people who meant to order.'],
];

const PHASES: [name: string, objective: string, from: number, to: number][] = [
  ['Whisper', 'Make people curious before anything is for sale.', 0, 9],
  ['Reveal', 'Open the doors and turn curiosity into first orders.', 10, 20],
  ['Proof', 'Show real customers loving it so new people trust it.', 21, 31],
  ['Momentum', 'Lock in subscribers before the launch price ends.', 32, 41],
];

// conversions, reach, clicks for the first 14 posts (in date order, ad setups skipped)
const LOGGED: Record<string, [number, number, number]> = {
  ig0: [2, 1180, 46], tt0: [6, 4620, 88], em0: [4, 410, 61], ig1: [3, 1340, 52], tt1: [7, 5210, 104],
  ig2: [4, 1560, 63], tt2: [8, 6050, 131], em1: [5, 455, 72], ig3: [5, 1720, 70], tt3: [9, 7330, 152],
  ig4: [0, 980, 31], tt4: [7, 5880, 120],
};

function buildSample(): CampaignDetail {
  const start = addDaysIso(todayIso(), -17);
  const phases: Phase[] = PHASES.map(([name, objective, from, to], i) => ({
    id: `phase-${i}`,
    name,
    objective,
    starts_on: addDaysIso(start, from),
    ends_on: addDaysIso(start, to),
  }));
  const phaseFor = (day: number) => phases[PHASES.findIndex(([, , from, to]) => day >= from && day <= to)]?.id ?? null;

  const raw: { day: number; channel: string; post: Post; key: string; minutes: number }[] = [];
  const count = { instagram: 0, tiktok: 0, email: 0 };
  for (let week = 0; week < 6; week++) {
    const slots: [number, 'instagram' | 'tiktok' | 'email'][] = [[0, 'instagram'], [1, 'tiktok'], [2, 'email'], [3, 'instagram'], [5, 'tiktok']];
    slots.forEach(([offset, channel]) => {
      const n = count[channel]++;
      const list = channel === 'instagram' ? INSTAGRAM : channel === 'tiktok' ? TIKTOK : EMAIL;
      const key = `${channel === 'instagram' ? 'ig' : channel === 'tiktok' ? 'tt' : 'em'}${n}`;
      const minutes = postTypeFor(list[n][1]).minutes;
      raw.push({ day: week * 7 + offset, channel, post: list[n], key, minutes });
    });
  }
  PHASES.forEach(([name, , from], i) => {
    raw.push({
      day: from,
      channel: 'google',
      key: `g${i}`,
      minutes: 60,
      post: [
        `Set up Google search ads: ${name}`,
        'Google search ads',
        i === 0 ? 'Fresh roasted coffee, delivered weekly' : i === 1 ? 'Small-batch coffee subscription, now open' : 'Loved by 500+ local coffee drinkers',
        'Three ads, one budget. Target searches like "coffee subscription near me" and "fresh roasted beans". Send clicks to the subscribe page.',
        'No shoot needed. Reuse the bag photo.',
        'Search ads catch people who are already looking, so they convert well.',
      ],
    });
  });
  raw.sort((a, b) => a.day - b.day || (a.channel === 'google' ? 1 : -1));

  const items: CalendarItem[] = raw.map((r, index) => {
    const [title, format, hook, body, visual, why] = r.post;
    const result = LOGGED[r.key];
    const status: ItemStatus = index < 14 ? 'done' : index < 17 ? 'ready' : r.day > 34 ? 'idea' : 'draft';
    return {
      id: `item-${index}`,
      phase_id: phaseFor(r.day),
      scheduled_on: addDaysIso(start, r.day),
      channel: r.channel,
      format,
      est_minutes: r.minutes,
      title,
      hook,
      body,
      cta: r.channel === 'email' ? 'Order my bag' : r.channel === 'google' ? 'Subscribe today' : 'Tap the link in bio',
      visual,
      why,
      status,
      reach: status === 'done' && result ? result[1] : null,
      clicks: status === 'done' && result ? result[2] : null,
      conversions: status === 'done' && result ? result[0] : null,
      sort: index,
    };
  });

  const ideas = [
    ['Roaster cam live stream', 'Go live for 20 minutes during a Saturday roast and answer questions.', 'instagram', 'Live video'],
    ['Mug swap', 'Customers bring an old mug, get a free refill, and the mug goes on the "wall of mugs".', 'instagram', 'Photo post'],
    ['Bean-to-cup timeline', 'A single video that follows one bean from farm to your kitchen.', 'tiktok', 'Short video (Reel)'],
    ['Office coffee taste-off', 'Send free samples to 3 local offices and film the blind taste test.', 'tiktok', 'Short video (Reel)'],
    ['Subscriber-only tasting notes', 'A tiny printed card in every bag with a QR code to a secret playlist.', 'email', 'Email'],
    ['Ask the roaster Fridays', 'A weekly story Q&A answering coffee questions.', 'instagram', 'Story poll'],
    ['Neighbourhood map', 'A map of local cafés that serve your beans, shared as a swipe post.', 'instagram', 'Swipe post (Carousel)'],
    ['Cold brew kit drop', 'A limited summer kit with a how-to video.', 'tiktok', 'Trend video'],
    ['Refer a friend, both get a bag', 'Simple referral push for subscribers in week 5.', 'email', 'Email'],
    ['Wrong answers only', 'Post a weird photo of the roaster and ask for wrong answers only.', 'tiktok', 'Trend video'],
  ];

  const assets: Asset[] = [
    ...ideas.map(([title, description, channel, format], i): Asset => ({
      id: `idea-${i}`,
      kind: 'idea',
      title,
      content: { title, description, channel, format },
      kept: true,
    })),
    {
      id: 'script-6',
      kind: 'ad_script',
      title: 'The 5am bumper',
      kept: true,
      content: {
        title: 'The 5am bumper',
        platform: 'Instagram / YouTube',
        length_seconds: 6,
        cta: 'Subscribe',
        scenes: [
          { time: '0–2s', visual: 'Beans tumbling out of the roaster, steam rising', voiceover: '(sizzle sound)', on_screen_text: '5am. Every batch.' },
          { time: '2–6s', visual: 'Bag on doorstep, hand picks it up', voiceover: 'Roasted yesterday. At your door today.', on_screen_text: 'Ember & Oak · Subscribe' },
        ],
      },
    },
    {
      id: 'script-15',
      kind: 'ad_script',
      title: 'POV: real coffee',
      kept: true,
      content: {
        title: 'POV: real coffee',
        platform: 'TikTok / Reels (vertical)',
        length_seconds: 15,
        cta: 'Get 20% off your first bag',
        scenes: [
          { time: '0–2s', visual: 'Close-up of a face smelling fresh beans, eyes widen', voiceover: 'POV: you finally smell real coffee.', on_screen_text: 'POV: real coffee' },
          { time: '2–8s', visual: 'Quick cuts: roaster, packing, kettle pour', voiceover: 'Small batches, roasted by hand, shipped the next day.', on_screen_text: 'Roasted yesterday' },
          { time: '8–15s', visual: 'Bag on a kitchen counter, code on screen', voiceover: 'Your first bag is 20% off this week.', on_screen_text: 'Code ROAST-REEL1' },
        ],
      },
    },
    {
      id: 'script-30',
      kind: 'ad_script',
      title: 'Stale to stellar',
      kept: true,
      content: {
        title: 'Stale to stellar',
        platform: 'Facebook / Instagram feed',
        length_seconds: 30,
        cta: 'Start my subscription',
        scenes: [
          { time: '0–5s', visual: 'Someone sighs at a dull supermarket coffee', voiceover: 'Supermarket coffee was roasted months ago.', on_screen_text: 'Roasted… when?' },
          { time: '5–15s', visual: 'Our roaster at dawn, Rosa’s farm clips', voiceover: 'We roast small batches every morning, from farms we actually visit.', on_screen_text: 'Roasted every morning' },
          { time: '15–25s', visual: 'Bag arrives, first pour, smile', voiceover: 'It ships the next day, so it tastes the way it should.', on_screen_text: 'At your door in 2 days' },
          { time: '25–30s', visual: 'Logo, bag, code', voiceover: 'Start your subscription today.', on_screen_text: 'Ember & Oak · Subscribe' },
        ],
      },
    },
    {
      id: 'copy',
      kind: 'copy',
      title: 'Campaign copy',
      kept: true,
      content: {
        headlines: ['Roasted yesterday. Yours tomorrow.', 'Coffee that remembers its farm', 'Your mornings, upgraded', 'Small batch. Big mornings.', 'The last coffee subscription you’ll try'],
        primary_texts: [
          'We roast small batches every morning and ship them the next day, so your coffee tastes the way the farmer meant it to.',
          'Meet Ember Hour: our launch blend, named by our community and grown by Rosa. Your first bag is 20% off this week.',
          'No more stale bags from the back of the shelf. Pick a blend, pick how often, and we handle the rest.',
        ],
        email_subjects: ['Something’s brewing ☕', 'You named it. Now taste it.', 'Doors are open', 'Read this before you open your bag', 'Last call for the launch price'],
        ctas: ['Order my bag', 'Start my subscription', 'Save my spot', 'Try the launch blend'],
        hashtags: ['#specialtycoffee', '#coffeesubscription', '#smallbatchcoffee', '#freshroasted', '#shoplocal', '#coffeelover', '#morningritual', '#emberandoak'],
      },
    },
    {
      id: 'brief',
      kind: 'creative_brief',
      title: 'Creative brief',
      kept: true,
      content: {
        background: 'Ember & Oak is a two-person roastery launching an online coffee subscription after three years of selling at the Saturday market.',
        objective: 'Get 150 first orders for the subscription in six weeks.',
        audience: 'Busy 25–45 year olds within 20 miles who already spend money on café coffee and want better coffee at home.',
        insight: 'People love café coffee but think great coffee at home needs expensive gear and expert skills.',
        single_minded_proposition: 'Café-quality coffee at home, roasted yesterday.',
        reasons_to_believe: ['Roasted in small batches every morning', 'Ships the day after roasting', 'Beans from farms the founders visit every year'],
        tone: 'Warm, a little cheeky, never snobby.',
        mandatories: ['Show the roast date', 'Launch code ROAST-REEL1 in every launch-week post', 'No claims about health benefits'],
        deliverables: ['24 Instagram and TikTok posts', '6 emails', '4 Google search ad sets', '3 video ads (6s, 15s, 30s)'],
        kpis: ['150 first orders', 'Email opens above 40%', 'Average 5,000 TikTok viewers per video'],
      },
    },
  ];

  return {
    id: 'sample',
    name: 'Ember Hour Launch',
    big_idea: 'Coffee this fresh has a story. Let people meet it before they taste it.',
    tagline: 'Roasted yesterday. Yours tomorrow.',
    business_name: 'Ember & Oak Coffee Roasters',
    business_brief: 'Small-batch coffee roastery launching a fresh-roasted subscription delivered locally.',
    target_audience: 'Busy 25–45 year olds nearby who buy café coffee and want better coffee at home.',
    goal: 'launch',
    offer: '20% off your first bag with code ROAST-REEL1',
    start_date: start,
    duration_weeks: 6,
    channels: ['instagram', 'tiktok', 'email', 'google'],
    tone: 'Warm',
    workload: 'steady',
    story_recipe: 'backstage',
    goal_label: 'First orders',
    goal_target: 150,
    status: 'active',
    phases,
    items,
    assets,
  };
}

export function loadSample(): CampaignDetail {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved) as CampaignDetail;
  } catch {
    // Fall through to a fresh sample.
  }
  return buildSample();
}

export function resetSample(): CampaignDetail {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing saved to clear.
  }
  return buildSample();
}

export function saveSample(campaign: CampaignDetail) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(campaign));
  } catch {
    // Storage full or blocked: changes still show for this visit.
  }
}

/** The workspace saves the whole sample after every change, so these only need to succeed. */
export const sampleStore: CampaignStore = {
  kind: 'sample',
  updateItem: async () => {},
  deleteItem: async () => {},
  updateCampaign: async () => {},
  updateAsset: async () => {},
  createItem: async (item) => ({ ...item, id: `item-${Date.now()}` }),
};
