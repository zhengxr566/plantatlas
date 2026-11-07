import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isAdminEnabled } from "@/lib/admin/store";
import AdminApp from "./_components/AdminApp";
import "./admin.css";

// 图片管理后台：只在本地 npm run dev 时可用，线上访问返回 404
export const metadata: Metadata = {
  title: "图片管理｜Plant Atlas World",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  if (!isAdminEnabled()) notFound();
  return <AdminApp />;
}
