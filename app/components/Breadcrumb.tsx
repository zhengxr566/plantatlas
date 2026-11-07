import { Fragment } from "react";
import Link from "next/link";
import JsonLd from "@/app/components/JsonLd";
import { breadcrumbJsonLd, type Crumb } from "@/lib/structuredData";

// 面包屑导航 + BreadcrumbList 结构化数据。最后一项是当前页面。
export default function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd(items)} />
      <nav className="breadcrumb" aria-label="breadcrumb">
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <Fragment key={`${item.name}-${i}`}>
              {i > 0 && <span>›</span>}
              {last ? (
                <span className="breadcrumb-current" aria-current="page">
                  {item.name}
                </span>
              ) : item.href ? (
                <Link href={item.href}>{item.name}</Link>
              ) : (
                <span className="breadcrumb-plain">{item.name}</span>
              )}
            </Fragment>
          );
        })}
      </nav>
    </>
  );
}
