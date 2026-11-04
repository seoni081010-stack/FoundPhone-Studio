import { useState } from "react";

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

export function MaraudersMap() {
  const [stage, setStage] = useState<"closed" | "oath" | "map">("closed");

  return <section className="marauder-stage" data-stage={stage} aria-label="活点地图卷轴">
    <div className="marauder-scroll">
      <div className="marauder-roll" />
      <div className="marauder-sheet" data-open={stage !== "closed"} inert={stage === "closed"}>
        <div className="marauder-paper">
          <button className="marauder-oath" inert={stage !== "oath"} onClick={() => setStage("map")}>
            <span>我庄严宣誓，我不干好事</span>
            <span className="marauder-oath-english" lang="en-GB">I solemnly swear that I am up to no good.</span>
          </button>
          <div className="marauder-ink" inert={stage !== "map"}>
            <header className="marauder-signature">
              <span lang="en-GB">Moony, Wormtail, Padfoot &amp; Prongs</span>
              <span>月亮脸、虫尾巴、大脚板和尖头叉子</span>
              <strong lang="en-GB">The Marauder’s Map</strong>
            </header>
            <svg viewBox="0 0 360 565" role="img" aria-label="霍格沃茨城堡、走廊与秘密通道">
              <title>霍格沃茨活点地图</title>
              <g className="marauder-lines">
                <path d="M16 387V51l18-20 18 20h73V40l15-20 16 20h46V28l16-18 15 18v23h72l20-20 19 20v335l-18 13H34Z" />
                <path d="M171 58v328m18-328v328M22 265h315m-315 10h315M82 279v17m194-17v17M179 386l-97 31m97-31 97 31M82 434l1 32m193-31v31" />
                <path className="marauder-secret" d="M280 76C345 138 324 202 306 240S238 330 284 355 327 440 198 522M76 302C34 343 54 393 104 416" />
                {rooms.map(([name, x, y]) => <g key={name}>
                  {name === "魁地奇球场" ? <ellipse cx={x} cy={y} rx="61" ry="23" /> : <path d={`M${x - 58} ${y - 15}l116-1 1 31-117 1Z`} />}
                  <text x={x} y={y + 4}>{name}</text>
                </g>)}
                <text x="180" y="258">长廊</text>
                <text x="280" y="390">⋯ 秘密通道</text>
              </g>
              <g className="marauder-person marauder-person-first"><text x="135" y="293">李贤在</text></g>
              <g className="marauder-person marauder-person-second"><text x="223" y="238">孙英宰</text></g>
              <g className="marauder-person marauder-person-third"><text x="212" y="450">李柱延</text></g>
            </svg>
            <button className="marauder-close" onClick={() => setStage("closed")}>恶作剧完毕</button>
          </div>
        </div>
      </div>
      <div className="marauder-roll" />
      {stage === "closed" && <button className="marauder-unroll" aria-label="展开羊皮卷轴" onClick={() => setStage("oath")} />}
    </div>
  </section>;
}
