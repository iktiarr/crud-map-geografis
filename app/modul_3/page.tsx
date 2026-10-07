import { Metadata } from "next";
import { Modul3PageView } from "@/modules/modul_3/page-view";

export const metadata: Metadata = {
  title: "Modul 3: Pemetaan Jalan yang Dilalui - Global Maps Studio",
  description: "Pemetaan Jalan yang Dilalui, Pembuatan Rute Otomatis, Manajemen Folder, dan Asisten Rute AI",
};

export default function Modul3Page() {
  return <Modul3PageView />;
}
