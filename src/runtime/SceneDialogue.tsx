import { Children, Fragment, cloneElement, isValidElement, useEffect, useRef, useState, type MouseEvent, type ReactElement, type ReactNode } from "react";
import "./SceneDialogue.css";

type NodeProps = { children?: ReactNode; className?: string };
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
  function visit(nodes: ReactNode) {
    Children.forEach(nodes, child => {
      if (!isValidElement<NodeProps>(child)) return;
      const classes = child.props.className?.split(/\s+/) ?? [];
      if (classes.includes("hogwarts-message")) {
        const body = Children.toArray(child.props.children).find(node =>
          isValidElement<NodeProps>(node) && node.type === "div");
        const paragraph = isValidElement<NodeProps>(body)
          ? Children.toArray(body.props.children).find(node => isValidElement(node) && node.type === "p") : null;
        steps.push({ node: child, speech: true, outgoing: classes.includes("outgoing"), text: plainText(paragraph) });
      } else if (classes.includes("hogwarts-narration") && !(child.props as { role?: string }).role) {
        steps.push({ node: child, speech: false, outgoing: false, text: plainText(child.props.children) });
      } else if (child.type === Fragment || (child.type === "div" && !child.props.className)) {
        visit(child.props.children);
      } else {
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

function DialogueStep({ step, advance, selectedReply }: { step: Step; advance: () => void; selectedReply: string }) {
  const [accepted, setAccepted] = useState(!step.outgoing || step.text === selectedReply);
  const [visible, setVisible] = useState(0);
  const current = useRef<HTMLDivElement>(null);
  const letters = Array.from(step.text);
  const complete = !step.speech || visible >= letters.length;
  useEffect(() => {
    current.current?.scrollIntoView({ block: "nearest" });
  }, [accepted]);
  useEffect(() => {
    if (!step.speech || !accepted || complete) return;
    const timer = window.setInterval(() => setVisible(count => Math.min(count + 1, letters.length)), 28);
    return () => window.clearInterval(timer);
  }, [accepted, complete, letters.length, step.speech]);

  if (!accepted) return <div ref={current} className="hogwarts-device-choices scene-fixed-reply">
    <button type="button" onClick={() => setAccepted(true)}>{step.text}</button>
  </div>;

  return <div ref={current} className="scene-current-step">
    <div aria-live={complete ? "polite" : "off"} aria-atomic="true">
      {step.speech ? speechBody(step.node, letters.slice(0, visible).join("")) : step.node}
    </div>
    <button className="scene-advance" type="button" onClick={() => complete ? advance() : setVisible(letters.length)}>
      {complete ? "继续" : "显示完整台词"}
    </button>
  </div>;
}

export function SceneDialogue({ children }: { children: ReactNode }) {
  const { steps, controls } = sceneParts(children);
  const [position, setPosition] = useState(0);
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
    {active ? <DialogueStep key={`${position}-${active.text}`} step={active} selectedReply={selectedReply} advance={() => setPosition(index => index + 1)} /> : choiceHandlers(controls)}
  </div>;
}
