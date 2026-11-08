"use client";

import Link from "next/link";
import { track } from "@/lib/analytics";

// 普通链接 + 点击时记录一个 GA 事件（服务端组件里也能使用）
export default function TrackLink({
  href,
  event,
  params,
  className,
  children,
}: {
  href: string;
  event: string;
  params: Record<string, string | number | boolean>;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className={className} onClick={() => track(event, params)}>
      {children}
    </Link>
  );
}
