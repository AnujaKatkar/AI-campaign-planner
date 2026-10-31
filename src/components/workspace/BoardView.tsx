import { useState } from 'react';
import ChannelChip from '@/components/ChannelChip';
import { STATUS_LABELS, type CalendarItem, type ItemStatus } from '@/lib/campaigns';
import { flauntCheck } from '@/lib/check';
import { formatShortDate } from '@/lib/schedule';

const COLUMNS: { status: ItemStatus; tone: string }[] = [
  { status: 'idea', tone: 'bg-muted' },
  { status: 'draft', tone: 'bg-honey' },
  { status: 'ready', tone: 'bg-teal' },
  { status: 'done', tone: 'bg-sage' },
];

type BoardViewProps = {
  items: CalendarItem[];
  onOpen: (item: CalendarItem) => void;
  onStatus: (item: CalendarItem, status: ItemStatus) => void;
};

export default function BoardView({ items, onOpen, onStatus }: BoardViewProps) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [over, setOver] = useState<ItemStatus | null>(null);

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {COLUMNS.map(({ status, tone }) => {
        const column = items.filter((i) => i.status === status);
        return (
          <section
            key={status}
            aria-label={STATUS_LABELS[status]}
            onDragOver={(e) => {
              if (!dragId) return;
              e.preventDefault();
              setOver(status);
            }}
            onDragLeave={() => setOver((v) => (v === status ? null : v))}
            onDrop={(e) => {
              e.preventDefault();
              const item = items.find((i) => i.id === dragId);
              if (item && item.status !== status) onStatus(item, status);
              setDragId(null);
              setOver(null);
            }}
            className={`rounded-card border border-line bg-blush/50 p-3 transition ${over === status ? 'ring-2 ring-teal' : ''}`}
          >
            <h3 className="flex items-center gap-2 px-1 text-base font-extrabold">
              <span className={`h-2.5 w-2.5 rounded-full ${tone}`} aria-hidden />
              {STATUS_LABELS[status]}
              <span className="ml-auto font-mono text-xs font-medium text-muted">{column.length}</span>
            </h3>
            <ul className="mt-3 max-h-[34rem] space-y-2 overflow-y-auto pr-1">
              {column.map((item) => {
                const issues = status === 'done' ? 0 : flauntCheck(item).length;
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      draggable
                      onDragStart={() => setDragId(item.id)}
                      onDragEnd={() => setDragId(null)}
                      onClick={() => onOpen(item)}
                      className={`card w-full cursor-grab p-3 text-left transition hover:border-muted active:cursor-grabbing ${
                        dragId === item.id ? 'opacity-40' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <ChannelChip channel={item.channel} small />
                        <span className="font-mono text-[11px] text-muted">{formatShortDate(item.scheduled_on)}</span>
                        {issues > 0 && <span className="pill ml-auto bg-honey/25 !px-1.5 text-[10px]">⚠ {issues}</span>}
                      </div>
                      <p className="mt-1.5 text-sm font-bold leading-snug">{item.title}</p>
                    </button>
                  </li>
                );
              })}
              {column.length === 0 && <li className="px-1 py-4 text-center text-sm text-muted">Drag a post here.</li>}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
