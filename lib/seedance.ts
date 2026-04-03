export interface VideoTask {
  taskId: string;
  status: "pending" | "running" | "completed" | "failed";
  videoUrl?: string;
  prompt: string;
  createdAt: string | null;
}

export async function createVideoTask(params: {
  prompt: string;
  model?: string;
  imageUrl?: string;
  ratio?: string;
  duration?: number;
}): Promise<{ taskId: string }> {
  const model = params.model || "doubao-seedance-1-5-pro-251215";
  const content: any[] = [];
  if (params.imageUrl) {
    content.push({ type: "image_url", image_url: { url: params.imageUrl } });
  }
  content.push({ type: "text", text: params.prompt });
  const body: any = { model, content };
  if (params.ratio) body.ratio = params.ratio;
  if (params.duration) body.duration = params.duration;

  const res = await fetch("https://ark.cn-beijing.volces.com/api/v3/contents/generations/tasks", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.SEEDANCE_API_KEY}`
    },
    body: JSON.stringify(body)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || "API Error");
  return { taskId: data.id };
}

export async function getTaskStatus(taskId: string): Promise<VideoTask> {
  const res = await fetch(
    `https://ark.cn-beijing.volces.com/api/v3/contents/generations/tasks/${taskId}`,
    {
      headers: { Authorization: `Bearer ${process.env.SEEDANCE_API_KEY}` }
    }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || "API Error");
  const statusMap: Record<string, VideoTask["status"]> = {
    succeeded: "completed",
    failed: "failed",
    running: "running"
  };
  return {
    taskId: data.id || taskId,
    status: statusMap[data.status] || "pending",
    videoUrl: data.content?.video_url,
    prompt: data.input?.content?.find((c: any) => c.type === "text")?.text || "",
    createdAt: data.created_at ? new Date(data.created_at * 1000).toISOString() : null
  };
}
