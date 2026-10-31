import confetti from 'canvas-confetti';

const COLORS = ['#E23E57', '#F2B33D', '#13797A', '#3E8E5E', '#FFF0F3'];

export function celebrate(big = false) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  confetti({ particleCount: big ? 180 : 90, spread: big ? 100 : 70, origin: { y: 0.7 }, colors: COLORS, disableForReducedMotion: true });
}
