import {
  Children,
  cloneElement,
  isValidElement,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import {
  showJacobChristmasLetter,
  type ChristmasLetterContent,
} from "./JacobChristmasLetter";
export const qChristmasLetterAnchor = "你们坐在桌边，各自拆开信封。";
export const qChristmasLetterReturn =
  "读完贺卡，你抬起头，发现池昌民也刚刚看完。";
export const qChristmasLetterText = [
  "圣诞快乐！",
  "希望你每天都能遇到一些有趣的事情，吃到喜欢吃的东西，晚上也能做个好梦！",
  "新的一年，希望你的魔药课作业都能少一点，希望霍格沃茨的楼梯不要再让我们迟到了！假期快乐，要开开心心地度过剩下的冬天哦！",
  "Q",
] as const;
const content: ChristmasLetterContent = {
  label: "Q的圣诞来信",
  front: "Merry Christmas from Q",
  text: qChristmasLetterText,
  reveals: [4300, 5600, 8200, 11800],
  writtenAt: 13000,
  className: "q-christmas-letter",
};
export function QChristmasLetter({
  startedAt,
  onStart,
  onContinue,
}: {
  startedAt?: number;
  onStart: (time: number) => void;
  onContinue: () => void;
}) {
  const callbacks = useRef({ onStart, onContinue }),
    initial = useRef(startedAt);
  useEffect(() => {
    callbacks.current = { onStart, onContinue };
  }, [onStart, onContinue]);
  useEffect(
    () =>
      showJacobChristmasLetter(
        initial.current,
        (time) => callbacks.current.onStart(time),
        () => callbacks.current.onContinue(),
        content,
      ),
    [],
  );
  return null;
}
// Replace only this letter's old narration. A segment boundary keeps the return
// paragraph behind the modal instead of merging it into the opening narration.
export function qLetterOnlyInPopup(children: ReactNode): ReactNode {
  let inside = false;
  const visit = (nodes: ReactNode): ReactNode =>
    Children.map(nodes, (node) => {
      if (!isValidElement<{ children?: ReactNode; className?: string }>(node))
        return node;
      if (node.props.className?.split(/\s+/).includes("hogwarts-narration")) {
        const text = String(node.props.children ?? "");
        if (text === qChristmasLetterAnchor) {
          inside = true;
          return node;
        }
        if (inside && text === qChristmasLetterReturn) {
          inside = false;
          return <div data-scene-segment="q-letter-return">{node}</div>;
        }
        if (inside) return null;
      }
      return node.props.children
        ? cloneElement(node, {}, visit(node.props.children))
        : node;
    });
  return visit(children);
}
