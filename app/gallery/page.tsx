import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { GalleryGrid } from "@/components/gallery-grid";

export default function GalleryPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <section className="space-y-6 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-purple-950/20 backdrop-blur">
          <div className="space-y-3">
            <Link
              href="/"
              className="inline-flex text-sm text-white/70 transition hover:text-white"
            >
              ← 返回生成
            </Link>
            <div className="space-y-2">
              <p className="text-sm uppercase tracking-[0.3em] text-violet-300">Gallery</p>
              <h1 className="text-3xl font-semibold text-white">视频画廊</h1>
              <p className="max-w-2xl text-sm text-white/70">
                浏览本地保存的短剧生成记录，点击任意卡片即可放大播放或下载。
              </p>
            </div>
          </div>
          <GalleryGrid />
        </section>
      </main>
    </div>
  );
}
