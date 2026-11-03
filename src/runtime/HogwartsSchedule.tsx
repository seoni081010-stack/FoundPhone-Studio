import timetable from "../../stories/template/hogwarts-timetables.json";
const houseNames: Record<string,string> = { gryffindor:"Gryffindor",slytherin:"Slytherin",ravenclaw:"Ravenclaw",hufflepuff:"Hufflepuff" };
const weekdays=["周一","周二","周三","周四","周五"];
export function HogwartsSchedule({year, house, day, interaction, attended, onAttend, onEnd}: {
 year: number; house: string; day: number; interaction: string; attended: Record<string, boolean>;
 onAttend: (id: string, time: string) => void; onEnd?: () => void;
}) {
 const byYear = timetable.timetables[String(year) as keyof typeof timetable.timetables];
 const entries = byYear?.[houseNames[house] as keyof typeof byYear] ?? [];
 const weekday = new Date(Date.UTC(2026, 11, day)).getUTCDay();
 const lessons = entries.filter(entry => weekday >= 1 && weekday <= 5 && entry.day === weekday - 1)
   .sort((a, b) => a.time.localeCompare(b.time));
 const lessonId = (lesson: (typeof lessons)[number]) => [day, lesson.time, lesson.subject].join("-");
 const allAttended = lessons.every(lesson => attended[lessonId(lesson)]);
 return <section aria-label="当天日程">
   <h3>12月{day}日 · {weekdays[weekday - 1] ?? (weekday === 0 ? "周日" : "周六")}</h3>
   {lessons.length === 0 && <p>今天没有常规课程。</p>}
   {lessons.map(lesson => <p key={lessonId(lesson)}>
     {lesson.time} {lesson.subject} <button type="button" disabled={attended[lessonId(lesson)]}
       onClick={() => onAttend(lessonId(lesson), lesson.time)}>{attended[lessonId(lesson)] ? "已上课" : "去上课"}</button>
   </p>)}
   <button className="hogwarts-end-day" type="button" disabled={!onEnd || !allAttended} onClick={onEnd}>结束这一天</button>
   {!allAttended ? <p>请先完成今天的课程。</p> : !onEnd && day < 31 ? <p>请先到「{interaction}」完成今天的互动。</p> : null}
 </section>;
}
