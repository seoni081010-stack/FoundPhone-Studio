import {
  MessageCircle,
  Phone,
  Users,
  Image,
  Camera,
  Globe,
  StickyNote,
  Calendar,
  Mail,
  Clock,
  ListChecks,
  Files,
  Music,
  Map,
  CloudSun,
  Wallet,
  Heart,
  Locate,
  Calculator,
  Settings,
  Video,
  ShoppingBag,
  Utensils,
  Radio,
  Play,
  Hash,
  Headphones,
  Film,
  Pin,
  AtSign,
  Send,
  Tv,
  type LucideIcon,
} from "lucide-react";
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
  ["owlpost", "猫头鹰信箱", "messaging", "#91704b", Mail, ["收件箱", "写信", "礼物通知"]],
  ["schoolbook", "霍格沃茨校园手册", "records", "#8b694b", Calendar, ["课程与作业", "日历与活动", "学院积分"]],
  ["magicshop", "魔法商店", "records", "#9d7654", ShoppingBag, ["商品", "礼物", "订单"]],
  ["gringotts", "古灵阁", "records", "#8c8361", Wallet, ["金库", "收支"]],
  ["maraudersmap", "活点地图", "records", "#9b8867", Map, ["地点", "探索"]],
  ["wizardjournal", "巫师手札", "document", "#84735c", StickyNote, ["日记", "线索"]],
  ["magicphotos", "魔法相册", "media", "#8279a0", Image, ["会动的照片", "回忆"]],
  ["prophetdaily", "预言家日报", "document", "#7c746c", Files, ["新闻", "传闻"]],
  ["heartarchive", "心动档案", "document", "#a57580", Heart, ["人物", "回忆"]],
  ["music", "音乐", "media", "#786f9c", Music, ["曲目", "播放"]],
];
export const registry: AppPlugin[] = definitions.map(
  ([id, name, engine, color, icon, tabs]) => ({
    id,
    name,
    engine,
    color,
    icon,
    tabs,
    description: "非官方虚构叙事模板",
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
    description: "自定义 App",
  };
