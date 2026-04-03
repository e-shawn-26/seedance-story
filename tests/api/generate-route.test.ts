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
        imageUrl: "https://example.com/ref.png"
      })
    });

    const response = await POST(request as never);

    expect(createVideoTaskMock).toHaveBeenCalledWith({
      prompt: "一个武侠世界的刺客，在樱花树下与仇人重逢。",
      ratio: "9:16",
      duration: 10,
      imageUrl: "https://example.com/ref.png"
    });
    await expect(response.json()).resolves.toEqual({ taskId: "task-123" });
  });
});
