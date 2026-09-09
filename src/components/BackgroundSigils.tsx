import { useEffect, useState } from 'react';

// Every appearance builds a new glyph from a distinct skeleton and small marks.
const skeletons = [
  'M30 7V53M15 16L30 27L46 13M17 43L30 34L43 46',
  'M12 42Q4 16 28 11Q53 7 48 33Q42 51 23 45M29 18V36',
  'M8 31L30 9L52 31L30 51ZM19 31H41M30 21V42',
  'M15 9V45L43 17V53M9 26H50',
  'M10 16Q30 42 50 16M30 26V53M21 46L30 53L39 46',
  'M10 45L30 10L50 45M21 29H39M19 52H41',
  'M13 12L46 46M46 12L13 46M7 29H52M29 7V53',
  'M17 8Q49 15 39 32Q11 30 17 51M8 37L49 21',
  'M9 20H43L22 43H51M30 8V53',
  'M12 12V47H47V12M21 18V37H37V18',
  'M30 8L17 20L30 32L43 20ZM30 32L17 44L30 54L43 44Z',
  'M13 9L38 24L16 36L44 51M43 10L22 24L46 36L17 51',
];
const createMark = (id: number) => {
  const r=Math.random, base=Math.floor(r()*skeletons.length);
  const adornment=r()<.45?'M9 7H4V15M49 53H56V45':r()<.5?'M5 30h4M51 30h4M30 2v4M30 55v3':'';
  return { id, x: r()<.5?2+r()*22:76+r()*21, y: 4+r()*86, size: 32+r()*52, duration: 7+r()*13, delay:r()*4, angle:(r()-.5)*65, path:skeletons[base], adornment, ring:r()<.3, dots:Math.floor(r()*4) };
};
export function BackgroundSigils() {
  const [sigils,setSigils]=useState(()=>Array.from({length:14},(_,i)=>createMark(i)));
  const [paused,setPaused]=useState(false);
  useEffect(()=>{ const update=()=>setPaused(document.hidden);update();document.addEventListener('visibilitychange',update);return()=>document.removeEventListener('visibilitychange',update); },[]);
  return <div className="background-sigils" aria-hidden="true">{sigils.map(s=><svg key={s.id} className="background-sigil" viewBox="0 0 60 60"
    style={{left:`${s.x}%`,top:`${s.y}%`,width:s.size,height:s.size,animationDuration:`${s.duration}s`,animationDelay:`${s.delay}s`,animationPlayState:paused?'paused':'running'}}
    onAnimationEnd={()=>setSigils(current=>current.map(item=>item.id===s.id?createMark(s.id+14):item))}>
    <g transform={`rotate(${s.angle} 30 30)`} fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="square">
      {s.ring&&<path d="M7 18A26 26 0 0 1 49 12M54 38A26 26 0 0 1 13 51" strokeWidth=".55"/>}
      <path d={s.path}/><path d={s.adornment} strokeWidth=".7"/>
      {Array.from({length:s.dots},(_,i)=><circle key={i} cx={22+i*7} cy="58" r=".75" fill="currentColor"/>)}
    </g>
  </svg>)}</div>;
}
