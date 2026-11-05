import { HogwartsCover } from "./HogwartsCover";
import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { HogwartsDevice } from "./HogwartsDevice";
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
  { id: "jacob", year: 7, name: "裴俊英", english: "JACOB", house: "hufflepuff", traits: "温柔 · 耐心 · 可靠", intro: "如果你找不到路，我可以陪你慢慢走。", affinity: { hufflepuff: 96, gryffindor: 70, ravenclaw: 74, slytherin: 52 } },
  { id: "younghoon", year: 7, name: "金泳勋", english: "YOUNGHOON", house: "ravenclaw", traits: "细腻 · 真诚 · 慢热", intro: "不用急着认识我，我们有整个学期的时间。", affinity: { hufflepuff: 91, ravenclaw: 69, gryffindor: 72, slytherin: 25 } },
  { id: "hyunjae", year: 7, name: "李贤在", english: "HYUNJAE", house: "gryffindor", traits: "爱开玩笑 · 负责 · 坦率", intro: "又见面了。今天有什么新鲜事？", affinity: { slytherin: 54, gryffindor: 91, ravenclaw: 55, hufflepuff: 76 } },
  { id: "juyeon", year: 6, name: "李柱延", english: "JUYEON", house: "slytherin", traits: "沉稳 · 专注 · 行动力", intro: "比起解释自己，我更习惯用行动回答。", affinity: { slytherin: 88, gryffindor: 84, hufflepuff: 69, ravenclaw: 65 } },
  { id: "q", year: 6, name: "池昌民", english: "Q", house: "ravenclaw", traits: "奇思妙想 · 灵动 · 好奇", intro: "你觉得奇怪的东西，说不定正是最有趣的秘密。", affinity: { ravenclaw: 86, gryffindor: 79, hufflepuff: 73, slytherin: 61 } },
  { id: "sunwoo", year: 5, name: "金善旴", english: "SUNWOO", house: "gryffindor", traits: "机敏 · 自信 · 口才", intro: "想赢过我？那你得先猜到我下一步要做什么。", affinity: { slytherin: 95, ravenclaw: 86, gryffindor: 73, hufflepuff: 48 } },
  { id: "eric", year: 5, name: "孙英宰", english: "ERIC", house: "gryffindor", traits: "热情 · 直率 · 勇敢", intro: "要不要一起去冒险？放心，我会跑在你前面！", affinity: { gryffindor: 97, hufflepuff: 83, slytherin: 60, ravenclaw: 56 } },
] as const;
type Identity = { name: string; house: string; year: number; loveInterest: string; avatar?: string; runId?: string };
const storageKey = "foundphone-hogwarts-identity-v1";
function savedIdentity(): Identity | null {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(storageKey) || "null");
    if (!value || typeof value !== "object") return null;
    const data = value as Partial<Identity>;
    if (typeof data.name !== "string" || !data.name.trim() || !houses.some(h => h.id === data.house) || !loveInterests.some(m => m.id === data.loveInterest) || !Number.isInteger(data.year) || (data.year ?? 0) < 5 || (data.year ?? 8) > 7) return null;
    return { name: data.name, house: data.house!, year: data.year!, loveInterest: data.loveInterest!, runId: typeof data.runId === "string" ? data.runId : undefined, avatar: typeof data.avatar === "string" && data.avatar.startsWith("data:image/jpeg;base64,") ? data.avatar : undefined };
  } catch { return null; }
}
async function prepareAvatar(file: File) {
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    const size = Math.min(image.naturalWidth, image.naturalHeight);
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 256;
    const context = canvas.getContext("2d");
    if (!context || !size) throw new Error("Invalid avatar");
    context.fillStyle = "#f6ecd8";
    context.fillRect(0, 0, 256, 256);
    context.drawImage(image, (image.naturalWidth - size) / 2, (image.naturalHeight - size) / 2, size, size, 0, 0, 256, 256);
    return canvas.toDataURL("image/jpeg", 0.86);
  } finally {
    URL.revokeObjectURL(url);
  }
}

function StoryPlayer() {
  const [coverOpened, setCoverOpened] = useState(false);
  const [work, setWork] = useState<Work | null>(null);
  const [error, setError] = useState("");
  const [identity, setIdentity] = useState<Identity | null>(savedIdentity);
  const [avatar, setAvatar] = useState(identity?.avatar);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const [name, setName] = useState(identity?.name || "");
  const [house, setHouse] = useState(identity?.house || "");
  const [year, setYear] = useState(identity?.year || 5);
  const [loveInterest, setLoveInterest] = useState(identity?.loveInterest || "");
  const requirePasscode = false;
  const [unlocked, setUnlocked] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [passcodeError, setPasscodeError] = useState(false);
  const unlockPhone = () => { if (passcode === "1206") { setUnlocked(true); setPasscodeError(false); } else { setPasscodeError(true); setPasscode(""); } };
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
        document.title = w.title + " · Hogwarts Unspoken";
        setWork(w);
      })
      .catch((e) => { if (e.name !== "AbortError") setError(String(e)); });
    return () => abort.abort();
  }, []);
  const isTest = new URLSearchParams(location.search).get("preview") === "test" || new URLSearchParams(location.search).get("template") === "blank";
  const chosen = houses.find(h => h.id === identity?.house);
  const selectedLead = loveInterests.find(m => m.id === loveInterest);
  const restart = () => {
    if (!window.confirm("重新开始？本轮进度会结束，你将返回开局登记。")) return;
    localStorage.removeItem(storageKey);
    setCoverOpened(false);
    setIdentity(null);
    setName("");
    setHouse("");
    setYear(5);
    setLoveInterest("");
    setAvatar(undefined);
    setAvatarError("");
    setUnlocked(false);
    setPasscode("");
  };
  const confirm = () => {
    if (!name.trim() || !house || !loveInterest || avatarBusy) return;
    const next = { name: name.trim().slice(0, 40), house, year, loveInterest, avatar, runId: crypto.randomUUID() };
    try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch { setAvatarError("无法保存资料，请检查浏览器储存空间后重试。"); return; }
    setIdentity(next);
  };
  return (
    <main className="story-runtime">
      {!isTest && !coverOpened && !error ? <HogwartsCover onEnter={() => setCoverOpened(true)} /> : work ? (
        !isTest && !identity ? (
          <section className="hogwarts-entry" aria-label="霍格沃茨入学登记">
            <div className="hogwarts-form">
              <div className="hogwarts-crest">✧ H ✧</div>
              <p className="hogwarts-eyebrow">HOGWARTS SCHOOL OF WITCHCRAFT AND WIZARDRY</p>
              <h1>霍格沃茨入学登记</h1>
              <p className="hogwarts-intro">欢迎来到霍格沃茨高年级篇。选择五至七年级，只体验所选的一个学年。</p>
              <div className="hogwarts-avatar-picker">
                <label className="hogwarts-avatar-trigger" htmlFor="wizard-avatar">
                  {avatar ? <img src={avatar} alt="头像预览" /> : <span aria-hidden="true">＋</span>}
                  <span className="hogwarts-avatar-accessible">从相册选择玩家头像（可选）</span>
                </label>
                <input className="hogwarts-avatar-accessible" id="wizard-avatar" type="file" accept="image/*" disabled={avatarBusy} onChange={async event => {
                  const file = event.currentTarget.files?.[0];
                  event.currentTarget.value = "";
                  if (!file) return;
                  setAvatarBusy(true);
                  setAvatarError("");
                  try { setAvatar(await prepareAvatar(file)); }
                  catch { setAvatarError("这张照片打不开，请换一张照片试试。"); }
                  finally { setAvatarBusy(false); }
                }} />
                {avatarBusy && <p role="status">正在处理照片…</p>}
                {avatar && <button type="button" disabled={avatarBusy} onClick={() => { setAvatar(undefined); setAvatarError(""); }}>移除头像</button>}
                {avatarError && <p role="alert">{avatarError}</p>}
              </div>
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
                {[5, 6, 7].map(y => <option key={y} value={y}>{y} 年级{y === 5 ? " · O.W.L. 考试年" : y === 7 ? " · N.E.W.T. 考试年" : ""}</option>)}
              </select>
              <p className="hogwarts-label">选择你的心动男主</p>
              <p className="hogwarts-love-note">THE BOYZ · 霍格沃茨平行世界。请选择你想攻略的角色。</p>
              <div className="hogwarts-love-grid" role="group" aria-label="选择攻略男主">
                {loveInterests.map(m => <button key={m.id} type="button" className={`hogwarts-love-card ${loveInterest === m.id ? "selected" : ""}`} aria-pressed={loveInterest === m.id} onClick={() => setLoveInterest(m.id)}>
                  <img className="hogwarts-lead-avatar" src={`./portraits/${m.id}.webp`} alt="" /><strong>{m.name}</strong><small>{m.english}</small><small>{houses.find(h => h.id === m.house)?.name} · {m.year}年级</small>
                </button>)}
              </div>
              {selectedLead && <section className="hogwarts-lead-profile" aria-live="polite">
                <p className="hogwarts-label">人物档案 · {selectedLead.name}</p>
                <p className="hogwarts-love-note">{selectedLead.traits} · {houses.find(h => h.id === selectedLead.house)?.name} · {selectedLead.year}年级</p>
                <blockquote className="hogwarts-lead-quote">“{selectedLead.intro}”</blockquote>
                <p className="hogwarts-love-note">学院气质匹配度（虚构游戏设定）</p>
                {houses.map(h => <div className="hogwarts-affinity" key={h.id}><span>{h.name}</span><meter min={0} max={100} value={selectedLead.affinity[h.id]} /><strong>{selectedLead.affinity[h.id]}%</strong></div>)}
              </section>}
              <button className="hogwarts-enter" type="button" disabled={!name.trim() || !house || !loveInterest || avatarBusy} onClick={confirm}>确认身份 · 进入魔法世界 →</button>
              <p className="hogwarts-footnote">你可以自由选择学院。本设定不模拟分院帽测试。</p>
            </div>
          </section>
        ) : !isTest && requirePasscode && !unlocked ? (
          <section className="hogwarts-entry" aria-label="魔法卷宗封印">
            <form className="hogwarts-form" onSubmit={e => { e.preventDefault(); unlockPhone(); }}>
              <div className="hogwarts-crest">✧ H ✧</div>
              <p className="hogwarts-eyebrow">ENCHANTED FOLIO · SEALED</p>
              <h1>解开卷宗封印</h1>
              <p className="hogwarts-intro">欢迎回来，{identity?.name}。输入四位封印符文，打开你的魔法卷宗。</p>
              <label className="hogwarts-label" htmlFor="magical-passcode">四位封印符文</label>
              <input id="magical-passcode" className="hogwarts-input" type="password" inputMode="numeric" pattern="[0-9]{4}" maxLength={4} autoComplete="off" value={passcode} onChange={e => { setPasscode(e.target.value.replace(/\D/g, "").slice(0, 4)); setPasscodeError(false); }} placeholder="••••" required />
              {passcodeError && <p role="alert" className="hogwarts-love-note">密码不正确，请重试。</p>}
              <button className="hogwarts-enter" type="submit" disabled={passcode.length !== 4}>解开封印 →</button>
              <button className="hogwarts-enter" type="button" onClick={() => { setIdentity(null); setPasscode(""); localStorage.removeItem(storageKey); }}>返回身份登记</button>
            </form>
          </section>
        ) : (
          <>
            {!isTest && chosen && identity && <details className="hogwarts-reset hogwarts-player-menu">
              <summary>{chosen.name} {identity.year}年级 {identity.name}</summary>
              <button type="button" onClick={restart}>重新开始</button>
            </details>}
            <HogwartsDevice key={identity?.runId} work={work} identity={identity} contacts={loveInterests} onRestart={restart} />
          </>
        )
      ) : <p role="status">{error || "正在打开手机…"}</p>}
    </main>
  );
}
createRoot(document.getElementById("root")!).render(<StoryPlayer />);
