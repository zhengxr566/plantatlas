"use client";

import { useState } from "react";
import Link from "next/link";
import Header from "./Header";
import LineageSidebar from "./LineageSidebar";

export default function AtlasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarWidth, setSidebarWidth] = useState(300);

  function startResize(e: React.MouseEvent<HTMLDivElement>) {
    e.preventDefault();

    const startX = e.clientX;
    const startWidth = sidebarWidth;

    function onMouseMove(event: MouseEvent) {
      const delta = event.clientX - startX;
      const nextWidth = Math.min(Math.max(startWidth + delta, 240), 560);
      setSidebarWidth(nextWidth);
    }

    function onMouseUp() {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    }

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  }

  return (
    <>
      <Header />

      <main className="page">
        <div
          className="atlas-layout"
          // 窄屏布局由 globals.css 的媒体查询处理，不在 JS 里判断屏幕宽度，
          // 避免服务端渲染和客户端首次渲染不一致导致的布局跳动（CLS）
          style={{ gridTemplateColumns: `${sidebarWidth}px minmax(0, 1fr)` }}
        >
          {/* 左侧 */}
          <div className="sidebar-shell">
            <LineageSidebar />

            <div
              className="resize-handle"
              onMouseDown={startResize}
              role="separator"
              aria-orientation="vertical"
            />
          </div>

          {/* 右侧 */}
          <article className="document-panel">{children}</article>
        </div>
      </main>

      <footer className="site-footer">
        <Link href="/compare">植物对比</Link>
        <span>·</span>
        <Link href="/identify">植物识别</Link>
        <span>·</span>
        <Link href="/privacy">隐私政策与图片版权</Link>
      </footer>
    </>
  );
}