import { Fragment, useState } from "react";
import { BookOpen, Feather, Images, ScrollText } from "lucide-react";
import story from "../../stories/q/day01.json";
import { SceneDialogue } from "./SceneDialogue";
import { dailyLessons, HogwartsSchedule } from "./HogwartsSchedule";
import { HogwartsCharacters } from "./HogwartsCharacters";
import { MaraudersMap } from "./MaraudersMap";
import "./HogwartsDevice.css";

type Identity = { name: string; house: string; year: number; avatar?: string; runId?: string };
type Progress = { choice: number | null; finished: boolean; mailRead: number };
const empty: Progress = { choice: null, finished: false, mailRead: 0 };
function restore(key: string): Progress {
  try {
    const saved = JSON.parse(localStorage.getItem(key) ?? "null");
    if (saved && [0, 1].includes(saved.choice) && saved.finished === true) {
      return { choice: saved.choice, finished: true, mailRead: Math.max(0, Math.min(Number(saved.mailRead) || 0, story.mail.length)) };
    }
  } catch { /* Start a new first day when browser storage is unavailable. */ }
  return empty;
}

export function QDayOne({ identity }: { identity: Identity }) {
  const storageKey = `foundphone-q-day01-${identity.runId ?? [identity.name, identity.house, identity.year].join("-")}`;
  const [progress, setProgress] = useState(() => restore(storageKey));
  const [active, setActive] = useState("calendar");
  const [sceneOpen, setSceneOpen] = useState(false);
  const [choice, setChoice] = useState<number | null>(null);
  const [attended, setAttended] = useState<Record<string, boolean>>(() => progress.finished
    ? Object.fromEntries(dailyLessons(identity.year, identity.house, 1).map(lesson => [[1, lesson.time, lesson.subject].join("-"), true])) : {});
  const [time, setTime] = useState(progress.finished ? "20:00" : "09:00");
  const [saveError, setSaveError] = useState("");
  function save(next: Progress) {
    setProgress(next);
    try { localStorage.setItem(storageKey, JSON.stringify(next)); }
    catch { setSaveError("这次进度没能保存在浏览器中，刷新后可能需要重新阅读。"); }
  }
  function message(speaker: string, text: string) {
    const outgoing = speaker === "你";
    return <div className={`hogwarts-message ${outgoing ? "outgoing" : ""}`}>
      <span className="hogwarts-avatar" aria-hidden="true">
        {outgoing ? identity.avatar ? <img src={identity.avatar} alt="" /> : identity.name.slice(-1) : <img src="./portraits/q.webp" alt="" />}
      </span>
      <div><strong>{outgoing ? identity.name : speaker}</strong><p>{text}</p></div>
    </div>;
  }
  function line(text: string) {
    const spoken = text.match(/^(池昌民|你)：(.+)$/);
    return spoken ? message(spoken[1], spoken[2]) : <p className="hogwarts-narration">{text}</p>;
  }
  const lines = [...story.opening, ...(choice === null ? [] : story.choices[choice].lines)];
  const mail = story.mail.slice(0, progress.mailRead);
  const nextMail = story.mail[progress.mailRead];
  const classesDone = dailyLessons(identity.year, identity.house, 1).every(lesson => attended[[1, lesson.time, lesson.subject].join("-")]);
  function meet() { setChoice(null); setTime("17:00"); setSceneOpen(true); }
  return <div className="hogwarts-device-stage"><div className="hogwarts-device" aria-label="Hogwarts Unspoken · 池昌民">
    <div className="hogwarts-device-top"><span>12月1日 周二 <strong>D1/31</strong></span><span>{time}</span></div>
    <header className="hogwarts-device-header"><div className="hogwarts-device-seal">H</div>
      <div><small>HOGWARTS STUDENT</small><h1>Hogwarts Unspoken</h1><p>2026年12月1日</p></div>
    </header>
    <main className="hogwarts-device-page">
      {active === "calendar" && <section>
        <HogwartsSchedule year={identity.year} house={identity.house} day={1} attended={attended}
          onAttend={(id, value) => { setAttended(previous => ({ ...previous, [id]: true })); setTime(value); }}
          sceneLabel={progress.finished ? "重看图书馆的相遇" : "傍晚 · 去图书馆"}
          onScene={meet} />
        <button className="hogwarts-activity" onClick={() => setActive("maraudersmap")}>查看活点地图</button>
        {progress.finished && <button className="hogwarts-activity" onClick={() => { setTime("20:00"); setActive("owlpost"); }}>晚上 · 查看池昌民的来信</button>}
        {progress.mailRead === story.mail.length && <p role="status">第一天已完成，后续剧情待续。</p>}
        <button className="hogwarts-activity" onClick={() => setActive("schoolbook")}>查看校园手册</button>
      </section>}
      {active === "schoolbook" && <HogwartsCharacters year={identity.year} house={identity.house} variables={{}} />}
      {active === "maraudersmap" && <>
        <MaraudersMap day={1} time={time} selectedId="q"
          onEncounter={classesDone && time === "17:00" ? meet : undefined} />
        {classesDone && !progress.finished && time !== "17:00" && <button className="hogwarts-activity" onClick={() => setTime("17:00")}>等到傍晚 · 去图书馆</button>}
      </>}
      {active === "owlpost" && <section className="hogwarts-device-letters">
        <h2>池昌民的猫头鹰来信</h2>
        {!progress.finished ? <p>还没有新的来信。</p> : <>
          {mail.map((entry, index) => <Fragment key={index}>{message(entry.speaker, entry.text)}</Fragment>)}
          {nextMail && <button className="hogwarts-activity" onClick={() => save({ ...progress, mailRead: progress.mailRead + 1 })}>
            {nextMail.speaker === "你" ? nextMail.text : progress.mailRead === 0 ? "拆开来信" : progress.mailRead === story.mail.length - 1 ? "稍后，又来了一封" : "继续读信"}
          </button>}
        </>}
      </section>}
      {active === "wizardjournal" && <section><h2>巫师手札</h2><p>12月1日 · 图书馆</p><p>{progress.finished ? "那只黄铜甲虫最后还是盯上了我的羽毛笔。" : "今天的经历还没有写下。"}</p></section>}
      {active === "magicphotos" && <section><h2>魔法相册</h2><p>还没有解锁新的线索。</p></section>}
      {saveError && <p role="alert">{saveError}</p>}
    </main>
    {sceneOpen && <dialog ref={element => { if (element && !element.open) element.showModal(); }}
      onCancel={event => event.preventDefault()} className="hogwarts-scene" aria-labelledby="q-scene-title">
      <h2 id="q-scene-title">池昌民 <small>· Q</small></h2>
      <SceneDialogue>
        {lines.map((text, index) => <Fragment key={index}>{line(text)}</Fragment>)}
        {choice === null ? <div className="hogwarts-device-choices">
          {story.choices.map((option, index) => <button key={option.label} onClick={() => setChoice(index)}>{option.label}</button>)}
        </div> : <button className="hogwarts-continue-day" onClick={() => {
          save({ choice, finished: true, mailRead: progress.mailRead }); setSceneOpen(false); setTime("18:00");
        }}>离开图书馆</button>}
      </SceneDialogue>
    </dialog>}
    <nav className="hogwarts-dock" aria-label="学生手机应用">
      {[{ id: "magicphotos", name: "魔法相册", Icon: Images }, { id: "owlpost", name: "猫头鹰信箱", Icon: Feather },
        { id: "wizardjournal", name: "巫师手札", Icon: ScrollText }, { id: "calendar", name: "今日行程", Icon: BookOpen }].map(({ id, name, Icon }) =>
        <button key={id} aria-pressed={active === id} onClick={() => setActive(active === id ? "calendar" : id)}><span><Icon size={19} /></span>{name}</button>)}
    </nav>
  </div></div>;
}
