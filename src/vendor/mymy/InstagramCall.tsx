import { useEffect, useRef, useState } from "react";
import type { FormEvent, PointerEvent } from "react";
import {
  Camera,
  CameraOff,
  Mic,
  MicOff,
  Phone,
  Video,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import type { SkinProps } from "../../AppSkins";
import { Avatar } from "../../skins/shared";
import { safeMedia, type Item } from "../../schema";
import "./experience.css";

type Bubble = { id: string; text: string; from: string };

function clock(seconds: number) {
  return String(Math.floor(seconds / 60)).padStart(2, "0") + ":" +
    String(seconds % 60).padStart(2, "0");
}

export function InstagramCall({
  p,
  caller,
}: {
  p: SkinProps;
  caller: Item;
}) {
  const [status, setStatus] = useState<"incoming" | "connected">("incoming");
  const [elapsed, setElapsed] = useState(0);
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [speakerOff, setSpeakerOff] = useState(false);
  const [draft, setDraft] = useState("");
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [pip, setPip] = useState({ x: 0, y: 0 });
  const stage = useRef<HTMLDivElement>(null);
  const callerName = caller.meta.callerName || caller.sender || "Instagram";
  const avatar = caller.avatar || "";
  const video = safeMedia(caller.media);
  const secondary = p.items.find((i) => i.folder === "通话小窗");
  const secondaryVideo = secondary ? safeMedia(secondary.media) : "";
  const scheduled = p.items.filter((i) => i.folder === "通话消息");

  useEffect(() => {
    if (status !== "connected") return;
    const timer = window.setInterval(() => setElapsed((n) => n + 1), 1000);
    return () => window.clearInterval(timer);
  }, [status]);

  useEffect(() => {
    if (status !== "connected") return;
    const timers: number[] = [];
    scheduled.forEach((message, index) => {
      const delay = Number(message.meta.delayMs || (index + 1) * 2600);
      const show = window.setTimeout(() => {
        const id = message.id;
        setBubbles((items) => [...items, {
          id,
          text: message.body,
          from: message.sender || callerName,
        }]);
        const fade = window.setTimeout(() => {
          setBubbles((items) => items.filter((item) => item.id !== id));
        }, 5200);
        timers.push(fade);
      }, Math.max(0, delay));
      timers.push(show);
    });
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [status, p.items, callerName]);

  const send = (event: FormEvent) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setBubbles((items) => [...items, {
      id: "local-" + Date.now(),
      text,
      from: p.owner || "나",
    }]);
    setDraft("");
  };

  const movePip = (event: PointerEvent<HTMLDivElement>) => {
    if (!stage.current) return;
    const bounds = stage.current.getBoundingClientRect();
    setPip({
      x: Math.max(8, Math.min(bounds.width - 124, event.clientX - bounds.left - 54)),
      y: Math.max(64, Math.min(bounds.height - 190, event.clientY - bounds.top - 70)),
    });
  };

  if (status === "incoming") {
    return (
      <section className="ig-call incoming">
        <div className="ig-call-top"><span>Instagram</span><span>비디오 통화</span></div>
        <div className="ig-caller">
          <Avatar name={callerName} src={avatar} />
          <h1>{callerName}</h1>
          <p>Instagram 영상 통화</p>
          <span className="ig-ringing">전화가 오고 있습니다…</span>
        </div>
        <div className="ig-call-actions">
          <button className="ig-decline" aria-label="전화 거절" onClick={p.onBack}>
            <Phone />
            <small>거절</small>
          </button>
          <button className="ig-accept" aria-label="전화 받기" onClick={() => setStatus("connected")}>
            <Phone />
            <small>수락</small>
          </button>
        </div>
        <button className="ig-call-close" aria-label="닫기" onClick={p.onBack}><X /></button>
      </section>
    );
  }

  return (
    <section className="ig-call connected" ref={stage}>
      <div className="ig-call-video">
        {video ? <video src={video} autoPlay muted loop playsInline /> : <div className="ig-video-placeholder"><Avatar name={callerName} src={avatar} /></div>}
      </div>
      <header className="ig-call-header">
        <strong>{callerName}</strong>
        <span>{clock(elapsed)}</span>
      </header>
      {secondaryVideo && !cameraOff && (
        <div
          className="ig-call-pip"
          style={{ left: pip.x || undefined, top: pip.y || undefined }}
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture(event.pointerId);
            movePip(event);
          }}
          onPointerMove={(event) => {
            if (event.currentTarget.hasPointerCapture(event.pointerId)) movePip(event);
          }}
        >
          <video src={secondaryVideo} autoPlay muted loop playsInline />
        </div>
      )}
      <div className="ig-call-chat" aria-live="polite">
        {bubbles.map((bubble) => (
          <div className={"ig-call-bubble " + (bubble.from === (p.owner || "나") ? "mine" : "")} key={bubble.id}>
            <b>{bubble.from}</b><span>{bubble.text}</span>
          </div>
        ))}
      </div>
      <form className="ig-call-compose" onSubmit={send}>
        <input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="메시지 보내기…" aria-label="통화 메시지" maxLength={500} />
        <button disabled={!draft.trim()}>보내기</button>
      </form>
      <div className="ig-call-controls">
        <button aria-label={muted ? "마이크 켜기" : "마이크 끄기"} onClick={() => setMuted(!muted)}>{muted ? <MicOff /> : <Mic />}<small>마이크</small></button>
        <button aria-label={cameraOff ? "카메라 켜기" : "카메라 끄기"} onClick={() => setCameraOff(!cameraOff)}>{cameraOff ? <CameraOff /> : <Camera />}<small>카메라</small></button>
        <button aria-label={speakerOff ? "스피커 켜기" : "스피커 끄기"} aria-pressed={speakerOff} onClick={() => setSpeakerOff(!speakerOff)}>{speakerOff ? <VolumeX /> : <Volume2 />}<small>스피커</small></button>
        <button className="ig-hangup" aria-label="통화 종료" onClick={p.onBack}><Phone /><small>종료</small></button>
      </div>
      <span className="ig-call-video-label"><Video size={14} /> Instagram 영상 통화</span>
    </section>
  );
}
