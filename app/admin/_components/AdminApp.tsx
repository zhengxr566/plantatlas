"use client";

import { useCallback, useEffect, useState } from "react";
import CompareTab from "./CompareTab";
import LibraryTab from "./LibraryTab";
import PlantsTab from "./PlantsTab";
import ProgressTab from "./ProgressTab";
import ReviewTab, { type Suggestion } from "./ReviewTab";
import TagsTab from "./TagsTab";
import UploadTab from "./UploadTab";
import { api, type AdminData, type TagGroup } from "./types";

type Tab = "upload" | "library" | "progress" | "compare" | "plants" | "tags" | "review";
type SuggestionState = { enabled: boolean; suggestions: Suggestion[] };
type PublishStatus = { branch: string; files: { status: string; path: string }[] };

const TABS: { key: Tab; label: string }[] = [
  { key: "upload", label: "上传图片" },
  { key: "library", label: "图片库" },
  { key: "progress", label: "拍摄进度" },
  { key: "compare", label: "对比要点" },
  { key: "plants", label: "植物资料" },
  { key: "tags", label: "标签管理" },
  { key: "review", label: "待审核" },
];

function defaultMessage() {
  return `update photos ${new Date().toISOString().slice(0, 10)}`;
}

export default function AdminApp() {
  const [tab, setTab] = useState<Tab>("upload");
  const [data, setData] = useState<AdminData | null>(null);
  const [error, setError] = useState("");
  const [preset, setPreset] = useState<{ plant: string; part: string } | null>(null);
  const [status, setStatus] = useState<PublishStatus | null>(null);
  const [publishOpen, setPublishOpen] = useState(false);
  const [publishMessage, setPublishMessage] = useState(defaultMessage);
  const [publishLog, setPublishLog] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [review, setReview] = useState<SuggestionState>({ enabled: false, suggestions: [] });

  const refreshReview = useCallback(async () => {
    try {
      setReview(await api<SuggestionState>("/api/admin/suggestions"));
    } catch {
      setReview({ enabled: false, suggestions: [] });
    }
  }, []);

  const refreshStatus = useCallback(async () => {
    try {
      setStatus(await api<PublishStatus>("/api/admin/publish"));
    } catch {
      setStatus(null);
    }
  }, []);

  const refresh = useCallback(async () => {
    try {
      setData(await api<AdminData>("/api/admin/data"));
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
    refreshStatus();
  }, [refreshStatus]);

  // 首次加载
  useEffect(() => {
    let cancelled = false;
    api<AdminData>("/api/admin/data")
      .then((d) => !cancelled && setData(d))
      .catch((e: Error) => !cancelled && setError(e.message));
    api<PublishStatus>("/api/admin/publish")
      .then((s) => !cancelled && setStatus(s))
      .catch(() => {});
    api<SuggestionState>("/api/admin/suggestions")
      .then((r) => !cancelled && setReview(r))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const addTag = useCallback(async (tag: string) => {
    const { tagGroups } = await api<{ tagGroups: TagGroup[] }>("/api/admin/tags", {
      method: "POST",
      json: { tag },
    });
    setData((d) => (d ? { ...d, tagGroups } : d));
    refreshStatus();
  }, [refreshStatus]);

  async function doPublish() {
    setPublishing(true);
    setPublishLog("");
    try {
      const result = await api<{ log: string }>("/api/admin/publish", {
        method: "POST",
        json: { message: publishMessage },
      });
      setPublishLog(`${result.log}\n\n✓ 已推送。Vercel 会自动部署，通常几分钟后在线上生效。`);
      setPublishMessage(defaultMessage());
    } catch (e) {
      setPublishLog(`✗ ${(e as Error).message}`);
    } finally {
      setPublishing(false);
      refreshStatus();
    }
  }

  const changes = status?.files.length ?? 0;

  return (
    <div className="admin">
      <header className="admin-header">
        <strong>Plant Atlas 图片管理</strong>
        <nav className="admin-tabs">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              className={tab === t.key ? "admin-tab admin-tab-on" : "admin-tab"}
              onClick={() => setTab(t.key)}
            >
              {t.label}
              {t.key === "review" && review.suggestions.length > 0 && ` (${review.suggestions.length})`}
            </button>
          ))}
        </nav>
        <a href="/" target="_blank" rel="noopener" className="btn btn-ghost">
          打开网站
        </a>
        <button
          type="button"
          className={changes > 0 ? "btn btn-primary" : "btn"}
          onClick={() => {
            setPublishOpen(true);
            setPublishLog("");
            refreshStatus();
          }}
        >
          发布到网站{changes > 0 && `（${changes} 项改动）`}
        </button>
      </header>

      {error && <p className="error admin-main">{error}</p>}
      {!data && !error && <p className="muted admin-main">加载中…</p>}

      {data && (
        <main className="admin-main">
          {/* 所有页签保持挂载，切换时不会丢失待上传的图片和编辑中的内容 */}
          <div hidden={tab !== "upload"}>
            <UploadTab data={data} preset={preset} onUploaded={refresh} onAddTag={addTag} />
          </div>
          <div hidden={tab !== "library"}>
            <LibraryTab data={data} onChanged={refresh} onAddTag={addTag} />
          </div>
          <div hidden={tab !== "progress"}>
            <ProgressTab
              data={data}
              onPick={(plant, part) => {
                setPreset({ plant, part });
                setTab("upload");
              }}
            />
          </div>
          <div hidden={tab !== "compare"}>
            <CompareTab data={data} onChanged={refresh} />
          </div>
          <div hidden={tab !== "plants"}>
            <PlantsTab data={data} onChanged={refresh} onAddTag={addTag} />
          </div>
          <div hidden={tab !== "tags"}>
            <TagsTab data={data} onChanged={refresh} />
          </div>
          <div hidden={tab !== "review"}>
            <ReviewTab
              data={data}
              enabled={review.enabled}
              suggestions={review.suggestions}
              onChanged={() => {
                refresh();
                refreshReview();
              }}
            />
          </div>
        </main>
      )}

      {publishOpen && (
        <div className="modal-backdrop" onClick={() => !publishing && setPublishOpen(false)}>
          <div className="modal panel" onClick={(e) => e.stopPropagation()}>
            <h2>发布到网站</h2>
            <p className="muted">
              只提交图片、photos.csv、compare.csv 和 tags.md（不会提交代码改动），然后推送到 origin 的
              <strong> {status?.branch ?? "当前分支"} </strong>分支。
            </p>
            {changes === 0 ? (
              <p>没有需要发布的改动。</p>
            ) : (
              <ul className="change-list">
                {status!.files.slice(0, 30).map((f) => (
                  <li key={f.path}>
                    <code>{f.status}</code> {f.path}
                  </li>
                ))}
                {changes > 30 && <li className="muted">…还有 {changes - 30} 项</li>}
              </ul>
            )}
            <label className="field">
              <span>提交说明</span>
              <input value={publishMessage} onChange={(e) => setPublishMessage(e.target.value)} />
            </label>
            <div className="queue-item-actions">
              <button
                type="button"
                className="btn btn-primary"
                disabled={publishing || changes === 0}
                onClick={doPublish}
              >
                {publishing ? "发布中…" : "提交并推送"}
              </button>
              <button type="button" className="btn btn-ghost" disabled={publishing} onClick={() => setPublishOpen(false)}>
                关闭
              </button>
            </div>
            {publishLog && <pre className="publish-log">{publishLog}</pre>}
          </div>
        </div>
      )}
    </div>
  );
}
