"use client";

import { useEffect, useRef, useState } from "react";
import { HistoryItem, StoryDuration, StoryRatio, pushHistory } from "@/lib/history";

type GenerateState = "idle" | "submitting" | "polling" | "completed" | "failed";

const ratioOptions: StoryRatio[] = ["16:9", "9:16", "1:1"];
const durationOptions: StoryDuration[] = [5, 10];

export function StoryGenerator() {
  const [prompt, setPrompt] = useState("");
  const [ratio, setRatio] = useState<StoryRatio>("16:9");
  const [duration, setDuration] = useState<StoryDuration>(5);
  const [imageUrl, setImageUrl] = useState("");
  const [status, setStatus] = useState<GenerateState>("idle");
  const [error, setError] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
      }
    };
  }, []);

  async function pollTask(taskId: string) {
    const response = await fetch(`/api/status/${taskId}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "状态查询失败。");
    }

    if (data.status === "completed" && data.videoUrl) {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
      }

      setVideoUrl(data.videoUrl);
      setStatus("completed");

      const historyItem: HistoryItem = {
        id: taskId,
        prompt,
        videoUrl: data.videoUrl,
        createdAt: new Date().toISOString(),
        ratio,
        duration
      };

      pushHistory(historyItem);
      return;
    }

    if (data.status === "failed") {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
      }

      setStatus("failed");
      setError("生成失败，请稍后重试。");
      return;
    }

    setStatus("polling");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setVideoUrl("");
    setStatus("submitting");

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          prompt,
          ratio,
          duration,
          imageUrl: imageUrl.trim() || undefined
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "生成任务创建失败。");
      }

      setStatus("polling");
      await pollTask(data.taskId);
      intervalRef.current = window.setInterval(() => {
        void pollTask(data.taskId).catch((pollError: unknown) => {
          if (intervalRef.current) {
            window.clearInterval(intervalRef.current);
          }

          setStatus("failed");
          setError(pollError instanceof Error ? pollError.message : "状态查询失败。");
        });
      }, 5000);
    } catch (submitError) {
      setStatus("failed");
      setError(submitError instanceof Error ? submitError.message : "生成失败。");
    }
  }

  return (
    <section className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
      <div className="space-y-6">
        <div className="space-y-3">
          <p className="text-sm uppercase tracking-[0.35em] text-violet-300">Seedance Studio</p>
          <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            ✨ AI 短剧生成器
          </h1>
          <p className="max-w-2xl text-base leading-7 text-white/70">
            输入故事场景，选择比例与时长，让 Seedance 为你生成适合社媒传播的短剧视频。
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/30 backdrop-blur-xl"
        >
          <label className="block space-y-2">
            <span className="text-sm text-white/80">故事描述</span>
            <textarea
              required
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="描述你的短剧场景，例如：一个武侠世界的刺客，在樱花树下与仇人重逢..."
              className="min-h-40 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition placeholder:text-white/30 focus:border-violet-400"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-2">
              <span className="text-sm text-white/80">视频比例</span>
              <select
                value={ratio}
                onChange={(event) => setRatio(event.target.value as StoryRatio)}
                className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-violet-400"
              >
                {ratioOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-2">
              <span className="text-sm text-white/80">时长</span>
              <select
                value={duration}
                onChange={(event) => setDuration(Number(event.target.value) as StoryDuration)}
                className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-violet-400"
              >
                {durationOptions.map((option) => (
                  <option key={option} value={option}>
                    {option} 秒
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="block space-y-2">
            <span className="text-sm text-white/80">参考图片 URL（可选）</span>
            <input
              value={imageUrl}
              onChange={(event) => setImageUrl(event.target.value)}
              placeholder="https://example.com/reference.jpg"
              className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition placeholder:text-white/30 focus:border-violet-400"
            />
          </label>

          <button
            type="submit"
            disabled={status === "submitting" || status === "polling"}
            className="inline-flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-violet-500 via-fuchsia-500 to-purple-600 px-5 py-3 text-base font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            ✨ 生成短剧
          </button>
        </form>
      </div>

      <div className="rounded-[28px] border border-white/10 bg-black/30 p-6 shadow-2xl shadow-black/30 backdrop-blur-xl">
        <div className="flex h-full min-h-[420px] flex-col justify-center">
          {(status === "idle" || status === "submitting") && (
            <div className="space-y-3 text-white/60">
              <h2 className="text-xl font-medium text-white">准备开始</h2>
              <p>提交故事后，生成结果会在这里展示。</p>
            </div>
          )}

          {status === "polling" && (
            <div className="flex flex-col items-center justify-center gap-4 text-center text-white/75">
              <div className="h-14 w-14 animate-spin rounded-full border-4 border-white/15 border-t-violet-400" />
              <p className="text-lg font-medium text-white">正在生成视频，通常需要 1-2 分钟...</p>
            </div>
          )}

          {status === "failed" && (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
              {error}
            </div>
          )}

          {status === "completed" && videoUrl && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-medium text-white">生成完成</h2>
                <a
                  href={videoUrl}
                  download
                  className="rounded-full border border-violet-300/30 bg-violet-400/10 px-4 py-2 text-sm text-violet-100"
                >
                  下载视频
                </a>
              </div>
              <video
                controls
                src={videoUrl}
                className="aspect-video w-full rounded-3xl border border-white/10 bg-black"
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
