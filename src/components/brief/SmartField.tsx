import { useRef, useState, type KeyboardEvent } from 'react';
import { AlertCircle, Check, Loader2, Lock, Mic, Send, Sparkles, Square, Undo2, X } from 'lucide-react';
import { appendSpoken, useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { refineBriefField, type BriefInput, type BriefTextField } from '@/lib/campaigns';

type SmartFieldProps = {
  field: BriefTextField;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  placeholder?: string;
  label: string;
  brief: Partial<BriefInput>;
  signedIn: boolean;
  onNeedAuth: () => void;
};

const QUICK_FIXES: { label: string; instruction: string }[] = [
  { label: 'Polish it', instruction: 'Make it clearer and fix grammar and filler words.' },
  { label: 'More specific', instruction: 'Make it more specific and vivid, using only details already given.' },
  { label: 'Shorter', instruction: 'Make it about half as long without losing the key detail.' },
];

function MicButton({ speech, label }: { speech: ReturnType<typeof useSpeechRecognition>; label: string }) {
  if (!speech.supported) return null;
  return (
    <button
      type="button"
      onClick={speech.toggle}
      aria-pressed={speech.listening}
      aria-label={speech.listening ? 'Stop voice typing' : label}
      title={speech.listening ? 'Stop voice typing' : label}
      className={`btn-soft ${speech.listening ? 'border-rose bg-rose/10 text-rose-deep hover:bg-rose/15' : ''}`}
    >
      {speech.listening ? (
        <>
          <span className="relative flex h-2.5 w-2.5" aria-hidden>
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-rose" />
          </span>
          <Square className="h-3.5 w-3.5 fill-current" aria-hidden /> Stop
        </>
      ) : (
        <>
          <Mic className="h-4 w-4 text-teal" aria-hidden /> Speak
        </>
      )}
    </button>
  );
}

/** A brief text box with voice typing and an AI helper that suggests better versions of the answer. */
export default function SmartField({ field, value, onChange, multiline, placeholder, label, brief, signedIn, onNeedAuth }: SmartFieldProps) {
  const valueRef = useRef(value);
  valueRef.current = value;
  const speech = useSpeechRecognition((spoken) => onChange(appendSpoken(valueRef.current, spoken)));

  const [aiOpen, setAiOpen] = useState(false);
  const [instruction, setInstruction] = useState('');
  const instructionRef = useRef(instruction);
  instructionRef.current = instruction;
  const instructionSpeech = useSpeechRecognition((spoken) => setInstruction(appendSpoken(instructionRef.current, spoken)));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [undoValue, setUndoValue] = useState<string | null>(null);

  const isEmpty = !value.trim();
  const hasContext = [brief.business_name, brief.business_brief, brief.target_audience].some((v) => v?.trim());
  const canDraft = !isEmpty || hasContext;

  // A typed request is enough to go on, even when the box and the rest of the brief are empty.
  async function ask(request?: string) {
    if (busy || (!canDraft && !request?.trim())) return;
    speech.stop();
    instructionSpeech.stop();
    setBusy(true);
    setError(null);
    setSuggestions([]);
    try {
      const next = await refineBriefField(field, value, brief, request?.trim() || undefined);
      if (next.length === 0) setError('The AI came back empty. Try asking a different way.');
      setSuggestions(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The AI is busy. Try again in a moment.');
    } finally {
      setBusy(false);
    }
  }

  function apply(suggestion: string) {
    setUndoValue(value);
    onChange(suggestion);
    setSuggestions([]);
    setInstruction('');
    setAiOpen(false);
  }

  // Enter sends the request instead of moving to the next question.
  function handleInstructionKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      void ask(instruction);
    }
  }

  const fieldProps = {
    autoFocus: true,
    value,
    onChange: (e: { target: { value: string } }) => {
      setUndoValue(null);
      onChange(e.target.value);
    },
    placeholder,
    'aria-label': label,
    className: 'field text-lg',
  };

  return (
    <div className="space-y-3">
      {multiline ? <textarea rows={3} {...fieldProps} /> : <input type="text" {...fieldProps} />}

      {speech.listening && (
        <p className="rise text-sm italic text-muted" aria-live="polite">
          {speech.interim ? `“${speech.interim}…”` : 'Listening… say your answer, then tap Stop.'}
        </p>
      )}
      {speech.error && <p className="text-sm text-rose-deep">{speech.error}</p>}

      <div className="flex flex-wrap items-center gap-2">
        <MicButton speech={speech} label="Speak your answer" />
        <button
          type="button"
          onClick={() => {
            setAiOpen((open) => !open);
            setError(null);
          }}
          aria-expanded={aiOpen}
          className={`btn-soft ${aiOpen ? 'border-teal bg-teal/10' : ''}`}
        >
          <Sparkles className="h-4 w-4 text-teal" aria-hidden /> {isEmpty ? 'Write it with AI' : 'Improve with AI'}
        </button>
        {undoValue !== null && (
          <button type="button" onClick={() => { onChange(undoValue); setUndoValue(null); }} className="btn-soft text-muted">
            <Undo2 className="h-4 w-4" aria-hidden /> Undo AI change
          </button>
        )}
      </div>

      {aiOpen && (
        <div className="rise rounded-2xl border border-line bg-blush/40 p-4">
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm font-bold">
              <Sparkles className="mr-1 inline h-4 w-4 text-teal" aria-hidden />
              {isEmpty ? 'Let AI draft this answer' : 'How should AI change it?'}
            </p>
            <button type="button" onClick={() => setAiOpen(false)} aria-label="Close AI helper" className="rounded-full p-1 text-muted hover:bg-blush hover:text-ink">
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>

          {!signedIn ? (
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
              <span className="inline-flex items-center gap-2">
                <Lock className="h-4 w-4 shrink-0" aria-hidden /> AI help needs a free account. Your answers stay right here.
              </span>
              <button type="button" onClick={onNeedAuth} className="btn-press btn-sm">
                Sign in to use AI
              </button>
            </div>
          ) : (
            <>
              <div className="mt-3 flex flex-wrap gap-2">
                {isEmpty ? (
                  <button type="button" onClick={() => ask()} disabled={busy || !canDraft} className="btn-soft">
                    Write it for me
                  </button>
                ) : (
                  QUICK_FIXES.map((fix) => (
                    <button key={fix.label} type="button" onClick={() => ask(fix.instruction)} disabled={busy} className="btn-soft">
                      {fix.label}
                    </button>
                  ))
                )}
              </div>
              {!canDraft && !instruction.trim() && (
                <p className="mt-2 text-sm text-muted">Tell AI what you want below, or type a few words in the box above.</p>
              )}

              <div className="mt-3 flex items-center gap-2">
                <input
                  type="text"
                  value={instruction}
                  onChange={(e) => setInstruction(e.target.value)}
                  onKeyDown={handleInstructionKey}
                  placeholder={isEmpty ? 'Or tell AI what to include…' : 'Or tell AI what to change, e.g. “mention we deliver”'}
                  aria-label="Tell AI what to change"
                  className="field py-2 text-sm"
                  disabled={busy}
                />
                <MicButton speech={instructionSpeech} label="Speak your request" />
                <button
                  type="button"
                  onClick={() => ask(instruction)}
                  disabled={busy || !instruction.trim()}
                  aria-label="Send request to AI"
                  className="btn-soft"
                >
                  <Send className="h-4 w-4" aria-hidden />
                </button>
              </div>
              {instructionSpeech.listening && (
                <p className="mt-2 text-sm italic text-muted" aria-live="polite">
                  {instructionSpeech.interim ? `“${instructionSpeech.interim}…”` : 'Listening…'}
                </p>
              )}
              {instructionSpeech.error && <p className="mt-2 text-sm text-rose-deep">{instructionSpeech.error}</p>}

              {busy && (
                <p className="mt-4 inline-flex items-center gap-2 text-sm text-muted" role="status">
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Thinking up a few versions…
                </p>
              )}
              {error && (
                <p role="alert" className="mt-4 flex items-start gap-2 text-sm font-medium text-rose-deep">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /> {error}
                </p>
              )}
              {suggestions.length > 0 && (
                <ul className="mt-4 space-y-2" aria-label="AI suggestions">
                  {suggestions.map((s, i) => (
                    <li key={i}>
                      <button
                        type="button"
                        onClick={() => apply(s)}
                        className="group flex w-full items-start gap-3 rounded-2xl border border-line bg-surface p-3 text-left transition-colors hover:border-teal focus:outline-none focus-visible:ring-2 focus-visible:ring-teal"
                      >
                        <span className="flex-1">{s}</span>
                        <span className="inline-flex shrink-0 items-center gap-1 text-sm font-bold text-teal">
                          <Check className="h-4 w-4" aria-hidden /> Use this
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
