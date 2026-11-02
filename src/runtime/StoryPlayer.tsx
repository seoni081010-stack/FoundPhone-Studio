import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { Phone } from "../Phone";
import { validateWork, type Work } from "../schema";
import "../styles.css";
import "./player.css";

const houses = [
  { id: "gryffindor", name: "格兰芬多", english: "Gryffindor", symbol: "♌", trait: "勇气 · 胆识 · 骑士精神" },
  { id: "slytherin", name: "斯莱特林", english: "Slytherin", symbol: "♜", trait: "野心 · 精明 · 决心" },
  { id: "ravenclaw", name: "拉文克劳", english: "Ravenclaw", symbol: "✦", trait: "智慧 · 求知 · 创造力" },
  { id: "hufflepuff", name: "赫奇帕奇", english: "Hufflepuff", symbol: "❖", trait: "忠诚 · 公平 · 勤奋" },
] as const;
const loveInterests = [
  { id: "jacob", name: "裴俊英", english: "JACOB", house: "hufflepuff", traits: "温柔 · 耐心 · 可靠", intro: "如果你找不到路，我可以陪你慢慢走。", affinity: { hufflepuff: 96, gryffindor: 70, ravenclaw: 74, slytherin: 38 } },
  { id: "younghoon", name: "金泳勋", english: "YOUNGHOON", house: "hufflepuff", traits: "细腻 · 真诚 · 慢热", intro: "不用急着认识我，我们有整个学期的时间。", affinity: { hufflepuff: 91, ravenclaw: 69, gryffindor: 63, slytherin: 50 } },
  { id: "hyunjae", name: "李贤在", english: "HYUNJAE", house: "slytherin", traits: "狡黠 · 勇敢 · 坚定", intro: "分院帽犹豫了很久。至于我为什么选这里，你以后会知道。", affinity: { slytherin: 54, gryffindor: 91, ravenclaw: 71, hufflepuff: 62 } },
  { id: "juyeon", name: "李柱延", english: "JUYEON", house: "slytherin", traits: "沉稳 · 专注 · 行动力", intro: "比起解释自己，我更习惯用行动回答。", affinity: { slytherin: 88, gryffindor: 84, hufflepuff: 69, ravenclaw: 65 } },
  { id: "kevin", name: "文炯书", english: "KEVIN", house: "ravenclaw", traits: "创意 · 敏锐 · 独立", intro: "魔法不只在课本里，也藏在你没留意的细节中。", affinity: { ravenclaw: 97, hufflepuff: 75, gryffindor: 63, slytherin: 57 } },
  { id: "q", name: "池昌珉", english: "Q", house: "ravenclaw", traits: "奇思妙想 · 灵动 · 好奇", intro: "你觉得奇怪的东西，说不定正是最有趣的秘密。", affinity: { ravenclaw: 86, gryffindor: 79, hufflepuff: 73, slytherin: 61 } },
  { id: "sunwoo", name: "金善旴", english: "SUNWOO", house: "slytherin", traits: "机敏 · 自信 · 口才", intro: "想赢过我？那你得先猜到我下一步要做什么。", affinity: { slytherin: 95, ravenclaw: 86, gryffindor: 73, hufflepuff: 48 } },
  { id: "eric", name: "孙英宰", english: "ERIC", house: "gryffindor", traits: "热情 · 直率 · 勇敢", intro: "要不要一起去冒险？放心，我会跑在你前面！", affinity: { gryffindor: 97, hufflepuff: 83, slytherin: 60, ravenclaw: 56 } },
] as const;
type Identity = { name: string; house: string; year: number; loveInterest: string };
const storageKey = "foundphone-hogwarts-identity-v1";
function savedIdentity(): Identity | null {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(storageKey) || "null");
    if (!value || typeof value !== "object") return null;
    const data = value as Partial<Identity>;
    if (typeof data.name !== "string" || !data.name.trim() || !houses.some(h => h.id === data.house) || !loveInterests.some(m => m.id === data.loveInterest) || !Number.isInteger(data.year) || (data.year ?? 0) < 1 || (data.year ?? 8) > 7) return null;
    return { name: data.name, house: data.house!, year: data.year!, loveInterest: data.loveInterest! };
  } catch { return null; }
}
function StoryPlayer() {
  const [work, setWork] = useState<Work | null>(null);
  const [error, setError] = useState("");
  const [identity, setIdentity] = useState<Identity | null>(savedIdentity);
  const [name, setName] = useState(identity?.name || "");
  const [house, setHouse] = useState(identity?.house || "");
  const [year, setYear] = useState(identity?.year || 1);
  const [loveInterest, setLoveInterest] = useState(identity?.loveInterest || "");
  useEffect(() => {
    const abort = new AbortController();
    fetch(
      new URLSearchParams(location.search).get("preview") === "test"
        ? "./test-work.json"
        : new URLSearchParams(location.search).get("template") === "blank"
          ? "./blank-work.json"
          : "./work.json",
      { signal: abort.signal },
    )
      .then((r) => {
        if (!r.ok) throw Error("缺少作品文件，请运行 npm run story:build");
        return r.json();
      })
      .then((x) => {
        const w = validateWork(x);
        document.title = w.title === "捡手机" ? "捡手机" : w.title + " · 捡手机";
        setWork(w);
      })
      .catch((e) => { if (e.name !== "AbortError") setError(String(e)); });
    return () => abort.abort();
  }, []);
  const isTest = new URLSearchParams(location.search).get("preview") === "test" || new URLSearchParams(location.search).get("template") === "blank";
  const chosen = houses.find(h => h.id === identity?.house);
  const selectedLead = loveInterests.find(m => m.id === loveInterest);
  const confirm = () => {
    if (!name.trim() || !house || !loveInterest) return;
    const next = { name: name.trim().slice(0, 40), house, year, loveInterest };
    localStorage.setItem(storageKey, JSON.stringify(next));
    setIdentity(next);
  };
  return (
    <main className="story-runtime">
      {work ? (
        !isTest && !identity ? (
          <section className="hogwarts-entry" aria-label="霍格沃茨入学登记">
            <div className="hogwarts-form">
              <div className="hogwarts-crest">✧ H ✧</div>
              <p className="hogwarts-eyebrow">HOGWARTS SCHOOL OF WITCHCRAFT AND WIZARDRY</p>
              <h1>霍格沃茨入学登记</h1>
              <p className="hogwarts-intro">欢迎来到魔法世界。请填写你的巫师身份，领取属于你的魔法手机。</p>
              <label className="hogwarts-label" htmlFor="wizard-name">巫师姓名</label>
              <input id="wizard-name" className="hogwarts-input" value={name} maxLength={40} onChange={e => setName(e.target.value)} placeholder="输入你的名字" />
              <p className="hogwarts-label">选择学院</p>
              <div className="hogwarts-houses">
                {houses.map(h => <button key={h.id} type="button" aria-pressed={house === h.id} className={`hogwarts-house ${h.id} ${house === h.id ? "selected" : ""}`} onClick={() => setHouse(h.id)}>
                  <span className="hogwarts-symbol">{h.symbol}</span><strong>{h.name}</strong><small>{h.english}</small><span className="hogwarts-trait">{h.trait}</span>
                </button>)}
              </div>
              <label className="hogwarts-label" htmlFor="wizard-year">选择年级</label>
              <select id="wizard-year" className="hogwarts-input" value={year} onChange={e => setYear(Number(e.target.value))}>
                {Array.from({ length: 7 }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1} 年级{ i === 4 ? " · O.W.L. 考试年" : i === 6 ? " · N.E.W.T. 考试年" : ""}</option>)}
              </select>
              <p className="hogwarts-label">选择你的心动男主</p>
              <p className="hogwarts-love-note">THE BOYZ · 霍格沃茨平行世界。请选择你想攻略的角色。</p>
              <div className="hogwarts-love-grid" role="group" aria-label="选择攻略男主">
                {loveInterests.map(m => <button key={m.id} type="button" className={`hogwarts-love-card ${loveInterest === m.id ? "selected" : ""}`} aria-pressed={loveInterest === m.id} onClick={() => setLoveInterest(m.id)}>
                  <strong>{m.name}</strong><small>{m.english}</small><small>{houses.find(h => h.id === m.house)?.name}</small>
                </button>)}
              </div>
              {selectedLead && <section className="hogwarts-lead-profile" aria-live="polite">
                <p className="hogwarts-label">人物档案 · {selectedLead.name}</p>
                <p className="hogwarts-love-note">{selectedLead.traits} · {houses.find(h => h.id === selectedLead.house)?.name}</p>
                <blockquote className="hogwarts-lead-quote">“{selectedLead.intro}”</blockquote>
                <p className="hogwarts-love-note">学院气质匹配度（虚构游戏设定）</p>
                {houses.map(h => <div className="hogwarts-affinity" key={h.id}><span>{h.name}</span><meter min={0} max={100} value={selectedLead.affinity[h.id]} /><strong>{selectedLead.affinity[h.id]}%</strong></div>)}
              </section>}
              <button className="hogwarts-enter" type="button" disabled={!name.trim() || !house || !loveInterest} onClick={confirm}>确认身份 · 进入魔法世界 →</button>
              <p className="hogwarts-footnote">你可以自由选择学院。本设定不模拟分院帽测试。</p>
            </div>
          </section>
        ) : (
          <>
            {!isTest && chosen && <button type="button" className="hogwarts-reset" title="重新选择身份" onClick={() => { setIdentity(null); localStorage.removeItem(storageKey); }}>✦ {chosen.name} · {identity?.year}年级 · {loveInterests.find(m => m.id === identity?.loveInterest)?.name} · 更改身份</button>}
            <Phone work={work} />
          </>
        )
      ) : <p role="status">{error || "正在打开手机…"}</p>}
    </main>
  );
}
createRoot(document.getElementById("root")!).render(<StoryPlayer />);
