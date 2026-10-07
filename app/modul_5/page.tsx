import { Metadata } from "next";
import { Modul5PageView } from "@/modules/modul_5/page-view";

export const metadata: Metadata = {
  title: "Modul 5: GeoJSON Tools & Converter - Global Maps Studio",
  description: "Pengelolaan, Konversi, Validasi dan Unduh Berkas Standar GeoJSON RFC 7946",
};

export default function Modul5Page() {
  return <Modul5PageView />;
}
