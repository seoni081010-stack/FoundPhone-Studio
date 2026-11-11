import { Children, Fragment, cloneElement, isValidElement, useEffect, useRef, useState, type MouseEvent, type ReactElement, type ReactNode } from "react";
import "./SceneDialogue.css";

type NodeProps = { children?: ReactNode; className?: string; "data-scene-segment"?: string };
type Step = { node: ReactElement<NodeProps>; speech: boolean; outgoing: boolean; text: string };

function plainText(node: ReactNode): string {
  return Children.toArray(node).map(child => isValidElement<NodeProps>(child)
    ? plainText(child.props.children) : String(child)).join("");
}

// Scene wrappers and fragments are transparent. Choice groups and other controls
// remain intact so their existing handlers and layout keep working.
export function sceneParts(children: ReactNode): { steps: Step[]; controls: ReactNode[] } {
  const steps: Step[] = [];
  const controls: ReactNode[] = [];
  let narrationIndex: number | undefined;
  function visit(nodes: ReactNode) {
    Children.forEach(nodes, child => {
      if (!isValidElement<NodeProps>(child)) return;
      const classes = child.props.className?.split(/\s+/) ?? [];
      if (classes.includes("hogwarts-message")) {
        const body = Children.toArray(child.props.children).find(node =>
          isValidElement<NodeProps>(node) && node.type === "div");
        const paragraph = isValidElement<NodeProps>(body)
          ? Children.toArray(body.props.children).find(node => isValidElement(node) && node.type === "p") : null;
        narrationIndex = undefined;
        steps.push({ node: child, speech: true, outgoing: classes.includes("outgoing"), text: plainText(paragraph) });
      } else if (classes.includes("hogwarts-narration") && !(child.props as { role?: string }).role) {
        const text = plainText(child.props.children);
        if (narrationIndex !== undefined) {
          const block = steps[narrationIndex];
          block.node = cloneElement(block.node, {}, [...Children.toArray(block.node.props.children), child]);
          block.text += "\n" + text;
        } else {
          narrationIndex = steps.length;
          steps.push({ node: <div className="scene-narration-block">{child}</div>, speech: false, outgoing: false, text });
        }
      } else if (child.type === Fragment || (child.type === "div" && !child.props.className)) {
        // Runtime message segments are append-only. Never merge newly appended
        // choice results into a narration step the player has already finished.
        if (child.props["data-scene-segment"]) narrationIndex = undefined;
        visit(child.props.children);
        if (child.props["data-scene-segment"]) narrationIndex = undefined;
      } else {
        narrationIndex = undefined;
        controls.push(child);
      }
    });
  }
  visit(children);
  return { steps, controls };
}

function speechBody(node: ReactElement<NodeProps>, text: string): ReactElement<NodeProps> {
  return cloneElement(node, {}, Children.map(node.props.children, child => {
    if (!isValidElement<NodeProps>(child) || child.type !== "div") return child;
    return cloneElement(child, {}, Children.map(child.props.children, part =>
      isValidElement<NodeProps>(part) && part.type === "p" ? cloneElement(part, {}, text) : part));
  }));
}

// Reveal a whole consecutive narration block with one clock, while keeping
// paragraph breaks and inline emphasis rather than flattening it into one line.
export function narrationBody(node: ReactElement<NodeProps>, visible: number): ReactElement<NodeProps> {
  let remaining = visible;
  function reveal(children: ReactNode): ReactNode {
    return Children.map(children, child => {
      if (isValidElement<NodeProps>(child)) return cloneElement(child, {}, reveal(child.props.children));
      if (child === null || child === undefined || typeof child === "boolean") return child;
      const letters = Array.from(String(child));
      const text = letters.slice(0, Math.max(remaining, 0)).join("");
      remaining -= letters.length;
      return text;
    });
  }
  return cloneElement(node, {}, Children.toArray(node.props.children).map((paragraph, index) => {
    if (!isValidElement<NodeProps>(paragraph) || remaining <= 0) return null;
    const rendered = cloneElement(paragraph, { key: index }, reveal(paragraph.props.children));
    remaining -= 1; // The paragraph break consumes one step of the same clock.
    return rendered;
  }));
}

function DialogueStep({ step, advance, selectedReply, instantNarration, fixedAccepted, onAccept }: { step: Step; advance: () => void; selectedReply: string; instantNarration?: boolean; fixedAccepted?: boolean; onAccept?: () => void }) {
  const [accepted, setAccepted] = useState(!step.outgoing || step.text === selectedReply || fixedAccepted === true);
  const [visible, setVisible] = useState(0);
  const current = useRef<HTMLDivElement>(null);
  const letters = Array.from(step.text);
  const complete = (!step.speech && instantNarration) || visible >= letters.length;
  useEffect(() => {
    current.current?.scrollIntoView({ block: "nearest" });
  }, [accepted]);
  useEffect(() => {
    if (!accepted || complete) return;
    const timer = window.setInterval(() => setVisible(count => Math.min(count + 1, letters.length)), 28);
    return () => window.clearInterval(timer);
  }, [accepted, complete, letters.length]);

  if (!accepted) return <div ref={current} className="hogwarts-device-choices scene-fixed-reply">
    <button type="button" onClick={() => { setAccepted(true); onAccept?.(); }}>{step.text}</button>
  </div>;

  return <div ref={current} className="scene-current-step">
    <div aria-live={complete ? "polite" : "off"} aria-atomic="true">
      {step.speech ? speechBody(step.node, letters.slice(0, visible).join("")) : narrationBody(step.node, complete ? letters.length : visible)}
    </div>
    <button className="scene-advance" type="button" onClick={() => complete ? advance() : setVisible(letters.length)}>
      {complete ? "继续" : step.speech ? "显示完整台词" : "显示完整旁白"}
    </button>
  </div>;
}

export function SceneDialogue({ children, instantNarration, checkpoint, onCheckpoint, onComplete }: { children: ReactNode; instantNarration?: boolean; checkpoint?: { position: number; accepted?: boolean }; onCheckpoint?: (checkpoint: { position: number; accepted?: boolean }) => void; onComplete?: () => void }) {
  const { steps, controls } = sceneParts(children);
  const [localPosition, setPosition] = useState(0);
  const position = checkpoint?.position ?? localPosition;
  const [selectedReply, setSelectedReply] = useState("");
  const active = steps[position];
  function choiceHandlers(nodes: ReactNode): ReactNode {
    return Children.map(nodes, child => {
      if (!isValidElement<NodeProps & { onClick?: (event: MouseEvent<HTMLButtonElement>) => void }>(child)) return child;
      if (child.type === "button") return cloneElement(child, {
        onClick: event => {
          setSelectedReply(plainText(child.props.children));
          child.props.onClick?.(event);
        },
      });
      if (!child.props.children) return child;
      return cloneElement(child, {}, choiceHandlers(child.props.children));
    });
  }
  return <div className="scene-dialogue">
    {steps.slice(0, position).map((step, index) => <Fragment key={index}>{step.node}</Fragment>)}
    {active ? <DialogueStep key={`${position}-${active.text}`} step={active} selectedReply={selectedReply} instantNarration={instantNarration} fixedAccepted={checkpoint?.accepted} onAccept={() => onCheckpoint?.({ position, accepted: true })} advance={() => { if (onComplete && position + 1 === steps.length) { onComplete(); return; } setPosition(position + 1); onCheckpoint?.({ position: position + 1 }); }} /> : choiceHandlers(controls)}
  </div>;
}
