import { beforeEach, describe, expect, it, vi } from "vitest";

const getTaskStatusMock = vi.fn();

vi.mock("@/lib/seedance", () => ({
  getTaskStatus: (...args: unknown[]) => getTaskStatusMock(...args)
}));

describe("GET /api/status/[taskId]", () => {
  beforeEach(() => {
    vi.resetModules();
    getTaskStatusMock.mockReset();
  });

  it("returns the serialized task status", async () => {
    const createdAt = new Date("2026-04-03T06:00:00.000Z");

    getTaskStatusMock.mockResolvedValueOnce({
      taskId: "task-1",
      status: "completed",
      videoUrl: "https://cdn.example.com/story.mp4",
      prompt: "月下重逢",
      createdAt
    });

    const { GET } = await import("@/app/api/status/[taskId]/route");
    const response = await GET(new Request("http://localhost/api/status/task-1") as never, {
      params: { taskId: "task-1" }
    });

    expect(getTaskStatusMock).toHaveBeenCalledWith("task-1");
    await expect(response.json()).resolves.toEqual({
      taskId: "task-1",
      status: "completed",
      videoUrl: "https://cdn.example.com/story.mp4",
      prompt: "月下重逢",
      createdAt: createdAt.toISOString()
    });
  });
});
