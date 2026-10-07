import { Metadata } from "next";
import { Modul1PageView } from "@/modules/modul_1/page-view";

export const metadata: Metadata = {
  title: "Modul 1: Global Maps - Global Maps Studio",
  description: "Eksplorasi Peta Dunia Interaktif, Pencarian Lokasi, dan Asisten AI Geospasial",
};

export default function Modul1Page() {
  return <Modul1PageView />;
}
