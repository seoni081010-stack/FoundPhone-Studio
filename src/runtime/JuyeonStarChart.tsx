import { useEffect, useRef, useState, type CSSProperties } from "react";
import "./JuyeonStarChart.css";

export const STAR_CHART_REVEAL_MS = 10500;
const stars = [
  [100,355,85,172,2.1], [137,328,128,112,2.6], [179,346,182,143,2], [195,388,205,195,3.2],
  [236,410,259,157,2.3], [273,373,295,91,3], [311,397,344,124,2], [354,359,387,182,2.6],
  [151,451,153,227,1.8], [295,457,310,229,2],
];

function playChartSound() {
  const context = new AudioContext();
  const master = context.createGain(); master.gain.value = .055; master.connect(context.destination);
  const now = context.currentTime;
  const noise = context.createBuffer(1, context.sampleRate * .8, context.sampleRate);
  const channel = noise.getChannelData(0);
  for (let i=0;i<channel.length;i++) channel[i]=(Math.random()*2-1)*Math.sin(Math.PI*i/channel.length);
  const rustle = context.createBufferSource(); rustle.buffer=noise;
  const filter=context.createBiquadFilter(); filter.type="bandpass";filter.frequency.value=900;filter.Q.value=.7;
  const paperGain=context.createGain();paperGain.gain.value=.35;
  rustle.connect(filter).connect(paperGain).connect(master);rustle.start(now);
  for (const [frequency,delay] of [[110,.2],[146.8,.55],[220,1.45]]) {
    const tone=context.createOscillator(),gain=context.createGain(); tone.type="sine";
    tone.frequency.setValueAtTime(frequency,now+delay);tone.frequency.exponentialRampToValueAtTime(frequency*1.35,now+delay+1.5);
    gain.gain.setValueAtTime(0,now+delay);gain.gain.linearRampToValueAtTime(.3,now+delay+.25);gain.gain.exponentialRampToValueAtTime(.001,now+delay+2);
    tone.connect(gain).connect(master);tone.start(now+delay);tone.stop(now+delay+2.1);
  }
  void context.resume().catch(()=>{});
  return context;
}

export function JuyeonStarChart({ startedAt, onContinue }: { startedAt: number; onContinue: () => void }) {
  const svg = useRef<SVGSVGElement>(null);
  const elapsed = useRef(Math.max(0, Date.now()-startedAt));
  const [ready,setReady]=useState(elapsed.current>=STAR_CHART_REVEAL_MS);
  useEffect(()=>{ svg.current?.setCurrentTime(0); },[]);
  useEffect(()=>{
    const timer=window.setTimeout(()=>setReady(true),Math.max(0,startedAt+STAR_CHART_REVEAL_MS-Date.now()));
    return ()=>window.clearTimeout(timer);
  },[startedAt]);
  useEffect(()=>{
    if(elapsed.current>500 || typeof AudioContext==="undefined")return;
    let sound:AudioContext|undefined;
    try{sound=playChartSound();}catch{/* The visual sequence remains playable if audio is unavailable. */}
    return ()=>{void sound?.close().catch(()=>{});};
  },[]);
  return <dialog className="juyeon-star-chart" aria-label="被唤醒的羊皮纸星图"
    ref={node=>{if(node&&!node.open)node.showModal();}} onCancel={event=>event.preventDefault()}>
    <div className="chart-stage" style={{"--chart-elapsed":`-${elapsed.current}ms`} as CSSProperties}>
      <svg ref={svg} viewBox="0 0 480 620" aria-hidden="true" focusable="false">
        <g className="chart-paper">
          <image href={`${import.meta.env.BASE_URL}sunwoo-truth-parchment.png`} x="22" y="245" width="436" height="335" preserveAspectRatio="none" className="chart-paper-texture" />
          <g className="chart-ink" fill="none" stroke="#243957" strokeWidth=".9" opacity=".8">
            <path d="M100 355 137 328 179 346 195 388 151 451M137 328 151 451M236 410 273 373 311 397 354 359M311 397 295 457" />
            {stars.map(([x,y],i)=><circle key={i} cx={x} cy={y} r={i%3===0?2.5:1.8} fill="#243957" strokeWidth=".4" />)}
          </g>
        </g>
        <g className="chart-wand-sweep" fill="none" stroke="#b8d9ed" strokeLinecap="round">
          <path className="chart-wand-glow" d="M65 444 Q209 273 416 354" strokeWidth="5" />
          <path d="M65 444 Q209 273 416 354" strokeWidth="1.3" />
        </g>
        <g className="chart-hovering-sky">
        <g className="chart-sky-links" fill="none" stroke="#8dafd4" strokeWidth=".65">
          <path d="M85 172 128 112 182 143 205 195 153 227M128 112 205 195M259 157 295 91 344 124 387 182 310 229M259 157 310 229" />
        </g>
        {stars.map(([x,y,tx,ty,size],i)=><g className="chart-rising-star" key={i} style={{
          animationDelay:`${2400+i*190-elapsed.current}ms`,
        } as CSSProperties}>
          <animateMotion path={`M0 0 Q${(tx-x)/2+(i%2?35:-35)} ${(ty-y)/2} ${tx-x} ${ty-y}`}
            begin={`${2400+i*190-elapsed.current}ms`} dur="4200ms" fill="freeze" calcMode="spline" keyTimes="0;1" keySplines=".22 .48 .35 1" />
          <path className="chart-star-trail" d={`M${x+7} ${y+17} Q${x-6} ${y+6} ${x} ${y}`} fill="none" stroke="#81a9d3" strokeWidth=".8" />
          <g className="chart-star-breath" style={{animationDelay:`${-elapsed.current-i*340}ms`}}>
            <circle className="chart-star-halo" cx={x} cy={y} r={size*3.4} fill="#8eafdb" />
            <circle cx={x} cy={y} r={size} fill="#203b69" />
            <circle cx={x-.4} cy={y-.4} r={size*.35} fill="#a7c7df" opacity=".85" />
          </g>
        </g>)}
        <g className="chart-sky-dust">
          {Array.from({length:20},(_,i)=><circle className="chart-dust" key={i} cx={70+(i*71)%340} cy={75+(i*47)%170} r={i%4===0?1:.55}
            fill="#87a6c8" style={{animationDelay:`${-elapsed.current-i*470}ms`}} />)}
        </g>
        </g>
      </svg>
      <button className="chart-continue" type="button" disabled={!ready} onClick={()=>{if(ready)onContinue();}}>继续</button>
    </div>
  </dialog>;
}
