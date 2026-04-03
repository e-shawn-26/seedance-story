import { beforeEach, describe, expect, it, vi } from "vitest";

const createVideoTaskMock = vi.fn();

vi.mock("@/lib/seedance", () => ({
  createVideoTask: (...args: unknown[]) => createVideoTaskMock(...args)
}));

describe("POST /api/generate", () => {
  beforeEach(() => {
    vi.resetModules();
    createVideoTaskMock.mockReset();
  });

  it("rejects requests without a prompt", async () => {
    const { POST } = await import("@/app/api/generate/route");

    const request = new Request("http://localhost/api/generate", {
      method: "POST",
      body: JSON.stringify({ prompt: "   " })
    });

    const response = await POST(request as never);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "请输入故事描述"
    });
    expect(createVideoTaskMock).not.toHaveBeenCalled();
  });

  it("forwards prompt options to Seedance", async () => {
    createVideoTaskMock.mockResolvedValueOnce({ taskId: "task-123" });
    const { POST } = await import("@/app/api/generate/route");

    const request = new Request("http://localhost/api/generate", {
      method: "POST",
      body: JSON.stringify({
        prompt: "一个武侠世界的刺客，在樱花树下与仇人重逢。",
        ratio: "9:16",
        duration: "10",
        imageUrl: "data:image/png;base64,ZmFrZQ=="
      })
    });

    const response = await POST(request as never);

    expect(createVideoTaskMock).toHaveBeenCalledWith({
      prompt: "一个武侠世界的刺客，在樱花树下与仇人重逢。",
      ratio: "9:16",
      duration: 10,
      imageUrl: "data:image/png;base64,ZmFrZQ=="
    });
    await expect(response.json()).resolves.toEqual({ taskId: "task-123" });
  });

  it("rejects unsupported image types", async () => {
    const { POST } = await import("@/app/api/generate/route");

    const request = new Request("http://localhost/api/generate", {
      method: "POST",
      body: JSON.stringify({
        prompt: "一个短剧故事",
        imageUrl: "data:image/gif;base64,ZmFrZQ=="
      })
    });

    const response = await POST(request as never);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "参考图片仅支持 JPG、PNG 或 WEBP 格式"
    });
    expect(createVideoTaskMock).not.toHaveBeenCalled();
  });

  it("rejects oversized base64 images", async () => {
    const { POST } = await import("@/app/api/generate/route");
    const oversizedPayload = "a".repeat(5 * 1024 * 1024 * 4 / 3 + 16);

    const request = new Request("http://localhost/api/generate", {
      method: "POST",
      body: JSON.stringify({
        prompt: "一个短剧故事",
        imageUrl: `data:image/jpeg;base64,${oversizedPayload}`
      })
    });

    const response = await POST(request as never);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "参考图片不能超过 5MB"
    });
    expect(createVideoTaskMock).not.toHaveBeenCalled();
  });
});
