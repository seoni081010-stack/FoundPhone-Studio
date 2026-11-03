import { lazy, type ComponentType } from "react";
import type { SkinProps } from "../AppSkins";
function skin<T>(load: () => Promise<T>, name: keyof T) {
  return lazy(async () => ({ default: (await load())[name] as ComponentType<SkinProps> }));
}
const magical = () => import("./HogwartsSkins");
export const catalogSkins = {
  owlpost: skin(magical, "OwlPostSkin"),
  schoolbook: skin(magical, "SchoolbookSkin"),
  magicshop: skin(magical, "MagicShopSkin"),
  gringotts: skin(magical, "GringottsSkin"),
  maraudersmap: skin(magical, "MaraudersMapSkin"),
  wizardjournal: skin(magical, "WizardJournalSkin"),
  magicphotos: skin(magical, "MagicPhotosSkin"),
  prophetdaily: skin(magical, "ProphetDailySkin"),
  heartarchive: skin(magical, "HeartArchiveSkin"),
  music: skin(magical, "MusicSkin"),
};
