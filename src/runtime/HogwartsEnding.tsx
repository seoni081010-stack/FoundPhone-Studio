import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import "./HogwartsEnding.css";

type EndingKind = "together" | "unspoken" | "friends";
type Props = {
  kind: EndingKind; text: string; character: { id: string; name: string };
  showFriendGift?: boolean; affinity: number; jealousy: number; onBack: () => void; onRestart: () => void;
};

const endingLabels: Record<EndingKind, string> = {
  together: "END·恋人",
  friends: "END·朋友",
  unspoken: "END·未说出口",
};

const seals: Record<EndingKind, string> = {
  together: "故事至此圆满",
  unspoken: "故事未完待续，以后的日子由你们自己书写",
  friends: "故事未完待续，陪伴是最珍贵的永恒",
};

function figures(color: string, near: boolean) {
  return <g fill={color}>
    <circle cx="272" cy="229" r="11" /><circle cx="323" cy="222" r="12" />
    <path d="M261 244Q274 233 284 245L296 308H249Z M310 239Q324 230 336 242L351 308H300Z" />
    <path d={near ? "M281 250Q288 270 299 269Q309 266 315 248" : "M282 250Q288 269 296 271M315 247Q308 264 303 269"} fill="none" stroke={color} strokeWidth="5" strokeLinecap="round" />
  </g>;
}

function EndingArt({kind}: {kind: EndingKind}) {
  const winter = kind === "together";
  const warm = kind === "friends";
  return <>
    <defs>
      <linearGradient id="ending-sky" x2="0" y2="1">
        <stop stopColor={winter ? "#111b3b" : warm ? "#3b201b" : "#362b47"} />
        <stop offset="1" stopColor={winter ? "#535b84" : warm ? "#a26643" : "#8a728b"} />
      </linearGradient>
      <radialGradient id="ending-glow">
        <stop stopColor={winter ? "#faf0c7" : "#ffbd76"} stopOpacity=".72" />
        <stop offset="1" stopColor={winter ? "#faf0c7" : "#ffbd76"} stopOpacity="0" />
      </radialGradient>
    </defs>
    <rect width="600" height="360" fill="url(#ending-sky)" />
    {winter ? <>
      <circle cx="302" cy="77" r="110" fill="url(#ending-glow)" /><circle cx="302" cy="77" r="23" fill="#f9edc8" />
      <path d="M0 218L91 166l91 37 98-48 103 42 123-59 94 58v68H0Z" fill="#262e49" />
      <path d="M68 223v-42h21v-22l14-28 14 28v20h21v-38l15-36 16 36v43h21v-32l13-28 14 28v73Z" fill="#141c34" />
      {[102,153,203].map((x,i) => <path key={x} d={`M${x} ${175+i*7}v8m0 7v8`} stroke="#f5d28e" strokeWidth="2" />)}
      <path d="M0 224Q155 212 318 225T600 222V360H0Z" fill="#222c4c" />
      {Array.from({length:12},(_,i)=><path key={i} d={`M${251-i*4} ${232+i*6}h${95+i*9}`} stroke="#c6bfa0" opacity={.28-i*.016} />)}
      <path d="M0 338Q159 297 263 304T600 320v40H0Z" fill="#161d32" />
      {figures("#11192d",true)}
      <g className="ending-mistletoe" stroke="#a7b996" fill="none">
        <path d="M267 109Q301 129 335 109M300 121V99M286 119q-23-18-23-4 4 8 23 4m27 0q23-18 23-4-4 8-23 4" />
        <circle cx="298" cy="123" r="3" fill="#fff4d5" /><circle cx="305" cy="125" r="3" fill="#fff4d5" />
      </g>
    </> : warm ? <>
      <path d="M0 316H600v44H0Z" fill="#482924" />
      <path d="M61 200V70q61-65 122 0v130Z" fill="#2f2940" stroke="#b78662" strokeWidth="6" />
      <path d="M122 47v153m-61-68h122" stroke="#b78662" strokeWidth="4" />
      <circle cx="90" cy="95" r="3" fill="#efe0b8" /><circle cx="146" cy="80" r="5" fill="#efe0b8" />
      <path d="M410 268V119h121v149Z" fill="#6e4230" stroke="#be8557" strokeWidth="8" />
      <path d="M432 265v-64a38 38 0 0 1 76 0v64Z" fill="#2d1a18" />
      <ellipse cx="471" cy="216" rx="110" ry="96" fill="url(#ending-glow)" />
      <path className="ending-fire" d="M452 246q-13-17 11-42 1 14 8 20 17-20 10-34 30 35 9 56Z" fill="#ffba65" />
      <path d="M213 260q0-36 35-36h101q30 0 30 35v66H213Z" fill="#85534c" />
      {figures("#443035",false)}
      <path d="M197 285h200v39H197Z" fill="#a36657" />
      <path d="M97 303h80v7H97Zm8-8h64v7h-64Zm45-22h13l-2 19h-9Z" fill="#d4a06c" />
    </> : <>
      <path d="M0 45L301 99 600 45v251l-300-56L0 296Z" fill="#5e4a61" />
      <path d="M0 299l300-59 300 59v61H0Z" fill="#342e43" />
      <path d="M33 249V111q58-52 116 0v120Z" fill="#252941" stroke="#a590a7" strokeWidth="5" />
      <path className="ending-curtain" d="M41 87q42 17 40 61t35 63l-55 14q-34-46-20-138Z" fill="#c1acbd" opacity=".48" />
      {[216,402].map(x=><g key={x}><circle cx={x} cy="156" r="68" fill="url(#ending-glow)" /><path d={`M${x-5} 143h10v23h-10Z`} fill="#e9c293" /></g>)}
      {figures("#33283b",false)}
      <g className="ending-quill"><path d="M442 300l87 4-2 31-89-4Z" fill="#d7bec1" /><path d="M449 316h41m-41 6h24" stroke="#8b557b" strokeWidth="2" /><path d="M482 318q2-28 30-38-2 24-30 38l-5 7" fill="#e1c4d9" stroke="#9d7795" /></g>
    </>}
    {!warm && Array.from({length:winter ? 39 : 12},(_,i)=><circle key={i} className="ending-particle"
      cx={(i*137+15)%598} cy={(i*79+4)%351} r={i%5===0 ? 2 : 1}
      fill={i%3===0 ? "#f8d695" : "#fff6ec"} opacity={.23+i%5*.1}
      style={{animationDelay:`-${i*.83}s`}} />)}
  </>;
}

export function HogwartsEnding({kind,text,character,affinity,jealousy,onBack,onRestart,showFriendGift = true}: Props) {
  const [sealed, setSealed] = useState(false);
  const [gift, setGift] = useState(false);
  return <div className="hogwarts-device-stage"><div className="hogwarts-device">
    <main className="hogwarts-ending" data-kind={kind} data-sealed={sealed} aria-label="31天结算">
      <button className="ending-back" type="button" onClick={onBack}><ArrowLeft size={16} aria-hidden="true" /> 返回</button>
      <button className="ending-restart" type="button" onClick={onRestart}>重新开始</button>
      <svg xmlns="http://www.w3.org/2000/svg" className="ending-art" viewBox="0 0 600 360" role="img"
        aria-label={kind === "together" ? "月光下的黑湖与霍格沃茨" : kind === "unspoken" ? "窗纱轻动的城堡长廊" : "壁炉旁的公共休息室"}>
        <EndingArt kind={kind} />
      </svg>
      <div className="ending-copy">
        <p className="ending-date">12月31日 · 第31天完结</p>
        <img className="hogwarts-lead-avatar" src={`./portraits/${character.id}.webp`} alt={character.name} />
        <h2>{endingLabels[kind]}</h2>
        <p>{text}</p>
        <p className="ending-stats">{character.name} · 好感度 {affinity}% · 嫉妒值 {jealousy}%</p>
        {kind === "friends" && showFriendGift && <div>
          <button className="ending-candy" type="button" aria-expanded={gift} onClick={() => setGift(value => !value)}>拆开巧克力蛙</button>
          {gift && <p>{character.name}留了张纸条「巧克力蛙放你那儿了。拆的时候记得按住盒盖，上次那只跑得比我还快。」</p>}
        </div>}
        <button className="ending-seal" type="button" aria-pressed={sealed} onClick={() => setSealed(true)} aria-label="盖上结局印章">♥</button>
        {sealed && <p className="ending-seal-caption" role="status">{seals[kind]}</p>}
      </div>
    </main>
  </div></div>;
}
