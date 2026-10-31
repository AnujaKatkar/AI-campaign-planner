import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { AlertCircle, ArrowRight, Check, Circle, Loader2, Lock, Mic, Pencil, RotateCcw, Send, Sparkles, Square } from 'lucide-react';
import { appendSpoken, useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { briefChat, type BriefInput } from '@/lib/campaigns';
import { CHANNELS, GOALS, MUST_HAVES, briefPatchFromAI, hasValue } from '@/lib/briefSteps';

export type BrainstormMessage = { role: 'user' | 'assistant'; text: string; error?: boolean; suggestions?: string[] };

type BriefChatProps = {
  values: Partial<BriefInput>;
  onChange: (patch: Partial<BriefInput>) => void;
  messages: BrainstormMessage[];
  onMessages: (fn: (m: BrainstormMessage[]) => BrainstormMessage[]) => void;
  signedIn: boolean;
  onNeedAuth: () => void;
  onReview: () => void;
  onGenerate: () => void;
  onClearBrief: () => void;
};

const GREETING: BrainstormMessage = {
  role: 'assistant',
  text: 'Hi! Tell me about the business or idea you want to promote. Rough is fine. I can help with a name, who to target and an offer, and I’ll fill in your brief as we go.',
  suggestions: ['I have an idea but no name yet', 'Help me figure out who to target', 'I run a small shop and want more customers'],
};

export default function BriefChat({ values, onChange, messages, onMessages, signedIn, onNeedAuth, onReview, onGenerate, onClearBrief }: BriefChatProps) {
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const inputRef = useRef(input);
  inputRef.current = input;
  const speech = useSpeechRecognition((spoken) => setInput(appendSpoken(inputRef.current, spoken)));
  const scrollRef = useRef<HTMLDivElement>(null);
  const shown = messages.length ? messages : [GREETING];
  const last = shown[shown.length - 1];
  const done = MUST_HAVES.filter((f) => hasValue(values, f.key)).length;
  const ready = done === MUST_HAVES.length;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, thinking]);

  async function send(text: string) {
    const message = text.trim();
    if (!message || thinking) return;
    if (!signedIn) {
      onNeedAuth();
      return;
    }
    speech.stop();
    const history = messages.filter((m) => !m.error).map((m) => ({ role: m.role, text: m.text }));
    onMessages((m) => [...m, { role: 'user', text: message }]);
    setInput('');
    setThinking(true);
    try {
      const data = await briefChat({ brief: values, history, message });
      if (typeof data?.reply !== 'string') throw new Error('The AI came back empty. Try saying that another way.');
      const patch = briefPatchFromAI(data.brief);
      if (Object.keys(patch).length) onChange(patch);
      const suggestions = Array.isArray(data.suggestions) ? data.suggestions.filter((s): s is string => typeof s === 'string').slice(0, 4) : [];
      onMessages((m) => [...m, { role: 'assistant', text: data.reply as string, suggestions }]);
    } catch (err) {
      const text = err instanceof Error ? err.message : 'The AI is busy. Try again in a moment.';
      onMessages((m) => [...m, { role: 'assistant', text, error: true }]);
    } finally {
      setThinking(false);
    }
  }

  function clear(alsoBrief: boolean) {
    speech.stop();
    onMessages(() => []);
    if (alsoBrief) onClearBrief();
    setInput('');
    setConfirmClear(false);
  }

  function handleKey(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void send(input);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
      <section className="card flex h-[min(70vh,44rem)] min-h-[28rem] flex-col overflow-hidden">
        {messages.length > 0 && (
          <div className="flex flex-wrap items-center justify-end gap-2 border-b border-line px-4 py-2">
            {confirmClear ? (
              <>
                <span className="mr-auto text-sm font-semibold">Start over?</span>
                <button type="button" onClick={() => clear(false)} className="btn-soft">
                  Clear chat
                </button>
                {done > 0 && (
                  <button type="button" onClick={() => clear(true)} className="btn-soft !border-rose !text-rose">
                    Clear chat and brief
                  </button>
                )}
                <button type="button" onClick={() => setConfirmClear(false)} className="btn-soft">
                  Cancel
                </button>
              </>
            ) : (
              <button type="button" onClick={() => setConfirmClear(true)} disabled={thinking} className="btn-soft text-muted">
                <RotateCcw className="h-3.5 w-3.5" aria-hidden /> Clear chat
              </button>
            )}
          </div>
        )}
        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-5 sm:p-6" aria-live="polite">
          {shown.map((m, i) =>
            m.role === 'user' ? (
              <div key={i} className="flex justify-end">
                <p className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-ink px-4 py-2.5 text-cream">{m.text}</p>
              </div>
            ) : (
              <p
                key={i}
                role={m.error ? 'alert' : undefined}
                className={`max-w-[92%] whitespace-pre-wrap rounded-2xl rounded-bl-md border px-4 py-2.5 ${
                  m.error ? 'border-rose/40 bg-rose/10 text-rose-deep' : 'border-line bg-blush/40'
                }`}
              >
                {m.error ? <AlertCircle className="mr-1.5 inline h-4 w-4 align-[-2px]" aria-hidden /> : <Sparkles className="mr-1.5 inline h-4 w-4 align-[-2px] text-teal" aria-hidden />}
                {m.text}
              </p>
            ),
          )}
          {thinking && (
            <p className="inline-flex items-center gap-2 text-sm text-muted" role="status">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Flaunt is thinking…
            </p>
          )}
          {!thinking && last.role === 'assistant' && last.suggestions && last.suggestions.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {last.suggestions.map((s) => (
                <button key={s} type="button" onClick={() => send(s)} className="btn-soft text-left">
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-2 border-t border-line bg-surface p-3 sm:p-4">
          {!signedIn && (
            <p className="flex flex-wrap items-center gap-2 text-sm">
              <Lock className="h-4 w-4 shrink-0" aria-hidden /> Brainstorming uses AI, so it needs a free account. Your chat stays right here.
              <button type="button" onClick={onNeedAuth} className="btn-press btn-sm">
                Sign in
              </button>
            </p>
          )}
          {speech.listening && (
            <p className="text-sm italic text-muted" aria-live="polite">
              {speech.interim ? `“${speech.interim}…”` : 'Listening… tap the mic again when you’re done.'}
            </p>
          )}
          {speech.error && <p className="text-sm text-rose-deep">{speech.error}</p>}
          <div className="flex items-end gap-2">
            <textarea
              rows={2}
              autoFocus
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Tell Flaunt about your idea…"
              aria-label="Message Flaunt"
              className="field resize-none py-2 text-base"
            />
            {speech.supported && (
              <button
                type="button"
                onClick={speech.toggle}
                aria-pressed={speech.listening}
                aria-label={speech.listening ? 'Stop voice typing' : 'Speak your message'}
                className={`btn-soft !p-2.5 ${speech.listening ? 'border-rose bg-rose/10 text-rose-deep' : ''}`}
              >
                {speech.listening ? <Square className="h-4 w-4 fill-current" aria-hidden /> : <Mic className="h-4 w-4 text-teal" aria-hidden />}
              </button>
            )}
            <button type="button" onClick={() => send(input)} disabled={thinking || !input.trim()} aria-label="Send" className="btn-press !p-2.5">
              <Send className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </div>
      </section>

      <aside className="card h-fit p-5 lg:sticky lg:top-24">
        <p className="eyebrow">Your brief</p>
        <p className="mt-1 font-display text-lg font-extrabold">
          {done} of {MUST_HAVES.length} must-haves
        </p>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-blush">
          <div className="h-full rounded-full bg-honey transition-all duration-500" style={{ width: `${(done / MUST_HAVES.length) * 100}%` }} />
        </div>
        <ul className="mt-4 space-y-3">
          {MUST_HAVES.map((f) => {
            const filled = hasValue(values, f.key);
            return (
              <li key={f.key} className="flex gap-2.5">
                {filled ? (
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-sage" strokeWidth={3} aria-hidden />
                ) : (
                  <Circle className="mt-0.5 h-4 w-4 shrink-0 text-line" aria-hidden />
                )}
                <div className="min-w-0">
                  <p className={`text-sm font-bold ${filled ? '' : 'text-muted'}`}>{f.label}</p>
                  {filled && <p className="line-clamp-2 text-sm text-muted">{display(values, f.key)}</p>}
                </div>
              </li>
            );
          })}
          {values.offer && (
            <li className="flex gap-2.5">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-sage" strokeWidth={3} aria-hidden />
              <div className="min-w-0">
                <p className="text-sm font-bold">Offer</p>
                <p className="line-clamp-2 text-sm text-muted">{values.offer}</p>
              </div>
            </li>
          )}
        </ul>
        <div className="mt-5 flex flex-col gap-2">
          <button type="button" onClick={onGenerate} disabled={!ready} className="btn-press btn-sm">
            Flaunt it <ArrowRight className="h-4 w-4" aria-hidden />
          </button>
          <button type="button" onClick={onReview} className="btn-soft justify-center">
            <Pencil className="h-4 w-4" aria-hidden /> {ready ? 'Review brief first' : 'Fill the rest in myself'}
          </button>
        </div>
        {!ready && <p className="mt-3 text-xs text-muted">Keep chatting and Flaunt fills these in, or switch to the form any time.</p>}
      </aside>
    </div>
  );
}

function display(v: Partial<BriefInput>, key: keyof BriefInput): string {
  if (key === 'goal') return GOALS.find((g) => g.value === v.goal)?.label ?? '';
  if (key === 'channels') return (v.channels ?? []).map((c) => CHANNELS.find((x) => x.value === c)?.label ?? c).join(', ');
  return String(v[key] ?? '');
}
