import { useState } from "react";
import "./HogwartsCover.css";

const towers = [
  [319, 285, 70, 159], [403, 227, 62, 217], [472, 274, 82, 170],
  [558, 162, 77, 282], [644, 246, 97, 198], [748, 204, 58, 240],
  [811, 300, 93, 144], [913, 267, 49, 177], [974, 322, 65, 122],
];
const stars = Array.from({length: 88}, (_, i) => [((i * 337) % 1439), ((i * 109) % 397), i % 13 === 0 ? 1.8 : .7]);

export function HogwartsCover({ onEnter }: { onEnter: () => void }) {
  const [leaving, setLeaving] = useState(false);
  return <section className="winter-cover" data-leaving={leaving} aria-label="Hogwarts Unspoken 游戏封页"
    onAnimationEnd={event => { if (event.target === event.currentTarget && leaving) onEnter(); }}>
    <svg className="winter-landscape" viewBox="0 0 1440 780" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id="winter-sky" x2="0" y2="1"><stop stopColor="#090d26"/><stop offset=".66" stopColor="#292545"/><stop offset="1" stopColor="#6a5573"/></linearGradient>
        <linearGradient id="winter-lake" x2="0" y2="1"><stop stopColor="#393652"/><stop offset="1" stopColor="#070d20"/></linearGradient>
        <radialGradient id="winter-moon"><stop stopColor="#fff1d5" stopOpacity=".68"/><stop offset="1" stopColor="#c9bcf7" stopOpacity="0"/></radialGradient>
        <path id="winter-fir" d="M0 0l-13 25h7l-15 21h10l-16 22H-3v13h6V68h24L11 46h10L6 25h7z"/>
      </defs>
      <rect width="1440" height="780" fill="url(#winter-sky)"/>
      <circle cx="1080" cy="162" r="166" fill="url(#winter-moon)"/>
      <circle cx="1080" cy="162" r="44" fill="#eee2cb"/>
      {stars.map(([x,y,r], i) => <circle key={i} cx={x} cy={y} r={r} fill="#f4e7e4" opacity={.27 + (i % 6) / 11}/>)}
      <path d="M0 420L160 301l126 100 158-120 95 79 120-82 179 103 100-44 150 61 181-99 171 104v130H0z" fill="#32304f"/>
      <path d="M0 443q171-83 357-20t331-26 364 35 388-34v124H0z" fill="#1e223c"/>
      <rect y="464" width="1440" height="316" fill="url(#winter-lake)"/>
      <path d="M225 471l98-36 681-10 133 48-182 10-91-8-137 16-161-14-151 9z" fill="#11182c"/>
      <g fill="#14182d" stroke="#54516b" strokeWidth="1.2">
        <path d="M346 451v-91l56-40 75 25v-47h245v54h96l49-25 94 33v93z"/>
        <path d="M196 443v-25h158v25h-17v-9a12 12 0 0 0-24 0v9h-17v-9a12 12 0 0 0-24 0v9h-17v-9a12 12 0 0 0-24 0v9z" fill="#24253d"/>
        {towers.map(([x,y,w,h], i) => <g key={x}>
          <path d={`M${x} ${y}l${w/2} ${-w*.9} ${w/2} ${w*.9}v${h}h-${w}z`}/>
          <path d={`M${x+w/2} ${y-w*.9}v-13`} stroke="#81778d"/>
          {[0,1,2].map(row => <path className="winter-window" style={{animationDelay:`${i*.51+row*.37}s`}} key={row} d={`M${x+w/2-4} ${y+21+row*34}q4-10 8 0v13h-8z`} fill="#e8b574" stroke="none"/>)}
        </g>)}
        <path d="M529 445V242l17-49 17 49v203zm101 0V222l15-43 16 43v223z" fill="#202238"/>
        <path d="M676 448v-79l92-57 113 40v96z" fill="#24243b"/>
        <path d="M668 369l100-65 126 46-13 9-113-40-92 57z" fill="#17192e"/>
        {[704, 730, 756, 782, 808, 834].map((x, i) => <path key={x} className="winter-window" style={{animationDelay: `${i * .43}s`}} d={`M${x} 422v-30l5-10 5 10v30z`} fill="#e2b87b"/>)}
      </g>
      {Array.from({length: 29}, (_, i) => <path key={i} d={`M${385+i*23} ${489+i%5*12}h${26+i%4*23}`} stroke={i%3 ? "#a4a0c7" : "#e6b985"} opacity={.14+i%4*.045}/>)}
      <g fill="#0c1428">{Array.from({length: 30}, (_, i) => <use key={i} href="#winter-fir" transform={`translate(${i<15 ? i*22 : 1120+(i-15)*24} ${390+i%5*15}) scale(${.7+i%4*.21})`}/>)}</g>
      <path d="M0 568q188-64 329-6L0 633zm1440-25q-189-28-303 31l303 51z" fill="#131a31"/>
    </svg>
    <div className="winter-snow" aria-hidden="true">{Array.from({length: 34}, (_, i) => <i key={i} style={{
      left: `${(i*37)%101}%`, width: i%7===0 ? 4 : 2, height: i%7===0 ? 4 : 2,
      animationDuration: `${13+i%11}s`, animationDelay: `-${i*.83}s`,
    }}/>)}</div>
    <div className="winter-frame" aria-hidden="true" />
    <div className="winter-copy">
      <svg className="winter-mistletoe" viewBox="0 0 180 50" aria-hidden="true">
        <path d="M8 42Q51 10 90 31Q129 10 172 42M90 31V8" fill="none" stroke="#bca77a"/>
        <g fill="#829891" stroke="#d3c59d" strokeWidth=".6">
          <path d="M44 23Q22 4 14 19q14 12 30 4m18-3Q42 0 32 9q8 13 30 11m74 3q22-19 30-4-14 12-30 4m-18-3q20-20 30-11-8 13-30 11M90 25Q68 2 78 4q11 3 12 21m0 0q22-23 12-21-11 3-12 21"/>
        </g>
        <g fill="#efe5ca"><circle cx="84" cy="31" r="4"/><circle cx="95" cy="30" r="4"/><circle cx="90" cy="38" r="4"/></g>
      </svg>
      <h1 lang="en-GB"><span>Hogwarts Unspoken：</span><em>Snow Beneath Mistletoe</em></h1>
      <p>霍格沃茨 未说出口：槲寄生之下落雪</p>
      <button type="button" disabled={leaving} onClick={() => {
        if (matchMedia("(prefers-reduced-motion: reduce)").matches) onEnter();
        else setLeaving(true);
      }}>推开霍格沃茨的大门</button>
    </div>
  </section>;
}
