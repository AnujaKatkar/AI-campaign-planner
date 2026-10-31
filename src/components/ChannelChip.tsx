import { channelMeta } from '@/lib/channels';

export default function ChannelChip({ channel, small = false }: { channel: string; small?: boolean }) {
  const meta = channelMeta(channel);
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full font-bold text-white ${small ? 'px-2 py-px text-[11px]' : 'px-2.5 py-0.5 text-xs'}`}
      style={{ backgroundColor: meta.color }}
    >
      {meta.label}
    </span>
  );
}
