import { useEffect, useState } from 'react';
const marks = ['M12 3V29M4 10L12 17L20 10M5 24L12 19L19 24', 'M12 3L22 16L12 29L2 16ZM12 9V23M7 16H17', 'M5 5L19 27M19 5L5 27M3 16H21', 'M12 2V30M3 8L12 13L21 8M3 24L12 19L21 24'];
const createMark = (id: number) => ({ id, x: 3 + Math.random() * 91, y: 5 + Math.random() * 87, size: 24 + Math.random() * 38, duration: 5 + Math.random() * 9, delay: Math.random() * 5, mark: Math.floor(Math.random() * marks.length) });
export function BackgroundSigils() {
  const [sigils, setSigils] = useState(() => Array.from({ length: 12 }, (_, i) => createMark(i)));
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    const update = () => setPaused(document.hidden);
    document.addEventListener('visibilitychange', update);
    return () => document.removeEventListener('visibilitychange', update);
  }, []);
  return <div className="background-sigils" aria-hidden="true">
    {sigils.map(s => <svg key={s.id} className="background-sigil" viewBox="0 0 24 32"
      style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.size, height: s.size * 1.33, animationDuration: `${s.duration}s`, animationDelay: `${s.delay}s`, animationPlayState: paused ? 'paused' : 'running' }}
      onAnimationEnd={() => setSigils(current => current.map(item => item.id === s.id ? createMark(s.id + 12) : item))}>
      <path d={marks[s.mark]} fill="none" stroke="currentColor" strokeWidth="1" />
    </svg>)}
  </div>;
}
