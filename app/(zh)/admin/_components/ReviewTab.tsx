"use client";

import { useState } from "react";
import { api, splitTags, type AdminData } from "./types";

export type Suggestion = {
  id: string;
  file: string;
  add: string[];
  remove: string[];
  note: string;
  createdAt: string;
};

// 审核访客提交的标签建议：可逐个取消勾选，接受后写入 photos.csv
export default function ReviewTab({
  data,
  enabled,
  suggestions,
  onChanged,
}: {
  data: AdminData;
  enabled: boolean;
  suggestions: Suggestion[];
  onChanged: () => void;
}) {
  // 被取消勾选的改动：`${id}:+tag` / `${id}:-tag`
  const [unchecked, setUnchecked] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");

  if (!enabled) {
    return (
      <div className="panel">
        <h2>标签建议功能未配置</h2>
        <p>
          需要 Upstash Redis：在 Vercel 项目的 Storage / Marketplace 中添加 Upstash for Redis，
          然后运行 <code>npx vercel env pull .env.local</code>（或把 KV_REST_API_URL、KV_REST_API_TOKEN
          手动写入 <code>.env.local</code>），重启 <code>npm run dev</code>。
        </p>
      </div>
    );
  }

  const plantName = (slug: string) => data.plants.find((p) => p.slug === slug)?.nameCn ?? slug;
  const partName = (slug: string) => data.parts.find((p) => p.slug === slug)?.nameCn ?? slug;

  function toggle(key: string) {
    setUnchecked((s) => {
      const next = new Set(s);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function act(s: Suggestion, action: "accept" | "reject") {
    setBusy(s.id);
    setMessage("");
    try {
      await api("/api/admin/suggestions", {
        method: "POST",
        json: {
          id: s.id,
          action,
          add: s.add.filter((t) => !unchecked.has(`${s.id}:+${t}`)),
          remove: s.remove.filter((t) => !unchecked.has(`${s.id}:-${t}`)),
        },
      });
      onChanged();
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="review-tab">
      <p className="muted">
        访客只能从 tags.md 中选择标签。接受后会写入 photos.csv（本地），记得之后点“发布到网站”。
        {message && <span className="error"> {message}</span>}
      </p>

      {suggestions.length === 0 && <p className="muted">没有待审核的建议。</p>}

      <div className="queue">
        {suggestions.map((s) => {
          const photo = data.photos.find((p) => p.file === s.file);
          return (
            <article key={s.id} className="queue-item">
              {photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={`/photos/${s.file}`} alt="" className="queue-preview" />
              ) : (
                <div className="queue-preview muted">图片已不存在</div>
              )}
              <div className="queue-body">
                <strong>
                  {photo ? `${plantName(photo.plant)} · ${partName(photo.part)}` : s.file}
                </strong>
                <span className="muted"> {new Date(s.createdAt).toLocaleString()}</span>

                {photo && (
                  <p className="muted">现有标签：{splitTags(photo.tags).join("、") || "无"}</p>
                )}

                <div className="review-changes">
                  {s.add.map((t) => (
                    <label key={`+${t}`} className="checkbox review-add">
                      <input
                        type="checkbox"
                        checked={!unchecked.has(`${s.id}:+${t}`)}
                        onChange={() => toggle(`${s.id}:+${t}`)}
                      />
                      + {t}
                    </label>
                  ))}
                  {s.remove.map((t) => (
                    <label key={`-${t}`} className="checkbox review-remove">
                      <input
                        type="checkbox"
                        checked={!unchecked.has(`${s.id}:-${t}`)}
                        onChange={() => toggle(`${s.id}:-${t}`)}
                      />
                      − {t}
                    </label>
                  ))}
                </div>

                {s.note && <blockquote className="review-note">{s.note}</blockquote>}

                <div className="queue-item-actions">
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={!photo || busy === s.id || (s.add.length + s.remove.length === 0)}
                    onClick={() => act(s, "accept")}
                  >
                    接受勾选的改动
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger"
                    disabled={busy === s.id}
                    onClick={() => act(s, "reject")}
                  >
                    {s.add.length + s.remove.length === 0 ? "已读，删除" : "拒绝"}
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
