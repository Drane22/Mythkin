const SIGILS = [
  { glyph: '◇', x: '7%', y: '16%', size: 72, delay: '-8s', duration: '26s' },
  { glyph: '⌁', x: '22%', y: '72%', size: 46, delay: '-17s', duration: '31s' },
  { glyph: '⟐', x: '38%', y: '9%', size: 38, delay: '-4s', duration: '24s' },
  { glyph: '⊹', x: '54%', y: '78%', size: 60, delay: '-21s', duration: '34s' },
  { glyph: '☾', x: '72%', y: '13%', size: 52, delay: '-12s', duration: '29s' },
  { glyph: 'ᛉ', x: '88%', y: '62%', size: 66, delay: '-6s', duration: '32s' },
  { glyph: 'ᚱ', x: '93%', y: '24%', size: 32, delay: '-24s', duration: '28s' },
  { glyph: 'ᛟ', x: '13%', y: '88%', size: 34, delay: '-14s', duration: '27s' },
] as const;

export function BackgroundSigils() {
  return (
    <div className="background-sigils" aria-hidden="true">
      {SIGILS.map((sigil, index) => (
        <span
          key={`${sigil.glyph}-${index}`}
          className="background-sigil"
          style={{
            left: sigil.x,
            top: sigil.y,
            fontSize: sigil.size,
            animationDelay: sigil.delay,
            animationDuration: sigil.duration,
          }}
        >
          {sigil.glyph}
        </span>
      ))}
    </div>
  );
}
