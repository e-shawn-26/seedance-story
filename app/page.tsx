"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

type TaskStatus = "idle" | "submitting" | "running" | "completed" | "failed";

interface ApiTask {
  taskId?: string;
  status?: "pending" | "running" | "completed" | "failed";
  videoUrl?: string;
  error?: string;
}

export default function HomePage() {
  const [prompt, setPrompt] = useState("");
  const [ratio, setRatio] = useState("16:9");
  const [duration, setDuration] = useState("5");
  const [imageUrl, setImageUrl] = useState("");
  const [taskId, setTaskId] = useState<string | null>(null);
  const [status, setStatus] = useState<TaskStatus>("idle");
  const [videoUrl, setVideoUrl] = useState("");
  const [error, setError] = useState("");
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!taskId || (status !== "running" && status !== "submitting")) {
      return;
    }

    const pollTask = async () => {
      const response = await fetch(`/api/status/${taskId}`);
      const data: ApiTask = await response.json();

      if (!response.ok) {
        setStatus("failed");
        setError(data.error || "查询任务状态失败");
        return;
      }

      if (data.status === "completed" && data.videoUrl) {
        setStatus("completed");
        setVideoUrl(data.videoUrl);
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
        return;
      }

      if (data.status === "failed") {
        setStatus("failed");
        setError(data.error || "视频生成失败，请稍后重试");
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
        return;
      }

      setStatus("running");
    };

    void pollTask();
    pollingRef.current = setInterval(() => {
      void pollTask();
    }, 5000);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [status, taskId]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!prompt.trim()) {
      setError("请输入故事描述");
      setStatus("failed");
      return;
    }

    setStatus("submitting");
    setError("");
    setVideoUrl("");
    setTaskId(null);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          ratio,
          duration: Number(duration),
          imageUrl: imageUrl.trim() || undefined
        })
      });
      const data: ApiTask = await response.json();

      if (!response.ok || !data.taskId) {
        throw new Error(data.error || "创建视频任务失败");
      }

      setTaskId(data.taskId);
      setStatus("running");
    } catch (submitError: any) {
      setStatus("failed");
      setError(submitError.message || "创建视频任务失败");
    }
  };

  const isLoading = status === "submitting" || status === "running";

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 px-4 py-10 text-white">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <section className="space-y-4 text-center">
          <p className="text-sm uppercase tracking-[0.4em] text-purple-200">Seedance 2.0</p>
          <h1 className="text-4xl font-bold tracking-tight md:text-6xl">✨ AI 短剧生成器</h1>
          <p className="mx-auto max-w-2xl text-base text-slate-200 md:text-lg">
            输入场景描述，Seedance 2.0 帮你生成短剧视频
          </p>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-2xl shadow-purple-950/40 backdrop-blur md:p-8">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-sm font-medium text-purple-100" htmlFor="prompt">
                故事描述
              </label>
              <textarea
                id="prompt"
                rows={6}
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                placeholder="一个武侠世界的刺客，在樱花树下与仇人重逢，月光洒在刀刃上..."
                className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none transition focus:border-purple-400"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-purple-100" htmlFor="ratio">
                  视频比例
                </label>
                <select
                  id="ratio"
                  value={ratio}
                  onChange={(event) => setRatio(event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none transition focus:border-purple-400"
                >
                  <option value="16:9">16:9</option>
                  <option value="9:16">9:16</option>
                  <option value="1:1">1:1</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-purple-100" htmlFor="duration">
                  时长
                </label>
                <select
                  id="duration"
                  value={duration}
                  onChange={(event) => setDuration(event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none transition focus:border-purple-400"
                >
                  <option value="5">5秒</option>
                  <option value="10">10秒</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-purple-100" htmlFor="imageUrl">
                参考图片URL（可选）
              </label>
              <input
                id="imageUrl"
                type="url"
                value={imageUrl}
                onChange={(event) => setImageUrl(event.target.value)}
                placeholder="https://example.com/reference.jpg"
                className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none transition focus:border-purple-400"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-5 py-3 text-sm font-semibold text-white transition hover:from-violet-400 hover:to-fuchsia-400 disabled:cursor-not-allowed disabled:bg-slate-600 disabled:from-slate-500 disabled:to-slate-600"
            >
              {isLoading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  正在生成...
                </>
              ) : (
                "立即生成视频"
              )}
            </button>
          </form>
        </section>

        {isLoading ? (
          <section className="rounded-3xl border border-white/10 bg-slate-950/40 p-6">
            <div className="flex items-center gap-3 text-purple-100">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-purple-200/30 border-t-purple-200" />
              <p>正在生成视频，通常需要 1-2 分钟...</p>
            </div>
          </section>
        ) : null}

        {status === "completed" && videoUrl ? (
          <section className="space-y-4 rounded-3xl border border-emerald-400/20 bg-slate-950/50 p-6">
            <h2 className="text-xl font-semibold text-emerald-300">生成完成</h2>
            <video
              controls
              autoPlay
              loop
              src={videoUrl}
              className="w-full rounded-2xl border border-white/10 bg-black"
            />
            <a
              href={videoUrl}
              download
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-2xl border border-emerald-300/40 px-5 py-3 text-sm font-semibold text-emerald-200 transition hover:bg-emerald-300/10"
            >
              下载视频
            </a>
          </section>
        ) : null}

        {status === "failed" && error ? (
          <section className="rounded-3xl border border-red-500/30 bg-red-950/40 p-4 text-sm text-red-200">
            {error}
          </section>
        ) : null}
      </div>
    </main>
  );
}
