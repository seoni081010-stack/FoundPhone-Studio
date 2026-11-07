import { Image, StickyNote, Calendar, Mail, Files, Map, Heart, type LucideIcon } from "lucide-react";
export type EngineKind =
  "messaging" | "social" | "media" | "records" | "document" | "system";
export type AppPlugin = {
  id: string;
  name: string;
  engine: EngineKind;
  color: string;
  icon: LucideIcon;
  tabs: string[];
  description: string;
};
const definitions: [string, string, EngineKind, string, LucideIcon, string[]][] = [
  ["owlpost", "猫头鹰信箱", "messaging", "#91704b", Mail, ["收件箱", "写信"]],
  ["schoolbook", "霍格沃茨校园手册", "records", "#8b694b", Calendar, ["课程与作业", "日历与活动", "学院积分"]],
  ["maraudersmap", "活点地图", "records", "#9b8867", Map, ["地点", "探索"]],
  ["wizardjournal", "巫师手札", "document", "#84735c", StickyNote, ["日记", "线索"]],
  ["magicphotos", "魔法相册", "media", "#8279a0", Image, ["会动的照片", "回忆"]],
  ["heartarchive", "心动档案", "document", "#a57580", Heart, ["人物", "回忆"]],
];
export const registry: AppPlugin[] = definitions.map(
  ([id, name, engine, color, icon, tabs]) => ({
    id,
    name,
    engine,
    color,
    icon,
    tabs,
    description: "霍格沃茨魔法叙事模块",
  }),
);
export const getApp = (id: string) =>
  registry.find((a) => a.id === id) ?? {
    id,
    name: id,
    engine: "document" as const,
    color: "#758a7c",
    icon: Files,
    tabs: ["内容"],
    description: "自定义魔法模块",
  };
