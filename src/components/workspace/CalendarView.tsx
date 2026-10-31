import { useState } from 'react';
import { CalendarPlus, ChevronDown, ChevronLeft, ChevronRight, Download, FileSpreadsheet, HelpCircle } from 'lucide-react';
import BoardView from '@/components/workspace/BoardView';
import MonthGrid from '@/components/workspace/MonthGrid';
import PostCard from '@/components/workspace/PostCard';
import CopyButton from '@/components/CopyButton';
import type { CalendarItem, CampaignDetail, ItemStatus } from '@/lib/campaigns';
import { channelMeta } from '@/lib/channels';
import { exportGoogleCalendar, exportPlanCsv, planAsText } from '@/lib/exports';
import { phaseForDate, phaseStyle } from '@/lib/phases';
import { postTypesUsed, roundToQuarterHour } from '@/lib/postTypes';
import { addDaysIso, formatMinutes, formatShortDate, weekIndexFor } from '@/lib/schedule';
import { useMediaQuery } from '@/hooks/useMediaQuery';

type CalendarViewProps = {
  campaign: CampaignDetail;
  weekIndex: number;
  onWeekChange: (index: number) => void;
  onOpen: (item: CalendarItem) => void;
  onToggle: (item: CalendarItem) => void;
  onMove: (item: CalendarItem, iso: string) => void;
  onStatus: (item: CalendarItem, status: ItemStatus) => void;
  onAdd: (iso: string) => void;
  onHowItWorks: () => void;
};

type ViewMode = 'week' | 'month' | 'board' | 'list';

const VIEWS: { value: ViewMode; label: string; wide?: boolean }[] = [
  { value: 'week', label: 'This week' },
  { value: 'month', label: 'Month', wide: true },
  { value: 'board', label: 'Board', wide: true },
  { value: 'list', label: 'List' },
];

export default function CalendarView({
  campaign,
  weekIndex,
  onWeekChange,
  onOpen,
  onToggle,
  onMove,
  onStatus,
  onAdd,
  onHowItWorks,
}: CalendarViewProps) {
  const narrow = useMediaQuery('(max-width: 639px)');
  const [chosenMode, setMode] = useState<ViewMode>('week');
  const [channel, setChannel] = useState<string>('all');
  const [showTypes, setShowTypes] = useState(false);
  const mode = narrow && (chosenMode === 'month' || chosenMode === 'board') ? 'list' : chosenMode;

  const { start_date: startIso, duration_weeks: weeks, phases } = campaign;
  const items = channel === 'all' ? campaign.items : campaign.items.filter((i) => i.channel === channel);
  const itemsByWeek = (index: number) => items.filter((item) => weekIndexFor(item.scheduled_on, startIso) === index);
  const weekStart = addDaysIso(startIso, weekIndex * 7);
  const currentPhase = phaseForDate(phases, weekStart);
  const thisWeek = itemsByWeek(weekIndex);
  const weekMinutes = roundToQuarterHour(thisWeek.reduce((sum, item) => sum + (item.est_minutes ?? 0), 0));
  const types = postTypesUsed(campaign.items.map((i) => i.format));

  return (
    <section aria-label="Calendar">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="seg self-start" role="group" aria-label="Calendar view">
          {VIEWS.filter((v) => !(narrow && v.wide)).map((v) => (
            <button key={v.value} type="button" aria-pressed={mode === v.value} onClick={() => setMode(v.value)}>
              {v.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="sr-only" htmlFor="channel-filter">
            Filter by channel
          </label>
          <select id="channel-filter" value={channel} onChange={(e) => setChannel(e.target.value)} className="btn-soft !py-1.5 pr-8">
            <option value="all">All channels</option>
            {campaign.channels.map((c) => (
              <option key={c} value={c}>
                {channelMeta(c).label}
              </option>
            ))}
          </select>
          <ExportMenu campaign={campaign} />
        </div>
      </div>

      {mode === 'week' && (
        <div className="mt-6">
          <div className="card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between md:p-6">
            <div className="min-w-0">
              <p className="eyebrow">
                Week {weekIndex + 1} of {weeks} · {formatShortDate(weekStart)} – {formatShortDate(addDaysIso(weekStart, 6))}
              </p>
              {currentPhase && (
                <p className="mt-2 text-xl font-extrabold">
                  <span className={phaseStyle(phases.indexOf(currentPhase)).text}>●</span> {currentPhase.name}
                  {currentPhase.objective && (
                    <span className="block text-base font-medium text-muted sm:inline">
                      <span className="hidden sm:inline"> · </span>
                      {currentPhase.objective}
                    </span>
                  )}
                </p>
              )}
              <p className="mt-1.5 text-sm text-muted">
                {thisWeek.length} {thisWeek.length === 1 ? 'post' : 'posts'}
                {weekMinutes > 0 && (
                  <>
                    {' · '}
                    <span
                      className="cursor-help underline decoration-dotted underline-offset-4"
                      title="Each post type has a fixed time estimate. We add them up for this week and round to the nearest 15 minutes. It's a guide, not a timer."
                    >
                      about {formatMinutes(weekMinutes)} of work
                    </span>{' '}
                    <button type="button" onClick={onHowItWorks} className="font-semibold text-teal hover:underline">
                      how?
                    </button>
                  </>
                )}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button type="button" onClick={() => onWeekChange(weekIndex - 1)} disabled={weekIndex === 0} aria-label="Previous week" className="btn-ghost !px-3">
                <ChevronLeft className="h-5 w-5" aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => onWeekChange(weekIndex + 1)}
                disabled={weekIndex >= weeks - 1}
                aria-label="Next week"
                className="btn-ghost !px-3"
              >
                <ChevronRight className="h-5 w-5" aria-hidden />
              </button>
            </div>
          </div>

          {thisWeek.length === 0 ? (
            <div className="card mt-4 flex flex-col items-center gap-3 p-8 text-center">
              <p className="font-bold">A quiet week. Suspiciously quiet.</p>
              <button type="button" onClick={() => onAdd(weekStart)} className="btn-soft">
                <CalendarPlus className="h-4 w-4" aria-hidden /> Add a post this week
              </button>
            </div>
          ) : (
            <ul className="mt-4 flex flex-col gap-3">
              {thisWeek.map((item) => (
                <PostCard key={item.id} item={item} onToggle={() => onToggle(item)} onOpen={() => onOpen(item)} />
              ))}
            </ul>
          )}
        </div>
      )}

      {mode === 'month' && (
        <div className="mt-6">
          <p className="mb-3 text-sm text-muted">Drag a post to another day to move it. Hover a day and press + to add one.</p>
          <MonthGrid startIso={startIso} weeks={weeks} phases={phases} items={items} onOpen={onOpen} onMove={onMove} onAdd={onAdd} />
        </div>
      )}

      {mode === 'board' && (
        <div className="mt-6">
          <p className="mb-3 text-sm text-muted">Drag cards between columns as each post moves along.</p>
          <BoardView items={items} onOpen={onOpen} onStatus={onStatus} />
        </div>
      )}

      {mode === 'list' && (
        <div className="mt-6 flex flex-col gap-8">
          {Array.from({ length: weeks }, (_, index) => index)
            .filter((index) => itemsByWeek(index).length > 0)
            .map((index) => {
              const start = addDaysIso(startIso, index * 7);
              const phase = phaseForDate(phases, start);
              return (
                <div key={index}>
                  <h3 className="flex flex-wrap items-baseline gap-x-3 text-xl font-extrabold">
                    Week {index + 1}
                    <span className="font-mono text-xs font-medium text-muted">
                      {formatShortDate(start)} – {formatShortDate(addDaysIso(start, 6))}
                    </span>
                    {phase && <span className={`text-sm font-bold ${phaseStyle(phases.indexOf(phase)).text}`}>{phase.name}</span>}
                  </h3>
                  <ul className="mt-3 flex flex-col gap-3">
                    {itemsByWeek(index).map((item) => (
                      <PostCard key={item.id} item={item} onToggle={() => onToggle(item)} onOpen={() => onOpen(item)} />
                    ))}
                  </ul>
                </div>
              );
            })}
          {items.length === 0 && (
            <div className="card p-8 text-center">
              <p className="font-bold">No posts on this channel yet.</p>
              <button type="button" onClick={() => setChannel('all')} className="btn-soft mt-3">
                Show all channels
              </button>
            </div>
          )}
        </div>
      )}

      <div className="card mt-8 overflow-hidden">
        <button
          type="button"
          aria-expanded={showTypes}
          onClick={() => setShowTypes((v) => !v)}
          className="flex w-full items-center gap-2 px-5 py-4 text-left font-bold"
        >
          <HelpCircle className="h-5 w-5 text-teal" aria-hidden />
          What do these post types mean?
          <ChevronDown className={`ml-auto h-5 w-5 transition-transform ${showTypes ? 'rotate-180' : ''}`} aria-hidden />
        </button>
        {showTypes && (
          <dl className="grid gap-x-8 gap-y-4 border-t border-line px-5 py-5 md:grid-cols-2">
            {types.map((t) => (
              <div key={t.key}>
                <dt className="flex items-baseline justify-between gap-3 font-bold">
                  {t.label}
                  <span className="font-mono text-xs font-medium text-muted">~{t.minutes} min</span>
                </dt>
                <dd className="mt-0.5 text-sm text-muted">{t.definition}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </section>
  );
}

function ExportMenu({ campaign }: { campaign: CampaignDetail }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button type="button" className="btn-soft" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        <Download className="h-4 w-4" aria-hidden /> Export
      </button>
      {open && (
        <div
          className="card absolute right-0 z-20 mt-2 flex w-60 flex-col gap-1 p-2 shadow-lift"
          onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
        >
          <button
            type="button"
            className="nav-link justify-start"
            onClick={() => {
              exportGoogleCalendar(campaign);
              setOpen(false);
            }}
          >
            <CalendarPlus className="h-4 w-4" aria-hidden /> Google Calendar (CSV)
          </button>
          <button
            type="button"
            className="nav-link justify-start"
            onClick={() => {
              exportPlanCsv(campaign);
              setOpen(false);
            }}
          >
            <FileSpreadsheet className="h-4 w-4" aria-hidden /> Full plan (CSV)
          </button>
          <CopyButton text={planAsText(campaign)} label="Copy whole plan" className="nav-link justify-start" />
        </div>
      )}
    </div>
  );
}
