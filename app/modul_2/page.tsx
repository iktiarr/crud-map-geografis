import { Metadata } from "next";
import { Modul2PageView } from "@/modules/modul_2/page-view";

export const metadata: Metadata = {
  title: "Modul 2: CRUD Data Spasial - Global Maps Studio",
  description: "Pengelolaan Data Titik Koordinat, Poligon Wilayah, dan Garis Spasial Interaktif",
};

export default function Modul2Page() {
  return <Modul2PageView />;
}
