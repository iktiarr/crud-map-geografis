import { Metadata } from "next";
import { AdminPageView } from "@/modules/admin/page-view";

export const metadata: Metadata = {
  title: "Portal Admin - Global Maps Studio",
  description: "Pusat Pengelolaan Kunci API OpenRouter, Model AI, dan Manajemen Pengguna",
};

export default function AdminPage() {
  return <AdminPageView />;
}
