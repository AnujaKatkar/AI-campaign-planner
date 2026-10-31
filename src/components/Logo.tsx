import { Sparkles } from 'lucide-react';

type LogoProps = {
  size?: 'sm' | 'lg';
};

export default function Logo({ size = 'sm' }: LogoProps) {
  const large = size === 'lg';
  return (
    <span className={`neon-plate ${large ? 'px-6 py-2' : ''}`}>
      <Sparkles aria-hidden className={`text-honey ${large ? 'h-6 w-6' : 'h-4 w-4'}`} />
      <span className={`neon-text neon-flicker font-script leading-none ${large ? 'text-6xl' : 'text-2xl'}`}>
        Flaunt
      </span>
    </span>
  );
}
