import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { AlertCircle, Check } from 'lucide-react';

type Tone = 'ok' | 'error';
type ToastState = { id: number; message: string; tone: Tone } | null;

const ToastContext = createContext<(message: string, tone?: Tone) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState>(null);
  const timer = useRef<number>();

  const show = useCallback((message: string, tone: Tone = 'ok') => {
    window.clearTimeout(timer.current);
    setToast({ id: Date.now(), message, tone });
    timer.current = window.setTimeout(() => setToast(null), tone === 'error' ? 6000 : 2400);
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-5 z-[60] flex justify-center px-4" aria-live="polite">
        {toast && (
          <p
            key={toast.id}
            role={toast.tone === 'error' ? 'alert' : 'status'}
            className={`rise pointer-events-auto flex max-w-md items-start gap-2 rounded-full px-5 py-2.5 text-sm font-bold shadow-lift ${
              toast.tone === 'error' ? 'bg-rose text-on-rose' : 'bg-ink text-cream'
            }`}
          >
            {toast.tone === 'error' ? (
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            ) : (
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-honey" aria-hidden />
            )}
            {toast.message}
          </p>
        )}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
