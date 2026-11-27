import { useEffect, useRef, useState } from "react";
import "./JacobGingerbreadPhoto.css";

export const jacobGingerbreadPhotoSrc = "./jacob/day21-gingerbread.jpg";
export function JacobGingerbreadPhoto({ onContinue }: { onContinue: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null), picture = useRef<HTMLButtonElement>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => { const node = dialog.current!;node.showModal();return () => { if (node.open) node.close(); }; }, []);
  useEffect(() => { if (ready) picture.current?.focus({ preventScroll: true }); }, [ready]);
  return <dialog ref={dialog} className="jacob-gingerbread-photo" aria-label="装饰好的姜饼人" onCancel={event => event.preventDefault()}>
    <button ref={picture} type="button" className="jacob-gingerbread-picture" aria-label="点击姜饼图片继续剧情" disabled={!ready} onClick={onContinue}>
      <img src={jacobGingerbreadPhotoSrc} alt="盘子里装饰好的姜饼人，围着蓝色和奶油色围巾，旁边有糖霜星星，其中一个带着小口袋" onLoad={() => setReady(true)} onError={() => setReady(true)} />
    </button>
  </dialog>;
}
