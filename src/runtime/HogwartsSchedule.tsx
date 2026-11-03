import timetable from "../../stories/template/hogwarts-timetables.json";
const houseNames: Record<string,string> = { gryffindor:"Gryffindor",slytherin:"Slytherin",ravenclaw:"Ravenclaw",hufflepuff:"Hufflepuff" };
const weekdays=["周一","周二","周三","周四","周五"];
export function HogwartsSchedule({year,house}:{year:number;house:string}) {
 const byYear = timetable.timetables[String(year) as keyof typeof timetable.timetables];
 const entries = byYear?.[houseNames[house] as keyof typeof byYear] ?? [];
 return <section className="hogwarts-market" style={{padding:16,maxWidth:600,margin:"16px auto",background:"#faf3e6",color:"#30271e",borderRadius:16}} aria-label="霍格沃茨日程">
 <h2>📜 霍格沃茨日程</h2><p>{year} 年级 · {houseNames[house] ?? house} · 固定课表</p>
 {weekdays.map((day,i)=><div key={day}><h3>{day}</h3><ul>{entries.filter(e=>e.day===i).sort((a,b)=>a.time.localeCompare(b.time)).map(e=><li key={e.day+"-"+e.time+"-"+e.subject}>{e.time} {e.subject}</li>)}</ul></div>)}
 <p>周六、周日没有常规课程；外出约会仍须遵守学校许可和活动日历。</p></section>;
}
