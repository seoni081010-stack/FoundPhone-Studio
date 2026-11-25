import { useEffect, useRef, useState } from "react";
import { castleFloorLayouts, castleMapHeight, castleLocation, type CastleFloorId } from "./castleFloors";
import "./MaraudersFloors.css";
import { characterLocations } from "./characterLocations";

type MapAudioWindow = Window & { webkitAudioContext?: typeof AudioContext };
type MapStage = "closed" | "oath" | "map" | "erasing";

export function MaraudersMap({ day, time = "09:00", place, activity, selectedId = "hyunjae", onEncounter }: {
  day: number; time?: string; place?: string; activity?: string; selectedId?: string; onEncounter?: () => void;
}) {
  const locations = characterLocations(day, time, selectedId, place);
  const selected = locations.find(person => person.id === selectedId) ?? locations[2];
  const [stage, setStage] = useState<MapStage>("closed");
  const canvas = useRef<HTMLDivElement>(null);
  const [activeFloor,setActiveFloor] = useState<CastleFloorId | "all">("all");
  const selectedLocation = castleLocation(selected.place);
  function focusFloor(id: CastleFloorId | "all") {
    setActiveFloor(id);
    const floor=castleFloorLayouts.find(entry=>entry.id===id);
    const scale=(canvas.current?.querySelector("svg")?.getBoundingClientRect().width ?? 360)/360;
    canvas.current?.scrollTo({ top: (floor?.top ?? 0)*scale, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  }
  const audio = useRef<AudioContext | null>(null);
  const scroll = useRef<HTMLDivElement>(null);

  useEffect(() => () => {
    const context = audio.current;
    audio.current = null;
    void context?.close().catch(() => {});
  }, []);
  useEffect(() => {
    if (stage !== "erasing") return;
    // Remove the ink before the lower roller starts moving.
    const timer = window.setTimeout(() => setStage("closed"),
      matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 1350);
    return () => window.clearTimeout(timer);
  }, [stage]);

  function turn(next: MapStage) {
    setStage(next);
    if (next === "map") focusFloor(selectedLocation.floor);
    scroll.current?.focus({ preventScroll: true });
    void playSound(next);
  }

  async function playSound(next: MapStage) {
    // Audio starts on a user gesture. Browsers without Web Audio still play the full visual sequence.
    try {
      const Audio = window.AudioContext ?? (window as MapAudioWindow).webkitAudioContext;
      if (!Audio) throw new Error("Web Audio unavailable");
      audio.current ??= new Audio();
      const context = audio.current;
      if (context.state !== "running") await context.resume();
      if (audio.current !== context) return;
      if (context.state !== "running") throw new Error("Audio is not running");
      const cueTime = context.currentTime + .04;
      if (next === "oath" || next === "erasing") {
        // A short filtered noise envelope gives the paper a quiet rustle.
        const buffer = context.createBuffer(1, Math.floor(context.sampleRate * .55), context.sampleRate);
        const samples = buffer.getChannelData(0);
        for (let i = 0; i < samples.length; i++) {
          samples[i] = (Math.random() * 2 - 1) * Math.sin(Math.PI * i / samples.length);
        }
        const paper = context.createBufferSource();
        paper.buffer = buffer;
        const filter = context.createBiquadFilter();
        filter.type = "bandpass";
        filter.frequency.value = 1700;
        const level = context.createGain();
        level.gain.value = .25;
        paper.connect(filter).connect(level).connect(context.destination);
        paper.start(cueTime + (next === "erasing" ? 1.3 : .13));
      }
      const notes = next === "oath" ? [392, 523, 784] : next === "erasing" ? [523, 392] : [523, 659, 880];
      notes.forEach((pitch, index) => {
        const start = cueTime + index * .18 + (next === "oath" && index === 2 ? 1.18 : 0);
        const voice = context.createOscillator();
        const gain = context.createGain();
        voice.type = index === 0 ? "triangle" : "sine";
        voice.frequency.setValueAtTime(pitch, start);
        voice.frequency.exponentialRampToValueAtTime(pitch * .84, start + .4);
        gain.gain.setValueAtTime(.001, start);
        gain.gain.exponentialRampToValueAtTime(.16, start + .08);
        gain.gain.exponentialRampToValueAtTime(.001, start + .42);
        voice.connect(gain).connect(context.destination);
        voice.start(start);
        voice.stop(start + .43);
      });
    } catch {
      // Keep the scroll usable when the browser cannot start audio.
    }
  }

  return <section className="marauder-stage" data-stage={stage} aria-label="活点地图卷轴">
    <style>{`@keyframes marauder-local-walk { from { transform: translateX(-5px); } to { transform: translateX(5px); } }`}</style>
    <div className="marauder-dust" aria-hidden="true">
      {Array.from({ length: 16 }, (_, i) => <i key={i} style={{
        left: `${i * 37 % 97}%`, top: `${i * 23 % 93}%`, animationDelay: `-${i * .8}s`,
      }}>{["✧", "·", "☽", "·", "ᛟ", "·"][i % 6]}</i>)}
    </div>
    <div className="marauder-scroll" ref={scroll} tabIndex={-1}>
      <div className="marauder-roll" aria-hidden="true"><i /></div>
      <div className="marauder-sheet" data-open={stage !== "closed"} inert={stage === "closed"}>
        <div className="marauder-paper">
          <button className="marauder-oath" aria-label="我庄严宣誓，我不干好事" inert={stage !== "oath"} onClick={() => turn("map")}>
            <span className="marauder-oath-letters">
              {Array.from("我庄严宣誓，我不干好事", (letter, i) =>
                <b key={i} aria-hidden="true" style={{ animationDelay: `${1.62 + i * .09}s` }}>{letter}</b>)}
            </span>
            <span className="marauder-oath-english" lang="en-GB">I solemnly swear that I am up to no good.</span>
          </button>
          <div className="marauder-ink" inert={stage !== "map"}>
            <header className="marauder-signature">
              <span lang="en-GB">Moony, Wormtail, Padfoot &amp; Prongs</span>
              <span>月亮脸、虫尾巴、大脚板和尖头叉子</span>
              <strong lang="en-GB">The Marauder’s Map</strong>
              <span aria-live="polite">12月{day}日 · {time} · {selected.name} · {selected.place} · {selectedLocation.floorTitle}{activity && activity !== selected.place ? ` · ${activity}` : ""}</span>
            </header>
            <nav className="marauder-floor-tabs" aria-label="地图楼层">
              <button type="button" aria-pressed={activeFloor === "all"} onClick={()=>focusFloor("all")}>全图 · 7人</button>
              {(["one","two","three","four","dungeons","towers","grounds"] as const).map(id=>{
                const floor=castleFloorLayouts.find(entry=>entry.id===id)!;
                const count=locations.filter(person=>castleLocation(person.place).floor===id).length;
                return <button key={id} type="button" aria-label={floor.title} aria-pressed={activeFloor===id} onClick={()=>focusFloor(id)}>{floor.title}<small>{count}</small></button>;
              })}
            </nav>
            <div className="marauder-floor-canvas" ref={canvas} role="region" aria-label="分层城堡地图" tabIndex={0}>
            <svg viewBox={`0 0 360 ${castleMapHeight}`} role="img" aria-label="霍格沃茨一至四层、地窖、塔楼和室外地图">
              <title>霍格沃茨分层活点地图</title>
              <g className="marauder-lines">
                {castleFloorLayouts.map(floor=><g key={floor.id} data-floor-band={floor.id} className={activeFloor===floor.id?"is-focused":""}>
                  <rect className="marauder-floor-paper" x="5" y={floor.top+4} width="350" height={floor.height-8} rx="10" />
                  <text className="marauder-floor-title" x="180" y={floor.top+29}>{floor.title}</text>
                  <path d={`M174 ${floor.top+39}v${floor.height-60}m12 0V${floor.top+39}`} />
                  {floor.rooms.map((name,index)=>{
                    const x=index%2===0?90:270,y=floor.top+88+Math.floor(index/2)*86;
                    return <g key={name} data-map-room={name} data-room-floor={floor.id}>
                      <rect className="marauder-room" x={x-76} y={y-42} width="152" height="66" rx="3" />
                      <path d={`M${x<180?x+76:x-76} ${y-9}h${x<180?8:-8}`} />
                      <text className="marauder-room-label" x={x} y={y-23}>{name}</text>
                      <path className="marauder-window" d={`M${x-63} ${y-40}v10m7-10v10m7-10v10`} />
                    </g>;
                  })}
                  <path className="marauder-stairs" d={`M165 ${floor.top+floor.height-35}h30m-30 5h30m-30 5h30`} />
                  <text className="marauder-corridor-label" x="180" y={floor.top+floor.height-8}>楼梯与回廊</text>
                </g>)}
              </g>
              {locations.map(person=>{
                const point=castleLocation(person.place);
                const group=locations.filter(other=>castleLocation(other.place).key===point.key);
                const slot=group.findIndex(other=>other.id===person.id),columns=Math.min(group.length,3);
                const x=point.x+(slot%3-(columns-1)/2)*38,y=point.y+Math.floor(slot/3)*12;
                return <g key={person.id} data-person={person.id} data-place={person.place} data-floor={point.floor} data-map-room={point.room}
                  data-mapped={point.explicit} transform={`translate(${x} ${y})`}>
                  <g className={`marauder-person${person.id===selectedId?" is-selected":""}`}>
                    <title>{person.name} · {point.floorTitle} · {person.place}</title>
                    <text style={{ paintOrder:"stroke",stroke:"#f2dcac",strokeWidth:3,fontSize:10,textAnchor:"middle",fontWeight:person.id===selectedId?"bold":"normal" }}>{person.name}</text>
                    <path d="M-10 4l3 2m5-1 3 2" />
                  </g>
                </g>;
              })}
            </svg>
            </div>
            {onEncounter && <button className="hogwarts-activity" onClick={onEncounter}>去{selected.place}找{selected.name}</button>}
            <button className="marauder-close" onClick={() => turn("erasing")}>恶作剧完毕</button>
          </div>
        </div>
      </div>
      <div className="marauder-roll" aria-hidden="true"><i /></div>
      {stage === "closed" && <button className="marauder-unroll" aria-label="展开羊皮卷轴" onClick={() => turn("oath")} />}
    </div>
  </section>;
}
