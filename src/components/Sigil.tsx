interface Props { color: string; visible: boolean; label?: string }

/** A restrained summoning mark that overlays the creature during the reveal. */
export function Sigil({ color, visible, label }: Props) {
  return (
    <div className='sigil-overlay' style={{ opacity: visible ? 1 : 0 }} aria-hidden='true'>
      <svg viewBox='0 0 200 200' className='anim-sigil-pulse h-[88%] w-[88%]' shapeRendering='crispEdges'>
        <g className='anim-sigil-spin' style={{ transformOrigin: '100px 100px' }}>
          <circle cx='100' cy='100' r='92' fill='none' stroke={color} strokeWidth='2' />
          <circle cx='100' cy='100' r='78' fill='none' stroke={color} strokeWidth='1.5' />
        </g>
        <g className='anim-sigil-spin-rev' style={{ transformOrigin: '100px 100px' }}>
          <polygon points='100,26 164,137 36,137' fill='none' stroke={color} strokeWidth='2' />
          <polygon points='100,174 36,63 164,63' fill='none' stroke={color} strokeWidth='2' />
          <circle cx='100' cy='100' r='30' fill='none' stroke={color} strokeWidth='2' />
        </g>
      </svg>
      {label && <div className='font-pixel anim-flicker absolute bottom-[6%] text-[10px] uppercase tracking-[0.3em]' style={{ color }}>{label}</div>}
    </div>
  );
}
