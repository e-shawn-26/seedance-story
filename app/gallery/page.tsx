"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type HistoryRecord = {
  taskId: string;
  prompt: string;
  videoUrl: string;
  ratio: string;
  duration: number;
  createdAt: number;
};

export default function GalleryPage() {
  const [history, setHistory] = useState<HistoryRecord[]>([]);

  useEffect(() => {
    const records = JSON.parse(localStorage.getItem("seedance-history") || "[]") as HistoryRecord[];
    setHistory(records);
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      <div className="mx-auto min-h-screen max-w-6xl px-6 py-8">
        <nav className="mb-10 flex items-center justify-between">
          <Link href="/gallery" className="text-lg font-semibold tracking-wide">
            🎬 作品库
          </Link>
          <Link href="/" className="text-sm text-white/80 transition hover:text-white">
            + 新建
          </Link>
        </nav>

        {history.length === 0 ? (
          <div className="flex min-h-[60vh] items-center justify-center rounded-3xl border border-dashed border-white/15 bg-white/5 text-center">
            <Link href="/" className="text-lg text-white/80 transition hover:text-white">
              还没有作品，去生成第一个吧 →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {history.map((item) => (
              <article
                key={item.taskId}
                className="overflow-hidden rounded-3xl border border-white/10 bg-black/25 shadow-xl shadow-black/30"
              >
                <video
                  src={item.videoUrl}
                  muted
                  autoPlay
                  loop
                  playsInline
                  className="aspect-video w-full bg-black object-cover"
                />
                <div className="space-y-4 p-4">
                  <p className="line-clamp-2 text-sm leading-6 text-white/85">{item.prompt}</p>
                  <p className="text-xs text-white/45">
                    {new Date(item.createdAt).toLocaleString("zh-CN", {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </p>
                  <a
                    href={item.videoUrl}
                    download
                    className="inline-flex rounded-xl border border-purple-300/40 px-4 py-2 text-sm text-white transition hover:bg-white/10"
                  >
                    下载
                  </a>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
