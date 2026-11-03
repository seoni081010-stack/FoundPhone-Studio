import dateOptions from "../../stories/template/hogwarts-dates.json";
import { HogwartsCharacters } from "./HogwartsCharacters";
import { HogwartsSchedule } from "./HogwartsSchedule";
import { MagicalShops, useWeeklyAllowance } from "./MagicalShops";
import { useMemo, useState } from "react";
import { BookOpen, Feather, ScrollText, Map, Images, Heart, ArrowLeft } from "lucide-react";
import { initialRuntime, type Runtime, type Work } from "../schema";
import { dispatch, choose } from "../engine";
import "./HogwartsDevice.css";

const modules = [
  { id: "owlpost", name: "猫头鹰信箱", subtitle: "书信与便笺", Icon: Feather },
  { id: "schoolbook", name: "校园手册", subtitle: "课程与活动", Icon: BookOpen },
  { id: "wizardjournal", name: "巫师手札", subtitle: "私密记录", Icon: ScrollText },
  { id: "magicphotos", name: "魔法相册", subtitle: "会动的回忆", Icon: Images },
  { id: "maraudersmap", name: "活点地图", subtitle: "城堡探索", Icon: Map },
  { id: "calendar", name: "今日行程", subtitle: "课程与活动", Icon: BookOpen },
  { id: "date", name: "Date", subtitle: "周末约会", Icon: Heart },
  { id: "market", name: "魔法商店与古灵阁", subtitle: "购物与金库", Icon: Heart },
] as const;
const hyunjaeDates: Record<string, { reply: string; scene: string[] }> = {
  puddifoot: { reply: "好啊。先说好，你点的蛋糕要分我一口。", scene: ["他把蛋糕推到桌子正中，自己先拿起叉子。", "你不是说分我一口？我这才第一口。", "你那一口怎么切了半块？", "……那剩下半块都归你。"] },
  "three-broomsticks": { reply: "去啊。你先到的话，帮我留个靠窗的位置。", scene: ["他端着两杯黄油啤酒回来，在你对面坐下。", "我刚才差点把这杯端给隔壁桌。", "那你怎么认出我的？", "你从我站起来就一直盯着这杯。"] },
  "hogs-head": { reply: "好。那里安静，你上次没讲完的事可以接着讲了。", scene: ["角落里只剩一张小桌，他把椅子往你这边拖了一点。", "行了，刚才说到哪儿了？", "你真记得我没讲完？", "记得。你每次讲到最好笑的地方就被人打断。"] },
  "diagon-alley-walk": { reply: "可以。丽痕书店见，你要是先到，别一个人把整间店逛完。", scene: ["你从书架上抽出一本书，发现他正从另一侧看着同一本。", "你也想看这个？", "我只是想看看你挑了什么。", "那一起翻吧。你翻慢一点，我还没看完这一页。"] },
  "leaky-cauldron": { reply: "好啊，正好我饿了。你想吃什么？我可以先帮你占座。", scene: ["他朝你招手，把菜单转到你面前。", "我看了半天，最后决定等你来选。", "你就这么信我的口味？", "嗯。选错了我也能帮你吃一半。"] },
  "florean-fortescue": { reply: "好！你挑一个口味，我挑一个，先别告诉我你选什么。", scene: ["两份冰淇淋端上来，居然是同一个口味。你们对视了一眼。", "等一下，你是不是偷听我点单了？", "明明是我先点的。", "那没办法了。下次再来一次，看看还会不会撞。"] },
};
const hyunjaeDeclines = [
  "对不起啊，变形术的练习还没补完。我答应教授今天交，下次我早点留时间。",
  "今天可能去不了了，抱歉。格兰芬多那边临时要我换一轮巡查，等我忙完再找你。",
  "抱歉，我和同学约了整理魔咒学笔记，他还在等我。下次你再叫我，好不好？",
];
type Props = { work: Work; contacts: readonly { id: string; name: string; house: string; year: number }[]; identity?: { name: string; house: string; year: number; loveInterest: string } | null };
export function HogwartsDevice({ work: original, identity, contacts }: Props) {
  const work = useMemo(() => {
    const boundaries = original.nodes.filter(node => node.actions.some(action =>
      action.type === "date" && /^2026-12-(?!01$)\d{2}$/.test(String(action.value))));
    const gate = (id: string) => "end-day:" + id;
    const ids = new Set(boundaries.map(node => node.id));
    return {
      ...original,
      nodes: [
        ...original.nodes.map(node => ({ ...node, next: node.next.map(id => ids.has(id) ? gate(id) : id) })),
        ...boundaries.map(node => ({ ...node, id: gate(node.id), type: "choice" as const,
          actions: [], conditions: [], next: [node.id] })),
      ],
    };
  }, [original]);
  const [state, setState] = useState<Runtime>(() => { const initial = initialRuntime(work); initial.variables.hyunjae_player_house = identity?.house ?? "unspecified"; initial.variables.hyunjae_player_year = identity?.year ?? 5; return dispatch(work, initial, "start"); });
  const [active, setActive] = useState("calendar");
  const [clueOpen, setClueOpen] = useState(false);
  const [sceneOpen, setSceneOpen] = useState(false);
  const [seenScene, setSeenScene] = useState("");
  const entries = (state.messages.owlpost ?? []).filter(item => !item.hidden);
  const date = new Date((state.date || "2026-12-01") + "T12:00:00Z");
  const day = date.getUTCDate();
  const availableDateDays = Array.from({ length: 32 - day }, (_, offset) => day + offset)
    .filter(value => value >= 22 || dateOptions.dateDays.includes(new Date(Date.UTC(2026, 11, value)).getUTCDay()));

  const nextDay = state.choices.find(choice =>
    work.nodes.find(node => node.id === choice.target)?.actions.some(action =>
      action.type === "date" && String(action.value) > (state.date || "")));
  const [startTime] = useState(() => new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", hour12: false }));
  const [lessonTime, setLessonTime] = useState<string>();
  const [region, setRegion] = useState<number>();
  const [recipient, setRecipient] = useState("");
  const [giftReplies, setGiftReplies] = useState<string[]>([]);
  const [dateReplies, setDateReplies] = useState<string[]>([]);
  const [dateReply, setDateReply] = useState("");
  const [outing, setOuting] = useState(false);
  const [dateContact, setDateContact] = useState("");
  const [dateDay, setDateDay] = useState(0);
  const [attendedDates, setAttendedDates] = useState<number[]>([]);
  const [dateVenue, setDateVenue] = useState("");
  const [destination, setDestination] = useState("");
  const [plans, setPlans] = useState<Record<number, string>>({});
  const [acceptedVenues, setAcceptedVenues] = useState<Record<number, string>>({});
  const [draft, setDraft] = useState("");
  const [sent, setSent] = useState<Record<string, string[]>>({});
  const highlightMistletoe = (text: string) => text.split(/(槲寄生)/).map((word, index) =>
    word === "槲寄生" ? <strong key={index}>{word}</strong> : word);
  const note = (name: string, body: string, outgoing: boolean, key?: number) =>
    <div key={key} className={`hogwarts-message ${outgoing ? "outgoing" : ""}`}>
      <span className="hogwarts-avatar" aria-hidden="true">{name.slice(-1)}</span>
      <div><strong>{name}</strong><p>{body}</p></div>
    </div>;
  const [finished, setFinished] = useState(false);
  const [attended, setAttended] = useState<Record<string, boolean>>({});
  const lead = contacts.find(contact => contact.id === identity?.loveInterest);
  const sameHouse = lead?.house === identity?.house;
  const sameYear = lead?.year === identity?.year;
  const journalIntro = sameHouse
    ? sameYear ? "你们平时一起上课，偶尔会聊几句作业。老师说下节课要换教室时，你还问过他该往哪边走。"
      : "你常在公共休息室看见他。偶尔有人问壁炉旁还有没有空位，你们会搭上一两句话。"
    : sameYear ? "你知道他和你同年级。有时两院的课排在一起，你会在教室里见到他。"
      : "你见过他几次。大多是在门厅或楼梯上，擦肩就过去了。";
  const identityKey = identity ? [identity.name, identity.house, identity.year].join("-") : "";
  useWeeklyAllowance(identityKey, day);
  // The authored route stores both channels in owlpost. Keep the original text
  // and mark which opening scenes are delivered by owl.
  const owlDays = [2, 5, 6, 13, 15, 17, 19, 20, 30];
  const owlToday = owlDays.includes(day);
  let entryDay = 1;
  const conversation = entries.map(entry => {
    const heading = entry.body.match(/^12月(\d+)日｜/);
    if (heading) entryDay = Number(heading[1]);
    return { ...entry, day: entryDay, body: entry.body.replace(/^12月\d+日｜/, "") };
  });
  const isNote = (body: string) =>
    /^(李贤在|你)[：:]/.test(body) &&
    !/你们一起去了大礼堂|李贤在先问|他笑了一下|停了一下，他又说/.test(body);
  const letters = conversation.filter(entry => owlDays.includes(entry.day) && isNote(entry.body));
  const soloSnow = day === 7 && !state.variables.hyunjae_first_snow_together;
  const scenes = conversation.filter(entry => entry.day === day && (!owlToday || !isNote(entry.body)))
    .map((entry, index) => soloSnow && index === 0 ? { ...entry, body: "走廊里。李贤在：你昨天后来去哪儿走了？我回去的时候，鞋里都是雪。" } : entry);
  const chosen = modules.find(m => m.id === active) ?? modules[0];
  const choices = !nextDay && state.choices.length > 0 ? <div className="hogwarts-device-choices">

    {state.choices.filter((_, index) => !soloSnow || index === 1).map(choice => <button key={choice.target} onClick={() => select(choice.target)}>{choice.label}</button>)}
  </div> : null;
  const select = (target: string) => {
    const next = choose(work, state, target);
    setState(next);
    if (owlToday && next.date === state.date && (next.messages.owlpost ?? []).slice((state.messages.owlpost ?? []).length).some(entry => !isNote(entry.body))) {
      setSceneOpen(true);
    }
  };
  return <div className="hogwarts-device-stage">
    <div className="hogwarts-device" aria-label="Hogwarts Unspoken">
      <div className="hogwarts-device-top"><span>12月{day}日 {new Intl.DateTimeFormat("zh-CN", { weekday: "short", timeZone: "UTC" }).format(date)} <strong>D{day}/31</strong></span><span>{lessonTime ?? startTime}</span></div>
      <header className="hogwarts-device-header">
        <div className="hogwarts-device-seal">H</div>
        <div><small>HOGWARTS STUDENT</small><h1>Hogwarts Unspoken</h1><p><time dateTime={state.date || "2026-12-01"}>2026年12月{day}日</time></p></div>
      </header>
      <main className={active === "calendar" ? "hogwarts-device-page hogwarts-today" : "hogwarts-device-page"}>
        {active !== "calendar" && <button className="hogwarts-device-back" onClick={() => setActive("calendar")}><ArrowLeft size={17}/> 今日行程</button>}
        <h2>{active === "calendar" ? <><small>TODAY</small> 今日行程 <time className="hogwarts-agenda-date" dateTime={state.date || "2026-12-01"}>12月{day}日 {new Intl.DateTimeFormat("zh-CN", { weekday: "short", timeZone: "UTC" }).format(date)}</time></> : active === "owlpost" && !recipient ? <>消息 <small>MESSAGES</small></> : chosen.name}{active === "owlpost" && !recipient && <button className="hogwarts-shop-link" onClick={() => setActive("market")}>魔法商店 · 猫头鹰送礼</button>}</h2>
        {active === "owlpost" ? <section className="hogwarts-device-letters">
          {!recipient ? <>
            {contacts.map(contact => <button className="hogwarts-contact" key={contact.id} onClick={() => setRecipient(contact.id)}>
              <span className="hogwarts-avatar" aria-hidden="true" />
              <span className="hogwarts-contact-copy"><strong>{contact.name}</strong><small>{
                (sent[contact.id] ?? []).slice(-1)[0] ||
                (contact.id === "hyunjae" ? letters.slice(-1)[0]?.body.split(/(?:李贤在|你)[：:]/).pop() : "") ||
                "还没有消息"
              }</small></span>
            </button>)}
          </> : <>
          <button onClick={() => { setRecipient(""); setDraft(""); }}>返回会话列表</button>
          <h3>{contacts.find(contact => contact.id === recipient)?.name}</h3>
          {letters.length === 0 && <p>暂时没有新的猫头鹰纸条。</p>}
          {recipient === "hyunjae" && letters.map(letter => <div key={letter.id} className="hogwarts-note-thread">
            <small>12月{letter.day}日</small>
            {letter.body.split(/(?<=[；;。！？?！]|\s)(?=(?:李贤在|你)[：:])/).map((line, index) =>
              note(/^你[：:]/.test(line) ? identity?.name ?? "我" : "李贤在", line.replace(/^(李贤在|你)[：:]/, "").replace(/[；;]$/, ""), /^你[：:]/.test(line), index))}
          </div>)}
          {recipient === "hyunjae" && owlToday && choices}
          {(sent[recipient] ?? []).map((body, index) => note(identity?.name ?? "我", body, true, index))}
          {recipient === "hyunjae" && dateReplies.map((reply, index) => note("李贤在", reply, false, index))}
          {recipient === "hyunjae" && giftReplies.map((reply, index) => note("李贤在", reply, false, index))}
          <form onSubmit={event => {
            event.preventDefault();
            if (!draft.trim()) return;
            setSent(previous => ({ ...previous, [recipient]: [...(previous[recipient] ?? []), draft.trim()] }));
            setDraft("");
          }}>
            <input aria-label="纸条内容" value={draft} onChange={event => setDraft(event.target.value)} maxLength={300} />
            <button disabled={!draft.trim()}>寄出纸条</button>
          </form>
          </>}
        </section> : active === "calendar" && identity ? <section>
          <HogwartsSchedule year={identity.year} house={identity.house} day={day} interaction={owlToday ? "猫头鹰信箱" : undefined}
            sceneLabel={{3: "晚上下楼", 4: "去图书馆", 12: "去看魁地奇比赛"}[day]}
            onScene={!owlToday && scenes.length > 0 && !nextDay ? () => setSceneOpen(true) : undefined}
            attended={attended} onAttend={(id, time, last) => {
              setAttended(previous => ({ ...previous, [id]: true }));
              setLessonTime(time);
              if (last && day !== 3 && day !== 4 && !owlToday && scenes.length > 0 && !nextDay) setSceneOpen(true);
            }}
            onEnd={nextDay && (!scenes.length || seenScene === scenes[scenes.length - 1]?.id) ? () => { select(nextDay.target); setLessonTime(undefined); setDestination(""); if (day === 6 && state.variables.hyunjae_first_snow_together) setClueOpen(true); } : day === 31 && state.endings.length && !finished ? () => setFinished(true) : undefined} />
          {owlToday && !nextDay && <button onClick={() => { setRecipient("hyunjae"); setActive("owlpost"); }}>{day === 6 ? "查看李贤在的新纸条" : "打开猫头鹰信箱"}</button>}
          {day >= 22 && <section aria-label="假期自由活动">
            <h3>自由活动</h3>
            {["公共区域", "温室", "城堡外散步", "对角巷", "霍格莫德镇"].map(place =>
              <button type="button" key={place} aria-pressed={destination === place} onClick={() => setDestination(place)}>{place}</button>)}
            {destination && <p role="status">你现在在：{destination}</p>}
          </section>}
          {plans[day] && <p>今日约会：{plans[day]} <button className="hogwarts-activity" disabled={attendedDates.includes(day)} onClick={() => setOuting(true)}>{attendedDates.includes(day) ? "已赴约" : "去赴约"}</button></p>}
          {finished && <p role="status">十二月已结束。</p>}
        </section> : active === "date" ? <section className="hogwarts-date">
          <p>周末与假期约会</p>
          <label>约谁见面 <select value={dateContact} onChange={event => setDateContact(event.target.value)}>
            <option value="">选择一位朋友</option>
            {contacts.filter(contact => contact.id === identity?.loveInterest).map(contact => <option key={contact.id} value={contact.id}>{contact.name}</option>)}
          </select></label>
          <p><label>约会日期 <select value={availableDateDays.includes(dateDay) ? dateDay : 0} onChange={event => setDateDay(Number(event.target.value))}>
            <option value={0}>选择日期</option>
            {availableDateDays.map(value => <option key={value} value={value} disabled={Boolean(plans[value])}>12月{value}日</option>)}
          </select></label></p>
          <p><label>去哪里 <select value={dateVenue} onChange={event => setDateVenue(event.target.value)}>
            <option value="">选择地点</option>
            {dateOptions.venues.map(venue => <option key={venue.id} value={venue.id}
>
              {venue.name}（{venue.region}）
            </option>)}
          </select></label></p>
          <button className="hogwarts-send-invite" disabled={dateContact !== "hyunjae" || !hyunjaeDates[dateVenue] || Boolean(plans[dateDay]) || !availableDateDays.includes(dateDay)}
            onClick={() => {
              const accepted = identity?.loveInterest === "hyunjae" && Number(state.variables.hyunjae_affection ?? 0) > 45;
              const reply = accepted ? hyunjaeDates[dateVenue].reply : hyunjaeDeclines[(day - 1) % hyunjaeDeclines.length];
              const venue = dateOptions.venues.find(item => item.id === dateVenue);
              if (accepted) {
                setPlans(previous => ({ ...previous, [dateDay]: "李贤在 · " + venue?.name }));
                setAcceptedVenues(previous => ({ ...previous, [dateDay]: dateVenue }));
              }
              setSent(previous => ({ ...previous, hyunjae: [...(previous.hyunjae ?? []), "邀约：12月" + dateDay + "日 · " + venue?.name] }));
              setDateReplies(previous => [...previous, reply]);
              setDateReply(reply);
            }}>发送邀请</button>
          {dateContact && dateContact !== "hyunjae" && <p>这位角色的邀约剧情还在准备中。</p>}
          <p className="hogwarts-date-hint">每天都能发邀请，赴约日期可选周末或12月22日起的假期。</p>
          {Object.entries(plans).filter(([value]) => Number(value) >= day).map(([value, plan]) => <p key={value}>12月{value}日 · {plan}</p>)}
        </section> : active === "market" && identity ? <MagicalShops identityKey={identityKey} leadId={identity.loveInterest} contacts={contacts} onGift={(recipient, item, liked) => {
            const affection = Number(state.variables.hyunjae_affection ?? 0);
            if (recipient === identity.loveInterest && recipient === "hyunjae") {
              const reply = /围巾|手套|毛衣|厚袜|保暖帽/.test(item)
                ? `收到你的${item}了。明天巡查我就用上。你要是碰见我，记得看一眼。`
                : /羽毛笔|墨水|书签|羊皮/.test(item)
                  ? `你寄的${item}我收到了。刚才拿它写了两行巡查记录，第三行写的就是这张回信。`
                  : /糖|巧克力|蛋糕|馅饼|多味豆/.test(item)
                    ? `收到${item}了！我先尝一口。要是又苦得皱脸，这次你可看不见ㅋㅋ`
                    : `你挑的${item}我收到了。我刚放到床头了。明天见面记得问我喜不喜欢，我想当面告诉你。`;
              setGiftReplies(previous => [...previous, reply]);
              setState(previous => ({ ...previous, variables: { ...previous.variables, hyunjae_affection: Math.min(100, affection + (liked ? 5 : 2)) } }));
            } else if (recipient !== identity.loveInterest) {
              const key = "friendship_" + recipient;
              setState(previous => ({ ...previous, variables: { ...previous.variables, [key]: Math.min(100, Number(previous.variables[key] ?? 0) + (liked ? 5 : 2)) } }));
              if (identity.loveInterest === "hyunjae" && affection > 40) {
                const name = contacts.find(contact => contact.id === recipient)?.name;
                setGiftReplies(previous => [...previous, affection >= 70
                  ? `你给${name}寄了${item}啊。我刚才还想装作只是路过问一下。算了，有一点吃醋。`
                  : `${name}刚才给我看了你送的${item}。我就是问问……下次你去挑礼物，叫我一声呗。`]);
              }
            }
          }} />
          : active === "wizardjournal" && identity ? <section>
            {(work.data.wizardjournal ?? []).map(item => <p key={item.id}>{item.id === "journal-route" ? journalIntro : item.body}</p>)}
            <HogwartsCharacters year={identity.year} house={identity.house} identityKey={identityKey} />
            <button onClick={() => setActive("maraudersmap")}>打开活点地图</button>
          </section>
          : active === "maraudersmap" ? <section className="hogwarts-map" aria-label="霍格沃茨城堡示意图">
            {[
              ["城堡高层", "天文塔、图书馆、黑魔法防御术教室、魔咒学教室、魔法史教室、古代如尼文教室、算术占卜教室、占卜学教室、麻瓜研究教室"],
              ["城堡主层", "门厅、大礼堂、长廊、变形术教室"],
              ["城堡地窖", "魔药学教室"],
              ["城堡外侧", "庭院、拱门、草药学温室、魁地奇球场、保护神奇生物课场地、禁林边缘"],
            ].map(([area, places], index) => <div key={area}>
              <button aria-expanded={region === index} onClick={() => setRegion(region === index ? undefined : index)}>{area}</button>
              {region === index && <svg viewBox="0 0 340 330" role="img" aria-label={area + "地图"} className="hogwarts-floorplan">
                <path d="M170 32V298 M35 165H305" stroke="#8a6545" strokeWidth="12" fill="none" />
                {places.split("、").map((place, position) => {
                  const x = position % 2 ? 182 : 10;
                  const y = 12 + Math.floor(position / 2) * 62;
                  const marked = scenes.some(scene => scene.id === seenScene && scene.body.includes(place));
                  return <g key={place}>
                    {place === "魁地奇球场" ? <ellipse cx={x + 74} cy={y + 24} rx="74" ry="24" /> : <rect x={x} y={y} width="148" height="48" rx="5" />}
                    <text x={x + 74} y={y + 28} textAnchor="middle">{place}{marked ? " 👣" : ""}</text>
                  </g>;
                })}
              </svg>}
            </div>)}
          </section> : <section className="hogwarts-device-letters">{(work.data[active] ?? []).filter(item => active !== "magicphotos" || (item.title === "庭院初雪" ? day > 6 && state.variables.hyunjae_first_snow_together === true : day > 24)).map(item => item.title === "庭院初雪" ? <details className="hogwarts-device-letter" key={item.id}><summary>{item.title}</summary><p>{highlightMistletoe("初雪落在庭院里，他伸手接住两片雪，抬头望向石拱门边的槲寄生。")}</p></details> : <article className="hogwarts-device-letter" key={item.id}><strong>{item.title}</strong><p>{item.body}</p></article>)}{!(work.data[active] ?? []).length && <p>这页羊皮纸还没有写下新的内容。</p>}</section>}
      </main>
      {(dateReply || outing) && <dialog ref={element => { if (element && !element.open) element.showModal(); }}
        onClose={() => { setDateReply(""); setOuting(false); }} className="hogwarts-scene">
        <h2>{outing ? plans[day] : "李贤在的猫头鹰回信"}</h2>
        {outing ? hyunjaeDates[acceptedVenues[day]]?.scene.map((line, index) => index === 0
          ? <p key={index} className="hogwarts-narration">{line}</p>
          : note(index === 2 ? identity?.name ?? "我" : "李贤在", line, index === 2, index))
          : note("李贤在", dateReply, false)}
        <button onClick={() => { if (outing) setAttendedDates(previous => [...previous, day]); setDateReply(""); setOuting(false); }}>{outing ? "完成赴约" : "返回"}</button>
      </dialog>}
      {clueOpen && <dialog ref={element => { if (element && !element.open) element.showModal(); }} onClose={() => setClueOpen(false)} className="hogwarts-scene hogwarts-clue">
        <h2>你已解锁一条线索</h2><p>在魔法相册中查看「庭院初雪」。</p>
        <button onClick={() => setClueOpen(false)}>继续</button>
      </dialog>}
      {sceneOpen && <dialog ref={element => { if (element && !element.open) element.showModal(); }} onCancel={event => event.preventDefault()} className="hogwarts-scene" aria-labelledby="scene-title">
        <h2 id="scene-title">李贤在 <small>· HYUNJAE</small></h2>
        {scenes.map(scene => {
          const text = scene.body
            .replace(/(李贤在[^。！？；：]{0,28}(?:说|问|笑了|声音|口气)|他[^。！？；：]{0,22}(?:说|问|声音|口气)|把书递给你|接过去了|还是伸手拿走|第一句话就是)：/g, "$1。李贤在：")
            .replace(/(你接过书，摸出一颗糖递给他|你说|你问)：/g, "$1。你：");
          const parts = text.split(/(?=李贤在：|你：)/);
          return <div key={scene.id}>{parts.map((part, index) => {
            const line = part.match(/^(李贤在|你)：(.*)$/s);
            if (!line) return part && <p key={index} className="hogwarts-narration">{highlightMistletoe(part)}</p>;
            const asideStart = line[2].search(/(?<=。|！|？|；)(?:嘴上|还是伸手|李贤在(?!(?:：))|你们|他(?:走|看|低|抬|伸|点|笑|停|往|收|向|转|靠|没有|先|忽然)|后来|安静了一会|比赛开始|走了一段)/);
            const speech = asideStart < 0 ? line[2] : line[2].slice(0, asideStart);
            const aside = asideStart < 0 ? "" : line[2].slice(asideStart);
            return <div key={index}>
              {speech && note(line[1] === "你" ? identity?.name ?? "我" : "李贤在", speech, line[1] === "你")}
              {aside && <p className="hogwarts-narration">{highlightMistletoe(aside)}</p>}
            </div>;
          })}</div>;
        })}
        {!owlToday && choices}
        {state.endings.length > 0 && <p>{state.endings.includes("hyunjae-together") ? "十二月的约定 · 恋人" : "十二月的约定 · 未说破的喜欢"}</p>}
        {(!choices || owlToday) && <button onClick={() => { setSeenScene(scenes[scenes.length - 1]?.id ?? ""); setSceneOpen(false); }}>继续今天的行程</button>}
      </dialog>}
      <nav className="hogwarts-dock" aria-label="学生手机应用">
        {modules.filter(module => ["magicphotos", "owlpost", "wizardjournal", "date"].includes(module.id)).sort((a, b) => ["magicphotos", "owlpost", "wizardjournal", "date"].indexOf(a.id) - ["magicphotos", "owlpost", "wizardjournal", "date"].indexOf(b.id)).map(module =>
          <button key={module.id} aria-pressed={active === module.id} onClick={() => setActive(active === module.id ? "calendar" : module.id)}>
            <span><module.Icon size={19} /></span>{module.id === "market" ? "魔法商店" : module.name}
          </button>)}
      </nav>
    </div>
  </div>;
}
