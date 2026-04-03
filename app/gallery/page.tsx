import { GalleryGrid } from "@/components/gallery-grid";

export default function GalleryPage() {
  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm uppercase tracking-[0.3em] text-violet-300">Gallery</p>
        <h1 className="text-3xl font-semibold text-white">视频画廊</h1>
        <p className="max-w-2xl text-sm text-white/70">
          浏览本地保存的短剧生成记录，点击任意卡片即可放大播放或下载。
        </p>
      </div>
      <GalleryGrid />
    </section>
  );
}
