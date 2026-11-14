import Link from "next/link";
import { Fragment } from "react";

export type TaxonStep = { name: string; href?: string };

// 横向的分类路径：植物界 › 类群 › 演化支… › 目 › 科 › 属
export default function TaxonPath({ steps }: { steps: TaxonStep[] }) {
  return (
    <div className="lineage-horizontal">
      {steps.map((step, i) => (
        <Fragment key={`${i}-${step.name}`}>
          {i > 0 && <span className="lineage-arrow">›</span>}
          {step.href ? (
            <Link href={step.href} className="lineage-node link">
              {step.name}
            </Link>
          ) : (
            <span className="lineage-node">{step.name}</span>
          )}
        </Fragment>
      ))}
    </div>
  );
}
