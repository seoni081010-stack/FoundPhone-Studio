import { useState } from "react";
import { BookOpen, Feather, ScrollText, Map, Images, Heart, ArrowLeft, WandSparkles } from "lucide-react";
import { initialRuntime, type Runtime, type Work } from "../schema";
import { dispatch, choose } from "../engine";
import "./HogwartsDevice.css";

const modules = [
  { id: "owlpost", name: "猫头鹰信箱", subtitle: "书信与便笺", Icon: Feather },
  { id: "schoolbook", name: "校园手册", subtitle: "课程与活动", Icon: BookOpen },
  { id: "wizardjournal", name: "巫师手札", subtitle: "私密记录", Icon: ScrollText },
  { id: "magicphotos", name: "魔法相册", subtitle: "会动的回忆", Icon: Images },
  { id: "maraudersmap", name: "活点地图", subtitle: "城堡探索", Icon: Map },
  { id: "heartarchive", name: "人物档案", subtitle: "相处的记忆", Icon: Heart },
] as const;
type Props = { work: Work; identity?: { name: string; house: string; year: number; loveInterest: string } | null };
export function HogwartsDevice({ work, identity }: Props) {
  const [state, setState] = useState<Runtime>(() => { const initial = initialRuntime(work); initial.variables.hyunjae_player_house = identity?.house ?? "unspecified"; initial.variables.hyunjae_player_year = identity?.year ?? 5; return dispatch(work, initial, "start"); });
  const [active, setActive] = useState("owlpost");
  const [opened, setOpened] = useState(false);
  const entries = (state.messages.owlpost ?? []).filter(item => !item.hidden);
  const last = entries.slice(-7);
  const chosen = modules.find(m => m.id === active) ?? modules[0];
  const houseLine = identity?.house === "slytherin"
    ? "李贤在：明天球场上我们算对手学院，但你支持谁都行。比赛结束照样一起走。"
    : identity?.house === "gryffindor"
      ? "李贤在：最近公共休息室一直在聊比赛。你要是嫌吵，我们就去走廊说话ㅋㅋ"
      : identity?.house === "ravenclaw"
        ? "李贤在：你们塔楼看雪的视野是不是特别好？下次带我去看看。"
        : identity?.house === "hufflepuff"
          ? "李贤在：你们公共休息室离厨房那么近，难怪你总知道今天有什么好吃的。"
          : "";
  const yearLine = identity?.year === 5
    ? "李贤在：O.W.L. 年也别只顾着复习。吃饭和睡觉都不许省。"
    : identity?.year === 6
      ? "李贤在：六年级和我的课表错开不少，难怪有时候一整天都碰不到你。"
      : identity?.year === 7
        ? "李贤在：都是七年级，最近忙成这样还能天天碰见，也挺厉害的ㅋㅋ"
        : "";
  const select = (target: string) => {
    setState(previous => choose(work, previous, target));
  };
  return <div className="hogwarts-device-stage">
    <div className="hogwarts-device" aria-label="霍格沃茨魔法卷宗">
      <div className="hogwarts-device-top"><WandSparkles size={17}/><span>HOGWARTS · WINTER TERM</span><span>✦</span></div>
      <header className="hogwarts-device-header">
        <div className="hogwarts-device-seal">H</div>
        <div><small>THE ENCHANTED FOLIO</small><h1>霍格沃茨魔法卷宗</h1><p>{identity?.name || "年轻的巫师"} · {state.date || "2026-12-01"}</p></div>
      </header>
      {!opened ? <main className="hogwarts-device-home">
        <p className="hogwarts-device-section">魔法物品</p>
        <div className="hogwarts-device-grid">
          {modules.filter(m => work.apps.some(a => a.id === m.id && a.installed)).map(m => <button key={m.id} className="hogwarts-device-tile" onClick={() => {setActive(m.id);setOpened(true);}}><span className="hogwarts-device-icon"><m.Icon size={25}/></span><strong>{m.name}</strong><small>{m.subtitle}</small></button>)}
        </div>
        <p className="hogwarts-device-note">羊皮纸会记住你的每一次选择。魔法故事正在继续。</p>
      </main> : <main className="hogwarts-device-page">
        <button className="hogwarts-device-back" onClick={() => setOpened(false)}><ArrowLeft size={17}/> 返回卷宗</button>
        <h2><chosen.Icon size={22}/> {chosen.name}</h2>
        {active === "owlpost" ? <section className="hogwarts-device-letters">
          <p className="hogwarts-device-section">李贤在 · 格兰芬多七年级级长</p>{identity && <p className="hogwarts-device-context">你 · {identity.year}年级 · {identity.house === "gryffindor" ? "格兰芬多" : identity.house === "slytherin" ? "斯莱特林" : identity.house === "ravenclaw" ? "拉文克劳" : "赫奇帕奇"}</p>}
          {identity && <div className="hogwarts-device-letter"><strong>与你有关的城堡细节</strong><p>{houseLine}</p><p>{yearLine}</p></div>}{last.length ? last.map(item => <article className="hogwarts-device-letter" key={item.id}>{item.body}</article>) : <p>暂时没有新的猫头鹰便笺。</p>}
          {state.choices.length > 0 && <div className="hogwarts-device-choices"><p>你会怎么回答？</p>{state.choices.map(c => <button key={c.target} onClick={() => select(c.target)}>{c.label}</button>)}</div>}
          {state.endings.length > 0 && <div className="hogwarts-device-ending">{state.endings.includes("hyunjae-together") ? "✦ 十二月的约定 · 恋人" : "✦ 十二月的约定 · 未说破的喜欢"}</div>}
        </section> : active === "heartarchive" ? <section className="hogwarts-device-letters"><p>李贤在 · 相处记录</p><p>心动进度：{Number(state.variables.hyunjae_affection ?? 0)} / 100</p><p>共同初雪：{state.variables.hyunjae_first_snow_together ? "已经留下回忆" : "尚未共同经历"}</p><p>这份卷宗只记录真正发生过的事。</p></section> : <section className="hogwarts-device-letters">{(work.data[active] ?? []).map(item => <article className="hogwarts-device-letter" key={item.id}><strong>{item.title}</strong><p>{item.body}</p>{active === "maraudersmap" && <small>✦ 已标记在活点地图</small>}</article>)}{!(work.data[active] ?? []).length && <p>这页羊皮纸还没有写下新的内容。</p>}</section>}
      </main>}
      <footer className="hogwarts-device-footer"><span>✦</span><span>HOGWARTS SCHOOL OF WITCHCRAFT AND WIZARDRY</span><span>✦</span></footer>
    </div>
  </div>;
}
