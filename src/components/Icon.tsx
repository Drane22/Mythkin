export type IconName = "arrow-up-right" | "share" | "link" | "image" | "download" | "close" | "refresh" | "spark" | "shield";

interface Props {
  name: IconName;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

/** Small, deliberately light-line icons that keep the archive UI quiet. */
export function Icon({ name, size = 18, strokeWidth = 1.35, className }: Props) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width={size} height={size} className={className} {...common}>
      {name === "arrow-up-right" && <><path d="M5 19 19 5" /><path d="M9 5h10v10" /></>}
      {name === "share" && <><circle cx="18" cy="5" r="2.25" /><circle cx="6" cy="12" r="2.25" /><circle cx="18" cy="19" r="2.25" /><path d="m8 11 7.7-4.5M8 13l7.7 4.5" /></>}
      {name === "link" && <><path d="M9.5 14.5 14.5 9.5" /><path d="M7.1 17.9H6a4 4 0 0 1 0-8h3" /><path d="M16.9 6.1H18a4 4 0 0 1 0 8h-3" /></>}
      {name === "image" && <><rect x="3.5" y="4" width="17" height="16" rx="2" /><circle cx="9" cy="9" r="1.4" /><path d="m5.5 17 4.2-4.2 2.7 2.5 2.2-2.1 3.9 3.8" /></>}
      {name === "download" && <><path d="M12 3v12" /><path d="m7.5 10.5 4.5 4.5 4.5-4.5" /><path d="M4 20h16" /></>}
      {name === "close" && <><path d="m6 6 12 12M18 6 6 18" /></>}
      {name === "refresh" && <><path d="M20 11a8 8 0 0 0-14.9-3L3 11" /><path d="M3 5v6h6" /><path d="M4 13a8 8 0 0 0 14.9 3L21 13" /><path d="M21 19v-6h-6" /></>}
      {name === "spark" && <><path d="m12 2 1.5 6.5L20 10l-6.5 1.5L12 18l-1.5-6.5L4 10l6.5-1.5L12 2Z" /><path d="m19 16 .6 2.4L22 19l-2.4.6L19 22l-.6-2.4L16 19l2.4-.6L19 16Z" /></>}
      {name === "shield" && <path d="M12 3 19 6v5.1c0 4.2-2.9 7.9-7 9.9-4.1-2-7-5.7-7-9.9V6l7-3Z" />}
    </svg>
  );
}
