export interface VideoTask {
  taskId: string;
  status: "pending" | "running" | "completed" | "failed";
  videoUrl?: string;
  prompt: string;
  createdAt: string | null;
}

const SEEDANCE_API_KEY = process.env.SEEDANCE_API_KEY || "3eb0ad82-e799-4cb8-81db-80b84a2eb5bf";

export async function createVideoTask(params: {
  prompt: string;
  model?: string;
  imageUrl?: string;
  ratio?: string;
  duration?: number;
}): Promise<{ taskId: string }> {
  const model = params.model || "doubao-seedance-2-0-260128";
  const content: any[] = [];
  if (params.imageUrl) {
    // Seedance accepts data URLs in image_url.url, so forward the uploaded base64 payload directly.
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
      Authorization: `Bearer ${SEEDANCE_API_KEY}`
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
      headers: { Authorization: `Bearer ${SEEDANCE_API_KEY}` },
      cache: "no-store"
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
