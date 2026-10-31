export type PostType = { key: string; label: string; definition: string; minutes: number };

// Fixed time estimates. Flaunt adds these up; it is a guide, not a timer.
const TYPES: (PostType & { match: RegExp })[] = [
  { key: 'storypoll', label: 'Story poll', minutes: 10, match: /poll|story/i, definition: 'A 24-hour story with a tap-to-vote question. Quick, and people love having a say.' },
  { key: 'stitch', label: 'Stitch', minutes: 30, match: /stitch|duet/i, definition: 'A short video that plays a clip of someone else’s video first, then your reply.' },
  { key: 'trend', label: 'Trend video', minutes: 30, match: /trend/i, definition: 'Your spin on a sound or format that is already popular this week.' },
  { key: 'reel', label: 'Short video (Reel)', minutes: 45, match: /reel|short video|tiktok video|video/i, definition: 'A vertical video under 60 seconds. The first 2 seconds decide if anyone watches.' },
  { key: 'carousel', label: 'Swipe post (Carousel)', minutes: 40, match: /carousel|swipe|slides/i, definition: 'Up to 10 images people swipe through. Great for tips, steps and before/after.' },
  { key: 'photo', label: 'Photo post', minutes: 20, match: /photo|image|picture/i, definition: 'One strong picture with a caption. Simple, and still works.' },
  { key: 'email', label: 'Email', minutes: 30, match: /email|newsletter/i, definition: 'A short note to your list with one link and one thing to do.' },
  { key: 'gads', label: 'Google search ads', minutes: 60, match: /google|search ad|ads setup|ad setup/i, definition: 'Text ads that show when people search for what you sell. Set up once per phase.' },
  { key: 'blog', label: 'Blog post', minutes: 90, match: /blog|article/i, definition: 'A longer post on your site that people can find on Google for months.' },
  { key: 'lipost', label: 'LinkedIn post', minutes: 25, match: /linkedin|owner|founder/i, definition: 'A short text post in your own voice. Stories beat announcements.' },
  { key: 'group', label: 'Group post', minutes: 15, match: /group|community/i, definition: 'A helpful post in a local or interest group, not a sales pitch.' },
  { key: 'fbpost', label: 'Facebook post', minutes: 20, match: /facebook|fb/i, definition: 'A photo or short update for your page, ideal for local news and events.' },
];

const FALLBACK: PostType = { key: 'post', label: 'Post', minutes: 30, definition: 'A regular post for this channel.' };

export function postTypeFor(format: string): PostType {
  const found = TYPES.find((t) => t.key === format.toLowerCase() || t.match.test(format));
  return found ?? { ...FALLBACK, label: format || FALLBACK.label };
}

export function postTypesUsed(formats: string[]): PostType[] {
  const seen = new Map<string, PostType>();
  formats.forEach((f) => {
    const t = postTypeFor(f);
    if (!seen.has(t.key)) seen.set(t.key, t);
  });
  return [...seen.values()].sort((a, b) => a.minutes - b.minutes);
}

export function roundToQuarterHour(minutes: number): number {
  return Math.round(minutes / 15) * 15;
}
