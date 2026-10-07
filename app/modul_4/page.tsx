import { Metadata } from "next";
import { Modul4PageView } from "@/modules/modul_4/page-view";

export const metadata: Metadata = {
  title: "Modul 4: Analisis Wilayah & Poligon - Global Maps Studio",
  description: "Analisis Wilayah, Batas Administratif, Estimasi Luas Area (ST_Area), dan Relasi Spasial",
};

export default function Modul4Page() {
  return <Modul4PageView />;
}
