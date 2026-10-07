import { Metadata } from "next";
import { Modul6PageView } from "@/modules/modul_6/page-view";

export const metadata: Metadata = {
  title: "Modul 6: Peta Kepadatan & Heatmap - Global Maps Studio",
  description: "Visualisasi Sebaran Spasial Dinamis dengan Layer Heatmap Intensitas Warna",
};

export default function Modul6Page() {
  return <Modul6PageView />;
}
