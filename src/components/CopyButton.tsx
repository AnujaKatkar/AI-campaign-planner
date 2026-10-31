import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

type CopyButtonProps = {
  text: string;
  label?: string;
  className?: string;
};

export default function CopyButton({ text, label = 'Copy', className = 'btn-soft' }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      window.prompt('Copy this text:', text);
    }
  }

  return (
    <button type="button" onClick={handleCopy} className={className} aria-label={label === 'Copy' ? `Copy: ${text.slice(0, 40)}` : label}>
      {copied ? <Check className="h-4 w-4 text-sage" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
      <span>{copied ? 'Copied' : label}</span>
    </button>
  );
}
