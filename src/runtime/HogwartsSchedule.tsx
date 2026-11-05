import { isHoliday, sharedRules } from "./sharedRules";
import timetable from "../../stories/template/hogwarts-timetables.json";
const houseNames: Record<string,string> = { gryffindor:"Gryffindor",slytherin:"Slytherin",ravenclaw:"Ravenclaw",hufflepuff:"Hufflepuff" };
const breads = ["烤面包", "面包卷", "黄油吐司"];
const drinks = ["南瓜汁", "鲜榨橙汁", "热牛奶"];
const pick = (items: string[], seed: number, count = 1) => [...items]
 .map((item, index) => ({item, rank: Math.sin(seed * 97 + index * 131)}))
 .sort((a, b) => a.rank - b.rank).slice(0, count).map(({item}) => item);

function dailyMenu(day: number) {
 const breakfast = [
   ...pick(["燕麦粥", "玉米片"], day), ...pick(["煎培根", "煎香肠", "煎蛋", "水煮蛋", "熏鲱鱼"], day + 1, 2),
   ...pick(breads, day + 2), ...pick(["果酱炸面圈", "薄荷硬糖"], day + 3), ...pick(drinks, day + 4),
 ];
 const lunch = [
   ...(day === 8 ? ["烤鸡", "烤蔬菜", "清汤"] : [
     ...pick(["烤牛肉", "烤整鸡", "猪排", "羊排", "牛排", "肉馅土豆泥饼", "牛排腰子派", "牛肉炖菜", "康沃尔肉馅饼"], day + 5),
     ...pick(["煮土豆", "烤土豆", "土豆泥", "炸薯条", "约克郡布丁", "豌豆", "胡萝卜", "烤南瓜", "煎番茄", "豆芽"], day + 6, 2),
   ]),
   ...pick(breads, day + 7), ...pick(["糖浆水果馅饼", "苹果派", "米布丁", "果冻", "新鲜草莓"], day + 8), ...pick(drinks, day + 9),
 ];
 const dinner = [
   ...pick(["烤火鸡", "炖肉", "烤鸡腿", "黑布丁", "菜肉烘饼", "各式炖菜"], day + 10),
   ...pick(["黄油豌豆", "烤时蔬"], day + 11), ...pick(["肉汁", "蔓越莓酱"], day + 12),
   ...pick(breads, day + 13), ...pick(["巧克力松糕", "巧克力泡芙", "蛋奶果馅饼", "各式冰淇淋", "酒浸果酱布丁"], day + 14),
   ...pick(drinks, day + 15),
 ];
 if (day === sharedRules.ballDay || day === 25) {
   dinner.push("迷你小香肠", "火焰圣诞布丁", "圣诞蛋糕");
   if (!dinner.includes("烤火鸡")) dinner.unshift("烤火鸡");
 }
 return {breakfast, lunch, dinner};
}

export function dailyLessons(year: number, house: string, day: number) {
 const byYear = timetable.timetables[String(year) as keyof typeof timetable.timetables];
 const entries = byYear?.[houseNames[house] as keyof typeof byYear] ?? [];
 const weekday = new Date(Date.UTC(2026, 11, day)).getUTCDay();
 return entries.filter(entry => !isHoliday(day) && weekday >= 1 && weekday <= 5 && entry.day === weekday - 1)
   .sort((a, b) => a.time.localeCompare(b.time));
}

export function HogwartsSchedule({year, house, day, interaction, attended, onAttend, onEnd, onScene, sceneLabel}: {
 year: number; house: string; day: number; interaction?: string; attended: Record<string, boolean>;
 onAttend: (id: string, time: string, last: boolean) => void; onEnd?: () => void; onScene?: () => void; sceneLabel?: string;
}) {
 const lessons = dailyLessons(year, house, day);
 const lessonId = (lesson: (typeof lessons)[number]) => [day, lesson.time, lesson.subject].join("-");
 const allAttended = lessons.every(lesson => attended[lessonId(lesson)]);
 const menu = dailyMenu(day);
 return <section aria-label="当天日程">
   {lessons.length === 0 && <p>{isHoliday(day) ? "圣诞假期 · 自由活动" : "今天没有常规课程。"}</p>}
   {[
     {time: "07:30", row: <p key="breakfast" className="hogwarts-agenda-row">07:30 早餐 · {menu.breakfast.join("、")}</p>},
     ...lessons.map((lesson, index) => ({ time: lesson.time, row: <p className="hogwarts-agenda-row" key={lessonId(lesson)}>
     {lesson.time} {lesson.subject} <button type="button" disabled={attended[lessonId(lesson)] || lessons.slice(0, index).some(previous => !attended[lessonId(previous)])}
       onClick={() => onAttend(lessonId(lesson), lesson.time, index === lessons.length - 1)}>{attended[lessonId(lesson)] ? "已上课" : "去上课"}</button>
   </p> })),
     {time: "12:30", row: <p key="lunch" className="hogwarts-agenda-row">12:30 午餐 · {menu.lunch.join("、")}</p>},
     {time: "18:30", row: <p key="dinner" className="hogwarts-agenda-row">18:30 晚餐 · {menu.dinner.join("、")}</p>},
   ].sort((a, b) => a.time.localeCompare(b.time)).map(item => item.row)}
   {allAttended && onScene && <button className={sceneLabel ? "hogwarts-activity" : "hogwarts-activity hogwarts-continue-day"} type="button" onClick={onScene}>{sceneLabel ?? "继续今天的行程"}</button>}
   <button className="hogwarts-end-day" type="button" disabled={!onEnd || !allAttended} onClick={onEnd}>结束这一天</button>
   {!allAttended ? <p>请先完成今天的课程。</p> : !onEnd && interaction && day < sharedRules.confessionDay ? <p>请先到「{interaction}」完成今天的互动。</p> : null}
 </section>;
}
