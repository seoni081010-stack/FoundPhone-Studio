import { QGingerbreadPhoto, qGingerbreadAnchor } from "./QGingerbreadPhoto";
import { useState, type ReactNode } from "react";
import { SceneDialogue, sceneParts } from "./SceneDialogue";
import {
  QMatchChecklist,
  qChecklistAnchors,
  type QChecklistChoice,
} from "./QMatchChecklist";
type Cursor = { position: number; accepted?: boolean };
type QCheckpoint = Cursor & {
  checklistSeen?: boolean;
  pendingChecklist?: Cursor;
  photoSeen?: boolean;
  pendingPhoto?: Cursor;
};
export function QSceneDialogue({
  storageKey,
  children,
  checklistChoice,
  gingerbreadPhoto,
}: {
  storageKey?: string;
  children: ReactNode;
  checklistChoice?: QChecklistChoice;
  gingerbreadPhoto?: boolean;
}) {
  const [checkpoint, setCheckpoint] = useState<QCheckpoint>(() => {
    try {
      const saved = storageKey
        ? JSON.parse(localStorage.getItem(storageKey) ?? "null")
        : null;
      if (Number.isInteger(saved?.position) && saved.position >= 0)
        return saved;
    } catch {
      /* Preserve access when browser storage is unavailable. */
    }
    return { position: 0 };
  });
  const store = (next: QCheckpoint) => {
    setCheckpoint(next);
    if (storageKey) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        /* Preserve the current session. */
      }
    }
  };
  const anchor = checklistChoice
    ? sceneParts(children).steps.findIndex(
        (step) =>
          step.speech &&
          !step.outgoing &&
          step.text === qChecklistAnchors[checklistChoice],
      )
    : -1;
  const photoAnchor = gingerbreadPhoto
    ? sceneParts(children).steps.findIndex(
        (step) =>
          step.speech && !step.outgoing && step.text === qGingerbreadAnchor,
      )
    : -1;
  return (
    <>
      <SceneDialogue
        instantNarration
        checkpoint={checkpoint}
        onCheckpoint={(next) => {
          if (
            checklistChoice &&
            !checkpoint.checklistSeen &&
            anchor >= 0 &&
            checkpoint.position === anchor &&
            next.position > anchor
          ) {
            store({ ...checkpoint, pendingChecklist: next });
          } else if (
            gingerbreadPhoto &&
            !checkpoint.photoSeen &&
            photoAnchor >= 0 &&
            checkpoint.position === photoAnchor &&
            next.position > photoAnchor
          ) {
            store({ ...checkpoint, pendingPhoto: next });
          } else
            store({
              ...next,
              checklistSeen: checkpoint.checklistSeen,
              photoSeen: checkpoint.photoSeen,
            });
        }}
      >
        {children}
      </SceneDialogue>
      {gingerbreadPhoto && checkpoint.pendingPhoto && (
        <QGingerbreadPhoto
          onContinue={() => {
            store({
              ...checkpoint.pendingPhoto!,
              photoSeen: true,
              checklistSeen: checkpoint.checklistSeen,
            });
          }}
        />
      )}
      {checklistChoice && checkpoint.pendingChecklist && (
        <QMatchChecklist
          choice={checklistChoice}
          onComplete={() => {
            store({ ...checkpoint.pendingChecklist!, checklistSeen: true });
          }}
        />
      )}
    </>
  );
}
