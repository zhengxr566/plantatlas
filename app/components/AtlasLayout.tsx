"use client";

import { useState, useEffect } from "react";
import Header from "./Header";
import LineageSidebar from "./LineageSidebar";

export default function AtlasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarWidth, setSidebarWidth] = useState(300);
  const [collapsed, setCollapsed] = useState(false);

  // ✅ 只在客户端判断屏幕宽度
  useEffect(() => {
    function handleResize() {
      if (window.innerWidth < 980) {
        setCollapsed(true);
      } else {
        setCollapsed(false);
      }
    }

    handleResize(); // 初始化执行一次

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
          style={{
            gridTemplateColumns: collapsed
              ? "0px minmax(0, 1fr)" // ✅ 完全收起
              : `${sidebarWidth}px minmax(0, 1fr)`,
          }}
        >
          {/* 左侧 */}
          {!collapsed && (
            <div className="sidebar-shell">
              <LineageSidebar />

              <div
                className="resize-handle"
                onMouseDown={startResize}
                role="separator"
                aria-orientation="vertical"
              />
            </div>
          )}

          {/* 右侧 */}
          <article className="document-panel">{children}</article>
        </div>
      </main>
    </>
  );
}