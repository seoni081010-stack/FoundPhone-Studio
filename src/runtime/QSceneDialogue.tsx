import { useState, type ReactNode } from "react";
import { SceneDialogue } from "./SceneDialogue";
export function QSceneDialogue({
  storageKey,
  children,
}: {
  storageKey?: string;
  children: ReactNode;
}) {
  const [checkpoint, setCheckpoint] = useState<{
    position: number;
    accepted?: boolean;
  }>(() => {
    try {
      const saved = storageKey
        ? JSON.parse(localStorage.getItem(storageKey) ?? "null")
        : null;
      if (Number.isInteger(saved?.position) && saved.position >= 0)
        return saved;
    } catch {
      /* Storage may be unavailable. */
    }
    return { position: 0 };
  });
  return (
    <SceneDialogue
      instantNarration
      checkpoint={checkpoint}
      onCheckpoint={(next) => {
        setCheckpoint(next);
        if (storageKey) {
          try {
            localStorage.setItem(storageKey, JSON.stringify(next));
          } catch {
            /* Preserve the current session. */
          }
        }
      }}
    >
      {children}
    </SceneDialogue>
  );
}
