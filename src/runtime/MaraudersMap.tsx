import { useEffect, useRef, useState } from "react";
import { characterLocations } from "./characterLocations";

const rooms = [
  ["天文塔", 82, 68], ["图书馆", 276, 68],
  ["黑魔法防御术", 83, 123], ["魔咒学", 276, 123],
  ["魔法史", 83, 175], ["古代如尼文", 276, 175],
  ["占卜学", 83, 227], ["算术占卜", 276, 227],
  ["门厅", 83, 301], ["大礼堂", 276, 301],
  ["变形术", 83, 353], ["魔药学 · 地窖", 276, 353],
  ["庭院与拱门", 82, 421], ["草药学温室", 276, 421],
  ["神奇动物课场地", 82, 478], ["魁地奇球场", 276, 478],
  ["禁林边缘", 180, 535],
] as const;

type MapAudioWindow = Window & { webkitAudioContext?: typeof AudioContext };

type MapStage = "closed" | "oath" | "map" | "erasing";

const landmarks: Partial<Record<string, readonly [number, number]>> = {
  "霍格沃茨图书馆": [276, 68],
  "霍格沃茨图书馆外": [235, 96],
  "三号温室外": [310, 448],
  "城堡庭院": [82, 421],
  "霍格沃茨庭院": [82, 421],
  "麻瓜研究教室外": [225, 245],
  "霍格沃茨西侧回廊": [180, 260],
  "霍格沃茨厨房外": [275, 325],
  "霍格沃茨厨房附近": [275, 325],
  "霍格沃茨魁地奇球场": [276, 478],
  "赫奇帕奇公共休息室附近的走廊": [230, 334],
  "霍格沃茨暗房": [310, 96],
  "霍格沃茨礼堂": [276, 301],
  "霍格沃茨礼堂外": [237, 301],
  "长廊": [180, 280],
  "城堡西侧长廊": [180, 260],
  "西廊窗边": [180, 260],
  "空教室": [229, 208],
  "霍格莫德文具店": [70, 548],
  "猫头鹰棚屋": [70, 42],
  "城堡外的小路": [180, 548],
  "黑湖湖畔": [320, 548],
  "霍格沃茨厨房": [275, 325],
  "佐科魔法笑话店": [70, 548],
  "三把扫帚": [70, 548],
  "温室外侧露台": [310, 448],
  "三楼猎犬画像旁": [180, 180],
  "三楼高窗石廊": [310, 180],
  "回城堡的路上": [180, 505],
  "城堡楼梯": [180, 320],
  "图书馆门口": [235, 96],
  "图书馆外的走廊": [235, 96],
  "画像后的小房间": [310, 96],
  "霍格莫德镇": [70, 548],
  "蜂蜜公爵": [70, 548],
  "城堡外的石桥": [280, 548],
};

export function MaraudersMap({ day, time = "09:00", place, activity, selectedId = "hyunjae", onEncounter }: {
  day: number; time?: string; place?: string; activity?: string; selectedId?: string; onEncounter?: () => void;
}) {
  const locations = characterLocations(day, time, selectedId, place);
  const selected = locations.find(person => person.id === selectedId) ?? locations[2];
  const [stage, setStage] = useState<MapStage>("closed");
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
              <span aria-live="polite">12月{day}日 · {time} · {selected.name} · {selected.place}{activity && activity !== selected.place ? ` · ${activity}` : ""}</span>
            </header>
            <svg viewBox="0 0 360 565" role="img" aria-label="霍格沃茨城堡、走廊与秘密通道">
              <title>霍格沃茨活点地图</title>
              <g className="marauder-lines">
                <path className="marauder-etch" pathLength="1" d="M10 387V48l24-24 21 21h65V37l20-24 19 23h37V25L218 4l21 21v20h64l21-23 25 26v342l-20 16H33Zm150-89h40m-40 8h40m-40 8h40m-40 8h40m-40 8h40M154 340h52M154 349h52m-52 9h52M21 244h26m-26 7h26m-26 7h26m265-14h24m-24 7h24m-24 7h24" />
                <g className="marauder-etch" aria-hidden="true">
                  <path pathLength="1" d="M44 510q-4-16 22-19-6 16-22 19m-6 6 21-20m-12 9 8-2M305 508l8 15 15-9-15-8-8 16m11-23v32m-17-16h33" />
                </g>
                <path pathLength="1" d="M16 387V51l18-20 18 20h73V40l15-20 16 20h46V28l16-18 15 18v23h72l20-20 19 20v335l-18 13H34Z" />
                <path pathLength="1" d="M171 58v328m18-328v328M22 265h315m-315 10h315M82 279v17m194-17v17M179 386l-97 31m97-31 97 31M82 434l1 32m193-31v31" />
                <path className="marauder-secret" d="M280 76C345 138 324 202 306 240S238 330 284 355 327 440 198 522M76 302C34 343 54 393 104 416" />
                {rooms.map(([name, x, y]) => <g key={name}>
                  {name === "魁地奇球场" ? <ellipse pathLength="1" cx={x} cy={y} rx="61" ry="23" /> : <path pathLength="1" d={`M${x - 58} ${y - 15}l116-1 1 31-117 1Z`} />}
                  <text x={x} y={y + 4}>{name}</text>
                </g>)}
                <text className="marauder-doodle" x="45" y="395" aria-hidden="true">✧ ☽</text>
                <text x="180" y="258">长廊</text>
                <text x="280" y="390">⋯ 秘密通道</text>
                {locations.some(person => ["霍格莫德镇", "蜂蜜公爵"].includes(person.place)) && <text x="70" y="534" style={{ fontSize: 9 }}>霍格莫德</text>}
                {locations.some(person => person.place === "城堡外的石桥") && <text x="280" y="534" style={{ fontSize: 9 }}>石桥</text>}
              </g>
              {locations.map(person => {
                const room = rooms.find(([name]) => name === person.place);
                const point = room ? [room[1], room[2] + 15] : landmarks[person.place] ?? landmarks["长廊"]!;
                const group = locations.filter(other => other.place === person.place);
                const slot = group.findIndex(other => other.id === person.id);
                const columns = Math.min(group.length, 3);
                const x = point[0] + (slot % 3 - (columns - 1) / 2) * 37;
                const y = point[1] + Math.floor(slot / 3) * 12;
                return <g key={person.id} transform={`translate(${x} ${y})`}>
                <g className="marauder-person marauder-person-first" style={{ animationName: "marauder-local-walk" }}>
                  <title>{person.name} · {person.place}</title>
                  <text style={{ paintOrder: "stroke", stroke: "#f2dcac", strokeWidth: 3, fontSize: 9, textAnchor: "middle", fontWeight: person.id === selectedId ? "bold" : "normal" }}>{person.name}</text>
                  <path d="M-12 5l3 2m5-1 3 2" />
                </g>
              </g>;
              })}
            </svg>
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
