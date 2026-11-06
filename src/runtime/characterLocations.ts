import { people } from "./HogwartsCharacters";
import { dailyLessons } from "./HogwartsSchedule";
import { qDays } from "./routeWork";

const classrooms: Record<string, string> = {
  "保护神奇生物": "神奇动物课场地", "魔药学": "魔药学 · 地窖",
  "草药学": "草药学温室", "自习与作业": "图书馆", "毕业研究": "图书馆", "N.E.W.T.复习": "图书馆",
};
const minutes = (time: string) => {
  const [hour, minute] = time.split(":").map(Number);
  return hour * 60 + minute;
};

export function characterLocations(day: number, time: string, selectedId: string, selectedPlace?: string) {
  const now = minutes(time);
  return people.map(person => {
    const lesson = dailyLessons(person.year, person.house, day).find(entry =>
      now >= minutes(entry.time) && now < minutes(entry.time) + 90);
    let place = lesson ? classrooms[lesson.subject] ?? lesson.subject
      : (now >= 7 * 60 && now < 9 * 60) || (now >= 12 * 60 + 30 && now < 14 * 60) || (now >= 18 * 60 && now < 19 * 60)
        ? "大礼堂" : person.role.startsWith("魁地奇") ? "魁地奇球场"
          : person.id === "jacob" ? "草药学温室" : person.house === "ravenclaw" ? "图书馆" : "长廊";
    if (person.id === "q" && day === 1 && now >= 17 * 60 && now < 18 * 60) place = "图书馆";
    if (person.id === "q") {
      const scene = qDays.find(entry => entry.day === day)?.stages.find(stage => stage.channel === "scene");
      if (scene && now >= minutes(scene.time) && now < minutes(scene.time) + 120) {
        place = scene.endTime && scene.endPlace && now >= minutes(scene.endTime)
          ? scene.endPlace : scene.place;
      }
    }
    if (person.id === selectedId && selectedPlace) place = selectedPlace;
    return { ...person, place, activity: lesson?.subject };
  });
}
