interface Props { color: string; visible: boolean; label?: string }

/** Pixel-ish summoning sigil drawn with SVG; overlays the creature during the reveal. */
export function Sigil({ color, visible, label }: Props) {
  return (
    <div className={`pointer-events-none absolute inset-0 flex items-center justify-center transition-opacity duration-500 ${visible ? "opacity-100" : "opacity-0"}`} aria-hidden>
      <svg viewBox="0 0 200 200" className="anim-sigil-pulse h-[88%] w-[88%]" shapeRendering="crispEdges">
        <g className="anim-sigil-spin" style={{ transformOrigin: "100px 100px" }}>
          <circle cx="100" cy="100" r="92" fill="none" stroke={color} strokeWidth="3" strokeDasharray="6 4" />
          <circle cx="100" cy="100" r="78" fill="none" stroke={color} strokeWidth="1.5" />
          {Array.from({ length: 12 }).map((_, i) => {
            const a = (i / 12) * Math.PI * 2; const x = 100 + Math.cos(a) * 85, y = 100 + Math.sin(a) * 85;
            return <rect key={i} x={x - 3} y={y - 3} width="6" height="6" fill={color} />;
          })}
        </g>
        <g className="anim-sigil-spin-rev" style={{ transformOrigin: "100px 100px" }}>
          <polygon points="100,26 164,137 36,137" fill="none" stroke={color} strokeWidth="2" />
          <polygon points="100,174 36,63 164,63" fill="none" stroke={color} strokeWidth="2" />
          <circle cx="100" cy="100" r="30" fill="none" stroke={color} strokeWidth="2" strokeDasharray="3 3" />
        </g>
      </svg>
      {label && <div className="font-pixel anim-flicker absolute bottom-[6%] text-[10px] uppercase tracking-[0.3em]" style={{ color }}>{label}</div>}
    </div>
  );
}
