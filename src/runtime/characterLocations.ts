import { juyeonItinerary } from "./juyeonStory";
import { people } from "./HogwartsCharacters";
import { dailyLessons } from "./HogwartsSchedule";
import { sunwooItinerary } from "./sunwooStory";
import { younghoonItinerary } from "./younghoonStory";
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
      const scene = qDays.find(entry => entry.day === day)?.stages.filter(stage => stage.channel === "scene" && now >= minutes(stage.time)).at(-1);
      if (scene && now < minutes(scene.time) + 120) {
        place = scene.endTime && scene.endPlace && now >= minutes(scene.endTime)
          ? scene.endPlace : scene.place;
      }
    }
    if (person.id === "younghoon") {
      const scene = younghoonItinerary(day).filter(stage => now >= minutes(stage.time)).at(-1);
      if (scene && now < minutes(scene.time) + 120) place = scene.place;
    }
    if (person.id === "sunwoo" || person.id === "juyeon") {
      // Day 31's 00:05 finale follows the late-night acts, not the morning schedule.
      const routeMinutes = (value: string) => minutes(value) + (day === 31 && minutes(value) < 360 ? 1440 : 0);
      const current = routeMinutes(time);
      const scene = (person.id === "juyeon" ? juyeonItinerary(day) : sunwooItinerary(day)).filter(stage => current >= routeMinutes(stage.time)).at(-1);
      if (scene && current < routeMinutes(scene.time) + 120) place = scene.place;
    }
    if (person.id !== "juyeon" && day === 12 && now >= 14 * 60 && now < 16 * 60) place = "魁地奇球场";
    if (person.id === selectedId && selectedPlace) place = selectedPlace;
    return { ...person, place, activity: lesson?.subject };
  });
}
