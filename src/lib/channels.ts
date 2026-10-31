export type ChannelMeta = { label: string; color: string };

export const CHANNEL_META: Record<string, ChannelMeta> = {
  instagram: { label: 'Instagram', color: '#D6286A' },
  tiktok: { label: 'TikTok', color: '#00807A' },
  linkedin: { label: 'LinkedIn', color: '#2D6CDF' },
  email: { label: 'Email', color: '#B85A00' },
  facebook: { label: 'Facebook', color: '#4A5FE0' },
  google: { label: 'Google Ads', color: '#22813D' },
  blog: { label: 'Blog', color: '#8A5A3C' },
};

export function channelMeta(channel: string): ChannelMeta {
  return CHANNEL_META[channel] ?? { label: channel, color: '#2B1D16' };
}
