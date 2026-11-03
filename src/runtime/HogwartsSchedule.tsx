import food from "../../stories/template/hogwarts-food.json";
import timetable from "../../stories/template/hogwarts-timetables.json";
const houseNames: Record<string,string> = { gryffindor:"Gryffindor",slytherin:"Slytherin",ravenclaw:"Ravenclaw",hufflepuff:"Hufflepuff" };
const weekdays=["周一","周二","周三","周四","周五"];
export function HogwartsSchedule({year, house, day, interaction, attended, onAttend, onEnd, onScene, sceneLabel}: {
 year: number; house: string; day: number; interaction?: string; attended: Record<string, boolean>;
 onAttend: (id: string, time: string, last: boolean) => void; onEnd?: () => void; onScene?: () => void; sceneLabel?: string;
}) {
 const byYear = timetable.timetables[String(year) as keyof typeof timetable.timetables];
 const entries = byYear?.[houseNames[house] as keyof typeof byYear] ?? [];
 const weekday = new Date(Date.UTC(2026, 11, day)).getUTCDay();
 const lessons = entries.filter(entry => day < 22 && weekday >= 1 && weekday <= 5 && entry.day === weekday - 1)
   .sort((a, b) => a.time.localeCompare(b.time));
 const lessonId = (lesson: (typeof lessons)[number]) => [day, lesson.time, lesson.subject].join("-");
 const allAttended = lessons.every(lesson => attended[lessonId(lesson)]);
 return <section aria-label="当天日程">
   <h3>12月{day}日 · {weekdays[weekday - 1] ?? (weekday === 0 ? "周日" : "周六")}</h3>
   {lessons.length === 0 && <p>{day >= 22 ? "圣诞假期 · 自由活动" : "今天没有常规课程。"}</p>}
   {[
     {time: "07:30", row: <p key="breakfast" className="hogwarts-agenda-row">07:30 早餐 · {food.breakfast.starches[(day - 1) % food.breakfast.starches.length]}、{food.breakfast.proteins[(day - 1) % food.breakfast.proteins.length]}、{food.breakfast.drinks[(day - 1) % food.breakfast.drinks.length]}</p>},
     ...lessons.map((lesson, index) => ({ time: lesson.time, row: <p className="hogwarts-agenda-row" key={lessonId(lesson)}>
     {lesson.time} {lesson.subject} <button type="button" disabled={attended[lessonId(lesson)] || lessons.slice(0, index).some(previous => !attended[lessonId(previous)])}
       onClick={() => onAttend(lessonId(lesson), lesson.time, index === lessons.length - 1)}>{attended[lessonId(lesson)] ? "已上课" : "去上课"}</button>
   </p> })),
     {time: "12:30", row: <p key="lunch" className="hogwarts-agenda-row">12:30 午餐 · {food.mains[(day - 1) % food.mains.length]}</p>},
     {time: "18:30", row: <p key="dinner" className="hogwarts-agenda-row">18:30 晚餐 · {food.mains[(day + 4) % food.mains.length]}</p>},
   ].sort((a, b) => a.time.localeCompare(b.time)).map(item => item.row)}
   {allAttended && onScene && <button className="hogwarts-activity" type="button" onClick={onScene}>{sceneLabel ?? "继续今天的行程"}</button>}
   <button className="hogwarts-end-day" type="button" disabled={!onEnd || !allAttended} onClick={onEnd}>结束这一天</button>
   {!allAttended ? <p>请先完成今天的课程。</p> : !onEnd && interaction && day < 31 ? <p>请先到「{interaction}」完成今天的互动。</p> : null}
 </section>;
}
