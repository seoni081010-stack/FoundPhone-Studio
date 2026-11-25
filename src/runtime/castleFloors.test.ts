import { describe,expect,it } from "vitest";
import { castleFloors,castleFloorPoint,castleLocation,classroomLocations,castleMapHeight } from "./castleFloors";
import timetable from "../../stories/template/hogwarts-timetables.json";
import { mapLandmarks,mapRooms } from "./mapLocations";
import { characterLocations } from "./characterLocations";
import { dailyLessons } from "./HogwartsSchedule";

describe("reference cutaway floor map",()=>{
  it("groups the four main levels, basement, high towers and grounds without excluded rooms",()=>{
    expect(castleFloors.map(f=>f.id)).toEqual(["towers","four","three","two","one","dungeons","grounds"]);
    const labels=castleFloors.flatMap(f=>f.rooms);
    expect(labels).not.toContain("斯内普办公室");expect(labels).not.toContain("密室");
    for(const room of labels){const point=castleLocation(room);expect(point.room).toBe(room);expect(point.y).toBeGreaterThan(0);expect(point.y).toBeLessThan(castleMapHeight);}
  });
  it.each([
    ["门厅","one"],["大礼堂","one"],["黑魔法防御术","two"],["图书馆","two"],
    ["变形术","three"],["校医院","three"],["魔咒学","four"],["级长浴室","four"],
    ["魔药学","dungeons"],["霍格沃茨厨房","dungeons"],["天文学","towers"],["占卜学","towers"],
    ["算术占卜教室外","four"],["草药学温室","grounds"],["霍格沃茨·魁地奇球场","grounds"],
    ["霍格沃茨·三楼展览室","three"],["四楼空教室外","four"],["霍格沃茨·二楼回廊","two"],
  ])("locates %s on %s",(place,floor)=>{expect(castleLocation(place).floor).toBe(floor);});
  it("assigns every scheduled course an actual named room",()=>{
    const subjects=new Set(Object.values(timetable.timetables).flatMap(year=>Object.values(year).flatMap(house=>house.map(entry=>entry.subject))));
    for(const subject of subjects){expect(classroomLocations[subject],subject).toBeDefined();expect(castleLocation(classroomLocations[subject]).explicit).toBe(true);}
    for(let day=1;day<=21;day++)for(const time of ["09:00","11:00","14:00"]){
      const people=characterLocations(day,time,"hyunjae");expect(people).toHaveLength(7);
      for(const person of people){const lesson=dailyLessons(person.year,person.house,day).find(l=>l.time===time);if(lesson)expect(castleLocation(classroomLocations[lesson.subject]).room).not.toContain("走廊");}
    }
  });
  it("projects every floor onto the original castle canvas without mixing floors",()=>{
    for(const floor of castleFloors)for(const room of floor.rooms){
      const point=castleFloorPoint(room);expect(point.floor).toBe(floor.id);
      expect(point.x).toBeGreaterThan(0);expect(point.x).toBeLessThan(360);expect(point.y).toBeGreaterThan(0);expect(point.y).toBeLessThan(565);
    }
  });
  it("moves Eric from the earlier staircase scene into his new class",()=>{
    const lesson=dailyLessons(5,"gryffindor",1).find(entry=>entry.time==="09:00")!;
    expect(lesson).toBeDefined();
    expect(characterLocations(1,"09:00","eric").find(person=>person.id==="eric")?.place).toBe(classroomLocations[lesson.subject]);
    expect(characterLocations(1,"09:00","eric","大理石楼梯").find(person=>person.id==="eric")?.place).toBe("大理石楼梯");
  });
  it("retains explicit authored floor labels and resolves all existing map metadata",()=>{
    for(const name of [...Object.keys(mapLandmarks),...mapRooms.map(r=>r[0])])expect(castleLocation(name).explicit,name).toBe(true);
    expect(castleLocation("霍格沃茨·二楼回廊").floor).toBe("two");
    expect(castleLocation("霍格沃茨·四楼回廊").floor).toBe("four");
    expect(castleLocation("三楼通往四楼的隐藏石阶").floor).toBe("three");
    const base=characterLocations(1,"11:00","eric"),during=characterLocations(1,"11:00","eric","天文塔");
    expect(during.filter(p=>p.id!=="eric")).toEqual(base.filter(p=>p.id!=="eric"));
  });
});
