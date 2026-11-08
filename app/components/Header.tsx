"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import SiteSearch, { type SearchEntry } from "./SiteSearch";

const NAV = [
  { href: "/lineage", label: "谱系地图" },
  { href: "/compare", label: "植物对比" },
  { href: "/identify", label: "植物识别" },
];

export default function Header({
  searchEntries,
  menuOpen,
  onMenuToggle,
}: {
  searchEntries: SearchEntry[];
  menuOpen: boolean;
  onMenuToggle: () => void;
}) {
  const pathname = usePathname();
  // 手机上点搜索图标后展开搜索框
  const [mobileSearch, setMobileSearch] = useState(false);

  return (
    <header className="site-header">
      <button
        type="button"
        className="header-icon header-menu"
        aria-label={menuOpen ? "关闭导航菜单" : "打开导航菜单"}
        aria-expanded={menuOpen}
        onClick={onMenuToggle}
      >
        {menuOpen ? "✕" : "☰"}
      </button>

      <Link href="/" className="brand">
        <span className="brand-en">Plant Atlas World</span>
        <span className="brand-cn">植物谱系世界</span>
      </Link>

      <nav className="header-nav" aria-label="主导航">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={pathname.startsWith(item.href) ? "header-link header-link-on" : "header-link"}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="header-search">
        <SiteSearch entries={searchEntries} />
      </div>

      <button
        type="button"
        className="header-icon header-search-toggle"
        aria-label={mobileSearch ? "关闭搜索" : "搜索"}
        aria-expanded={mobileSearch}
        onClick={() => setMobileSearch((v) => !v)}
      >
        {mobileSearch ? "✕" : "⌕"}
      </button>

      {mobileSearch && (
        <div className="header-search-mobile">
          <SiteSearch entries={searchEntries} autoFocus onNavigate={() => setMobileSearch(false)} />
        </div>
      )}
    </header>
  );
}
