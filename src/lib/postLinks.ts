import type { CalendarItem } from '@/lib/campaigns';
import { channelMeta } from '@/lib/channels';

/** Where a post goes and what to do there. Flaunt can't post for the owner, so this is the hand-off. */
export type PostGuide = {
  /** The app or tool the post goes into, as the owner would say it. */
  app: string;
  /** Where to open it. Takes the caption so a network that can prefill text gets it. Null when there is no single place to go. */
  link: ((caption: string) => string) | null;
  /** Whether this kind of post normally carries pictures, even before one is added. */
  pictures: boolean;
  /** What step one is called. */
  captionLabel: string;
  tips: string[];
  /** A second thing to copy, such as an email subject line. */
  extraCopy?: { label: string; text: (item: Pick<CalendarItem, 'title' | 'hook'>) => string };
};

// LinkedIn fills its post box from ?text=. Long captions are left out so the link never breaks.
const LINKEDIN_TEXT_LIMIT = 1500;

const GUIDES: Record<string, PostGuide> = {
  instagram: {
    app: 'Instagram',
    link: () => 'https://www.instagram.com/',
    pictures: true,
    captionLabel: 'Copy your caption',
    tips: [
      'Tap + and choose Post (or Reel for a video).',
      'Pick your pictures first, then paste the caption.',
      'Put hashtags at the end of the caption, or in the first comment.',
    ],
  },
  facebook: {
    app: 'Facebook',
    link: () => 'https://www.facebook.com/',
    pictures: true,
    captionLabel: 'Copy your caption',
    tips: [
      'Open your Page and choose Create post.',
      'Add your picture, then paste the caption.',
      'Check it says your Page, not your personal profile, before you post.',
    ],
  },
  tiktok: {
    app: 'TikTok',
    link: () => 'https://www.tiktok.com/upload',
    pictures: true,
    captionLabel: 'Copy your caption',
    tips: [
      'Upload your video or photos.',
      'Paste the caption and add a few hashtags.',
      'Check who can see it before you post.',
    ],
  },
  linkedin: {
    app: 'LinkedIn',
    link: (caption) => {
      const base = 'https://www.linkedin.com/feed/?shareActive=true';
      return caption && caption.length <= LINKEDIN_TEXT_LIMIT ? `${base}&text=${encodeURIComponent(caption)}` : base;
    },
    pictures: true,
    captionLabel: 'Copy your post text',
    tips: [
      'Your text may already be filled in. If not, paste it.',
      'Add your picture, then post.',
      'Choose whether it goes out as you or as your Company Page.',
    ],
  },
  email: {
    app: 'your email tool',
    link: null,
    pictures: false,
    captionLabel: 'Copy your message',
    tips: [
      'Open the tool you send email from, such as Mailchimp or Gmail.',
      'Paste the subject line, then the message.',
      'Send yourself a test before it goes to your list.',
    ],
    extraCopy: { label: 'subject line', text: (item) => item.hook?.trim() || item.title },
  },
  google: {
    app: 'Google Ads',
    link: () => 'https://ads.google.com/',
    pictures: false,
    captionLabel: 'Copy your ad text',
    tips: [
      'Open Google Ads and start or edit your search ad.',
      'Paste the headline and text into the ad fields.',
      'Check the preview before you publish.',
    ],
  },
  blog: {
    app: 'your website',
    link: null,
    pictures: true,
    captionLabel: 'Copy your post text',
    tips: [
      'Open the editor for your website or blog.',
      'Paste the text and add your pictures.',
      'Preview it on your phone before you publish.',
    ],
  },
};

/** The guide for a channel. A channel Flaunt doesn't know still gets a plain copy-and-paste guide. */
export function guideFor(channel: string): PostGuide {
  return (
    GUIDES[channel] ?? {
      app: channelMeta(channel).label,
      link: null,
      pictures: true,
      captionLabel: 'Copy your caption',
      tips: ['Open the app or site where this goes.', 'Paste the text and add your picture.', 'Check it over, then post.'],
    }
  );
}
