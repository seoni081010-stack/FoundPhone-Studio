import { useEffect, useRef, useState } from "react";
import { Music, Play, SkipBack, SkipForward } from "lucide-react";
import { safeMedia, type Item } from "../schema";
import { meta, type Props } from "./shared";

export function SpotifyPlayer({ item, p, onNext, onPrevious }: {
  item: Item; p: Props; onNext: () => void; onPrevious: () => void;
}) {
  const audio = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(Number(meta(item, "durationSeconds")) || 0);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState(false);
  const src = item.kind === "audio" ? safeMedia(item.media) : "";
  const cover = safeMedia(meta(item, "cover"));

  useEffect(() => {
    setCurrent(0);
    setDuration(Number(meta(item, "durationSeconds")) || 0);
    setPlaying(true);
    if (!src || !audio.current) return;
    const node = audio.current;
    const start = () => { void node.play().catch(() => setPlaying(false)); };
    node.addEventListener("canplay", start, { once: true });
    return () => node.removeEventListener("canplay", start);
  }, [item.id, src]);

  useEffect(() => {
    if (src || !playing || duration <= 0) return;
    const timer = window.setInterval(() => {
      setCurrent((value) => {
        if (value + 1 >= duration) {
          if (repeat) return 0;
          onNext();
          return 0;
        }
        return value + 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [src, playing, duration, repeat, onNext]);

  const toggle = () => {
    const node = audio.current;
    if (src && node) {
      if (node.paused) void node.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
      else { node.pause(); setPlaying(false); }
    } else setPlaying((value) => !value);
  };
  const seek = (value: number) => {
    setCurrent(value);
    if (audio.current && src) audio.current.currentTime = value;
  };
  const format = (value: number) => {
    const n = Math.floor(Math.max(0, value));
    return Math.floor(n / 60) + ":" + String(n % 60).padStart(2, "0");
  };
  const progress = duration > 0 ? Math.min(100, current / duration * 100) : 0;

  return <>
    {src && <audio ref={audio} src={src}
      onTimeUpdate={(event) => setCurrent(event.currentTarget.currentTime)}
      onLoadedMetadata={(event) => setDuration(event.currentTarget.duration || 0)}
      onEnded={() => repeat ? seek(0) : onNext()} />}
    <div className="spotify-mini-player">
      <button className="spotify-mini-cover" onClick={() => setExpanded(true)}>
        {cover ? <img src={cover} alt="" /> : <Music />}
      </button>
      <button className="spotify-mini-info" onClick={() => setExpanded(true)}>
        <strong>{item.title}</strong><small>{item.sender}</small>
      </button>
      <button aria-label={playing ? "일시정지" : "재생"} onClick={toggle}>
        {playing ? "Ⅱ" : <Play size={20} fill="currentColor" />}
      </button>
      <button aria-label="다음 곡" onClick={onNext}><SkipForward /></button>
      <span className="spotify-mini-progress" style={{ width: progress + "%" }} />
    </div>
    {expanded && <div className="spotify-full-player">
      <header><button onClick={() => setExpanded(false)} aria-label="닫기">⌄</button><strong>재생 중</strong><span>•••</span></header>
      <div className="spotify-full-cover">{cover ? <img src={cover} alt="" /> : <Music size={76} />}</div>
      <div className="spotify-full-title"><strong>{item.title}</strong><span>{item.sender}</span></div>
      <div className="spotify-progress">
        <input aria-label="재생 위치" type="range" min={0} max={Math.max(1, duration)}
          value={Math.min(current, duration || current)}
          onChange={(event) => seek(Number(event.target.value))} />
        <div><small>{format(current)}</small><small>{format(duration)}</small></div>
      </div>
      <div className="spotify-full-controls">
        <button aria-label="셔플" aria-pressed={shuffle} onClick={() => setShuffle(!shuffle)}>⤨</button>
        <button aria-label="上一首" onClick={onPrevious}><SkipBack /></button>
        <button className="spotify-big-play" aria-label={playing ? "일시정지" : "播放"} onClick={toggle}>{playing ? "Ⅱ" : "▶"}</button>
        <button aria-label="下一首" onClick={onNext}><SkipForward /></button>
        <button aria-label="循环" aria-pressed={repeat} onClick={() => setRepeat(!repeat)}>↻</button>
      </div>
    </div>}
  </>;
}
