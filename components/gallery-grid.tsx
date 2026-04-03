"use client";

import { useEffect, useState } from "react";
import {
  HISTORY_STORAGE_KEY,
  HistoryItem,
  formatHistoryDate,
  readHistory
} from "@/lib/history";

type GalleryGridProps = {
  items?: HistoryItem[];
};

export function GalleryGrid({ items }: GalleryGridProps) {
  const [history, setHistory] = useState<HistoryItem[]>(() => items ?? readHistory());
  const [selected, setSelected] = useState<HistoryItem | null>(null);

  useEffect(() => {
    if (items) {
      setHistory(items);
      return;
    }

    function syncHistory() {
      setHistory(readHistory());
    }

    function handleStorage(event: StorageEvent) {
      if (event.key === null || event.key === HISTORY_STORAGE_KEY) {
        syncHistory();
      }
    }

    syncHistory();
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("storage", handleStorage);
    };
  }, [items]);

  if (history.length === 0) {
    return (
      <div className="rounded-[28px] border border-dashed border-white/15 bg-white/5 p-10 text-center text-white/60">
        <a href="/" className="text-white/80 transition hover:text-white">
          还没有作品，去生成第一个吧 →
        </a>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        {history.map((item) => (
          <button
            key={item.taskId}
            type="button"
            onClick={() => setSelected(item)}
            aria-label={item.prompt}
            className="space-y-3 rounded-[24px] border border-white/10 bg-white/5 p-3 text-left transition hover:-translate-y-1 hover:bg-white/10"
          >
            <video
              aria-label="历史视频"
              src={item.videoUrl}
              className="aspect-video w-full rounded-2xl border border-white/10 bg-black object-cover"
            />
            <div className="space-y-1">
              <p className="line-clamp-2 text-sm font-medium text-white">{item.prompt}</p>
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-white/50">{formatHistoryDate(item.createdAt)}</p>
                <a
                  href={item.videoUrl}
                  download
                  onClick={(event) => event.stopPropagation()}
                  className="text-xs text-violet-200 transition hover:text-white"
                >
                  下载
                </a>
              </div>
            </div>
          </button>
        ))}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="w-full max-w-3xl rounded-[32px] border border-white/10 bg-[#12071e] p-5 shadow-2xl shadow-black/40">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-medium text-white">预览播放</h2>
                <p className="text-sm text-white/60">{selected.prompt}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-full border border-white/10 px-4 py-2 text-sm text-white/70"
              >
                关闭
              </button>
            </div>
            <video
              aria-label="预览视频"
              controls
              src={selected.videoUrl}
              className="aspect-video w-full rounded-3xl border border-white/10 bg-black"
            />
          </div>
        </div>
      )}
    </>
  );
}
