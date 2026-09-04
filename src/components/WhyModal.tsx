import { useEffect, useRef } from "react";
import type { MonsterGenotype } from "../generator/types";
import { MYTHOLOGIES } from "../generator/mythology";
import { MUTATION_LABELS } from "../generator/generateIdentity";

interface Props { genotype: MonsterGenotype; onClose: () => void }

export function WhyModal({ genotype: g, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey); ref.current?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  const P = MYTHOLOGIES[g.mythology.primary];
  const S = g.mythology.secondary ? MYTHOLOGIES[g.mythology.secondary] : undefined;
  const borrowed = g.anatomy.borrowed;
  const rows: [string, string][] = [
    ["Primary influence", P.label.toUpperCase()],
    ["Secondary influence", S ? `${S.label.toUpperCase()}${borrowed.length ? ` (${borrowed.join(", ")})` : ""}` : "NONE — a pure lineage"],
    ["Silhouette", `${g.anatomy.body.toUpperCase()} body · ${g.anatomy.head.toUpperCase()} head`],
    ["Anatomy", `${g.anatomy.eyes.count} ${g.anatomy.eyes.type} eye${g.anatomy.eyes.count === 1 ? "" : "s"} · ${g.anatomy.armCount} arms · ${g.anatomy.legCount} legs${g.anatomy.wings !== "none" ? " · " + g.anatomy.wings + " wings" : ""}${g.anatomy.tail !== "none" ? " · " + g.anatomy.tail + " tail" : ""}`],
    ["Mutation", g.anatomy.mutations.length ? g.anatomy.mutations.map((m) => MUTATION_LABELS[m]).join(", ") : "NONE"],
    ["Rarity", g.identity.rarity],
    ["Seed", `${g.seed.slice(0, 6)} · generation v${g.version}`],
  ];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={onClose}>
      <div ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-label="Why this monster" onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg border-2 border-neutral-700 bg-[#0b0a10] p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-pixel text-xs uppercase tracking-widest">Why this monster?</h2>
          <button className="btn-tiny" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <p className="font-mono mb-5 text-2xl leading-tight text-[#ffe14d]">{g.identity.tendency}</p>
        <dl className="font-mono space-y-3 text-xl">
          {rows.map(([k, v]) => (
            <div key={k} className="grid grid-cols-[9rem_1fr] gap-3 border-b border-neutral-800 pb-2">
              <dt className="uppercase tracking-widest text-neutral-500">{k}</dt>
              <dd className="text-neutral-100">{v}</dd>
            </div>
          ))}
        </dl>
        <p className="font-mono mt-5 text-lg text-neutral-500">The same name always summons the same creature. Capitalisation and punctuation are ignored; spaces matter. Nothing is uploaded.</p>
      </div>
    </div>
  );
}
