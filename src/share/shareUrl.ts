import { GENERATION_VERSION } from "../generator/types";
import { normalizeInput, seedHex } from "../generator/rng";

// URL shape:  ?v=1&s=<SEEDHEX>&n=<base64url(normalized name)>
// The seed identifies the creature; the name is carried so the card can show the input text
// and so the generator can rebuild it without any database.

function b64url(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function fromB64url(s: string): string {
  const b = s.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (s.length % 4)) % 4);
  const bin = atob(b);
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function buildShareUrl(rawName: string): string {
  const n = normalizeInput(rawName) || "nameless";
  const url = new URL(window.location.href);
  url.search = "";
  url.hash = "";
  url.searchParams.set("v", String(GENERATION_VERSION));
  url.searchParams.set("s", seedHex(n).slice(0, 8));
  url.searchParams.set("n", b64url(n));
  return url.toString();
}

export interface SharedRef { version: number; name: string; seed: string }

export function parseShareUrl(): SharedRef | null {
  try {
    const p = new URLSearchParams(window.location.search);
    const n = p.get("n");
    const s = p.get("s");
    if (!n || !s) return null;
    const version = Number(p.get("v") ?? GENERATION_VERSION);
    const name = normalizeInput(fromB64url(n));
    if (!name) return null;
    return { version, name, seed: s };
  } catch {
    return null;
  }
}

export function clearShareUrl() {
  const url = new URL(window.location.href);
  url.search = "";
  window.history.replaceState({}, "", url.toString());
}

export function pushShareUrl(rawName: string) {
  window.history.replaceState({}, "", buildShareUrl(rawName));
}
