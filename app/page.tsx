"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type TaskStatus = "idle" | "pending" | "running" | "completed" | "failed";

type StatusResponse = {
  taskId: string;
  status: Exclude<TaskStatus, "idle">;
  videoUrl?: string;
  prompt: string;
  createdAt: string | null;
};

export default function HomePage() {
  const [prompt, setPrompt] = useState("");
  const [ratio, setRatio] = useState("16:9");
  const [duration, setDuration] = useState("5");
  const [imageUrl, setImageUrl] = useState("");
  const [status, setStatus] = useState<TaskStatus>("idle");
  const [taskId, setTaskId] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [error, setError] = useState("");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
      }
    };
  }, []);

  async function pollTask(id: string, currentPrompt: string, currentRatio: string, currentDuration: number) {
    const response = await fetch(`/api/status/${id}`);
    const data = (await response.json()) as StatusResponse | { error: string };

    if (!response.ok) {
      throw new Error("error" in data ? data.error : "状态查询失败");
    }

    const task = data as StatusResponse;
    setStatus(task.status);

    if (task.status === "completed" && task.videoUrl) {
      setVideoUrl(task.videoUrl);
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }

      const record = {
        taskId: id,
        prompt: currentPrompt,
        videoUrl: task.videoUrl,
        ratio: currentRatio,
        duration: currentDuration,
        createdAt: Date.now()
      };
      const history = JSON.parse(localStorage.getItem("seedance-history") || "[]");
      history.unshift(record);
      localStorage.setItem("seedance-history", JSON.stringify(history.slice(0, 50)));
      return;
    }

    if (task.status === "failed") {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
      setError("视频生成失败，请稍后重试");
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!prompt.trim()) {
      setError("请输入故事描述");
      return;
    }

    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }

    const currentPrompt = prompt.trim();
    const currentRatio = ratio;
    const currentDuration = Number(duration);

    setError("");
    setVideoUrl("");
    setTaskId("");
    setStatus("pending");

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          prompt: currentPrompt,
          ratio: currentRatio,
          duration: currentDuration,
          imageUrl
        })
      });
      const data = (await response.json()) as { taskId?: string; error?: string };

      if (!response.ok || !data.taskId) {
        throw new Error(data.error || "生成任务创建失败");
      }

      const nextTaskId = data.taskId;
      setTaskId(nextTaskId);
      await pollTask(nextTaskId, currentPrompt, currentRatio, currentDuration);

      pollRef.current = setInterval(() => {
        void pollTask(nextTaskId, currentPrompt, currentRatio, currentDuration).catch(
          (pollError: Error) => {
            if (pollRef.current) {
              clearInterval(pollRef.current);
              pollRef.current = null;
            }
            setStatus("failed");
            setError(pollError.message);
          }
        );
      }, 5000);
    } catch (submitError) {
      setStatus("failed");
      setError(submitError instanceof Error ? submitError.message : "生成失败");
    }
  }

  const isLoading = status === "pending" || status === "running";

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-8">
        <nav className="mb-10 flex items-center justify-between">
          <Link href="/" className="text-lg font-semibold tracking-wide">
            ✨ AI 短剧生成器
          </Link>
          <Link href="/gallery" className="text-sm text-white/80 transition hover:text-white">
            作品库
          </Link>
        </nav>

        <div className="grid flex-1 gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-purple-950/30 backdrop-blur">
            <div className="mb-6 space-y-3">
              <p className="text-sm uppercase tracking-[0.35em] text-purple-200/80">Seedance 2.0</p>
              <h1 className="text-4xl font-bold leading-tight">把一句故事，变成一段短剧。</h1>
              <p className="max-w-2xl text-sm text-white/70">
                输入故事描述、选择比例与时长，可选参考图，提交后系统会自动轮询生成结果。
              </p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/90" htmlFor="prompt">
                  故事描述
                </label>
                <textarea
                  id="prompt"
                  rows={6}
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  placeholder="一个武侠世界的刺客，在樱花树下与仇人重逢，月光洒在刀刃上..."
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm outline-none transition placeholder:text-white/30 focus:border-purple-400"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/90" htmlFor="ratio">
                    视频比例
                  </label>
                  <select
                    id="ratio"
                    aria-label="视频比例"
                    value={ratio}
                    onChange={(event) => setRatio(event.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm outline-none focus:border-purple-400"
                  >
                    <option value="16:9">16:9</option>
                    <option value="9:16">9:16</option>
                    <option value="1:1">1:1</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/90" htmlFor="duration">
                    时长
                  </label>
                  <select
                    id="duration"
                    aria-label="时长"
                    value={duration}
                    onChange={(event) => setDuration(event.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm outline-none focus:border-purple-400"
                  >
                    <option value="5">5秒</option>
                    <option value="10">10秒</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-white/90" htmlFor="imageUrl">
                  参考图片URL
                </label>
                <input
                  id="imageUrl"
                  aria-label="参考图片URL"
                  type="url"
                  value={imageUrl}
                  onChange={(event) => setImageUrl(event.target.value)}
                  placeholder="https://example.com/reference.jpg"
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm outline-none transition placeholder:text-white/30 focus:border-purple-400"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || !prompt.trim()}
                className="inline-flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-violet-500 via-fuchsia-500 to-purple-600 px-5 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:bg-slate-700 disabled:from-slate-600 disabled:via-slate-600 disabled:to-slate-600"
              >
                {isLoading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    正在生成
                  </>
                ) : (
                  "开始生成"
                )}
              </button>
            </form>
          </section>

          <section className="rounded-3xl border border-white/10 bg-black/20 p-6 shadow-2xl shadow-black/30 backdrop-blur">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">生成状态</h2>
              {taskId ? <span className="text-xs text-white/45">Task ID: {taskId}</span> : null}
            </div>

            {isLoading ? (
              <div className="flex h-full min-h-[320px] flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-white/15 bg-white/5 text-center">
                <span className="h-10 w-10 animate-spin rounded-full border-4 border-purple-300/20 border-t-purple-300" />
                <p className="text-sm text-white/70">正在生成视频，通常需要 1-2 分钟...</p>
              </div>
            ) : null}

            {!isLoading && videoUrl ? (
              <div className="space-y-4">
                <video
                  src={videoUrl}
                  controls
                  autoPlay
                  loop
                  className="aspect-video w-full rounded-3xl bg-black object-cover"
                />
                <a
                  href={videoUrl}
                  download
                  className="inline-flex items-center justify-center rounded-2xl border border-purple-300/40 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/10"
                >
                  下载视频
                </a>
              </div>
            ) : null}

            {!isLoading && !videoUrl && error ? (
              <div className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            ) : null}

            {!isLoading && !videoUrl && !error ? (
              <div className="flex min-h-[320px] items-center justify-center rounded-3xl border border-dashed border-white/15 bg-white/5 px-6 text-center text-sm text-white/45">
                生成结果会显示在这里。
              </div>
            ) : null}
          </section>
        </div>
      </div>
    </main>
  );
}
