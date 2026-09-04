export async function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/png"));
}

export function downloadCanvas(canvas: HTMLCanvasElement, filename: string) {
  const a = document.createElement("a");
  a.download = filename;
  a.href = canvas.toDataURL("image/png");
  a.click();
}

export async function copyCanvasToClipboard(canvas: HTMLCanvasElement): Promise<boolean> {
  try {
    if (!navigator.clipboard || typeof ClipboardItem === "undefined") return false;
    const blob = await canvasToBlob(canvas);
    await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
    return true;
  } catch {
    return false;
  }
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select(); document.execCommand("copy"); ta.remove();
      return true;
    } catch { return false; }
  }
}

export function canNativeShare(): boolean {
  return typeof navigator !== "undefined" && typeof navigator.share === "function";
}

/** Returns true if a native share happened; false if the caller should fall back. */
export async function nativeShare(opts: { title: string; text: string; url: string; canvas?: HTMLCanvasElement; filename?: string }): Promise<boolean> {
  if (!canNativeShare()) return false;
  try {
    if (opts.canvas) {
      const blob = await canvasToBlob(opts.canvas);
      const file = new File([blob], opts.filename ?? "monster.png", { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ title: opts.title, text: opts.text, url: opts.url, files: [file] });
        return true;
      }
    }
    await navigator.share({ title: opts.title, text: opts.text, url: opts.url });
    return true;
  } catch (e) {
    // user cancelled or unsupported
    return (e as Error)?.name === "AbortError";
  }
}
