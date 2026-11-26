import { useEffect, useRef } from "react";
import "./LibraryPaperNote.css";

/** Start an isolated paper animation; the returned function cancels it safely. */
export function showLibraryPaperNote(onComplete: () => void): () => void {
  const dialog = document.createElement("dialog");
  dialog.className = "library-paper-note";
  dialog.setAttribute("aria-label", "图书馆的悄悄话纸条");
  const sheet = document.createElement("div");
  sheet.className = "library-paper-note-sheet";
  sheet.tabIndex = 0;
  sheet.setAttribute("role", "button");
  sheet.setAttribute("aria-label", "纸条写完后，点击任意位置继续剧情");
  sheet.setAttribute("aria-disabled", "true");
  const first = document.createElement("p");
  first.className = "library-paper-note-first";
  const second = document.createElement("p");
  second.className = "library-paper-note-second";
  first.setAttribute("aria-live", "off");
  second.setAttribute("aria-live", "off");
  sheet.append(first, second);
  dialog.append(sheet);
  document.body.append(dialog);
  let disposed = false;
  let ready = false;
  let timer: number | undefined;
  const later = (action: () => void, delay: number) => {
    timer = window.setTimeout(() => { if (!disposed) action(); }, delay);
  };
  const write = (target: HTMLElement, words: string, done: () => void) => {
    const letters = Array.from(words);
    let index = 0;
    const tick = () => {
      const ink = document.createElement("span");
      ink.textContent = letters[index++];
      target.append(ink);
      if (index < letters.length) later(tick, 110);
      else later(done, 240); // Let the final ink stroke finish fading in.
    };
    tick();
  };
  const dispose = () => {
    disposed = true;
    window.clearTimeout(timer);
    if (dialog.open) dialog.close();
    dialog.remove();
  };
  const complete = () => { if (ready && !disposed) { dispose(); onComplete(); } };
  dialog.addEventListener("cancel", event => event.preventDefault());
  dialog.addEventListener("click", complete);
  sheet.addEventListener("keydown", event => {
    if (event.key === "Enter" || event.key === " ") { event.preventDefault(); complete(); }
  });
  dialog.showModal();
  sheet.focus({ preventScroll: true });
  const startWriting = () => later(() => write(first, "刚才是你先笑的", () => later(() => write(second, "明明是你先给我看的", () => {
    ready = true;
    dialog.dataset.ready = "true";
    sheet.setAttribute("aria-disabled", "false");
  }), 800)), 1100);
  // Load the real handwriting before showing the ink, avoiding a fallback-font flash.
  void Promise.all([
    document.fonts.load('29px "Library Playful"', "刚才是你先笑的"),
    document.fonts.load('29px "Library Neat"', "明明是你先给我看的"),
  ]).then(() => { if (!disposed) startWriting(); }).catch(() => { if (!disposed) startWriting(); });
  return dispose;
}

export function LibraryPaperNote({ onComplete }: { onComplete: () => void }) {
  const complete = useRef(onComplete);
  useEffect(() => { complete.current = onComplete; }, [onComplete]);
  useEffect(() => showLibraryPaperNote(() => complete.current()), []);
  return null;
}
