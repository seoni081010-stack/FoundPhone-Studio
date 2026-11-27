import { useEffect, useRef, useState } from "react";
import "./JacobGingerbreadPhoto.css";
export const qGingerbreadAnchor = "那圣诞节的时候再做一次吧。";
export const qGingerbreadPhotoSrc = "./q/day20-gingerbread.jpg";
export function QGingerbreadPhoto({ onContinue }: { onContinue: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const picture = useRef<HTMLButtonElement>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const node = dialog.current!;
    node.showModal();
    return () => {
      if (node.open) node.close();
    };
  }, []);
  useEffect(() => {
    if (ready) picture.current?.focus({ preventScroll: true });
  }, [ready]);
  return (
    <dialog
      ref={dialog}
      className="jacob-gingerbread-photo q-gingerbread-photo"
      aria-label="池昌民和你做好的姜饼人"
      onCancel={(event) => event.preventDefault()}
    >
      <button
        ref={picture}
        type="button"
        className="jacob-gingerbread-picture"
        aria-label="点击姜饼图片任意位置继续剧情"
        disabled={!ready}
        onClick={onContinue}
      >
        <img
          src={qGingerbreadPhotoSrc}
          alt="盘中两只姜饼人，一只围着蓝色围巾、闭着眼睛并带有星星小口袋，另一只围着奶黄色围巾、笑着，身上画着糖霜条纹"
          onLoad={() => setReady(true)}
          onError={() => setReady(true)}
        />
      </button>
    </dialog>
  );
}
