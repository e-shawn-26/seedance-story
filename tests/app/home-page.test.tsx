import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import HomePage from "@/app/page";

const fetchMock = vi.fn();

describe("HomePage", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal("fetch", fetchMock);
    localStorage.clear();
    fetchMock.mockReset();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("submits the story, polls until completion, and stores history", async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ taskId: "task-123" })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          taskId: "task-123",
          status: "running",
          prompt: "一个武侠世界的刺客，在樱花树下与仇人重逢",
          createdAt: "2026-04-03T00:00:00.000Z"
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          taskId: "task-123",
          status: "completed",
          videoUrl: "https://cdn.example.com/story.mp4",
          prompt: "一个武侠世界的刺客，在樱花树下与仇人重逢",
          createdAt: "2026-04-03T00:00:00.000Z"
        })
      });

    render(<HomePage />);

    fireEvent.change(screen.getByLabelText("故事描述"), {
      target: { value: "一个武侠世界的刺客，在樱花树下与仇人重逢" }
    });
    fireEvent.change(screen.getByLabelText("视频比例"), { target: { value: "9:16" } });
    fireEvent.change(screen.getByLabelText("时长"), { target: { value: "10" } });
    fireEvent.change(screen.getByLabelText("参考图片URL"), {
      target: { value: "https://example.com/reference.png" }
    });

    fireEvent.click(screen.getByRole("button", { name: "开始生成" }));

    expect(await screen.findByText("正在生成视频，通常需要 1-2 分钟...")).toBeInTheDocument();

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "/api/generate",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" }
      })
    );

    expect(JSON.parse(fetchMock.mock.calls[0][1].body as string)).toEqual({
      prompt: "一个武侠世界的刺客，在樱花树下与仇人重逢",
      ratio: "9:16",
      duration: 10,
      imageUrl: "https://example.com/reference.png"
    });

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    await vi.advanceTimersByTimeAsync(5000);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenNthCalledWith(3, "/api/status/task-123");
      expect(screen.getByText("下载视频")).toBeInTheDocument();
    });

    const history = JSON.parse(localStorage.getItem("seedance-history") || "[]");
    expect(history).toHaveLength(1);
    expect(history[0]).toMatchObject({
      taskId: "task-123",
      prompt: "一个武侠世界的刺客，在樱花树下与仇人重逢",
      videoUrl: "https://cdn.example.com/story.mp4",
      ratio: "9:16",
      duration: 10
    });
    expect(typeof history[0].createdAt).toBe("number");

    await vi.advanceTimersByTimeAsync(10000);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("shows api errors", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "Seedance 服务暂时不可用" })
    });

    render(<HomePage />);

    fireEvent.change(screen.getByLabelText("故事描述"), { target: { value: "一个短剧故事" } });
    fireEvent.click(screen.getByRole("button", { name: "开始生成" }));

    expect(await screen.findByText("Seedance 服务暂时不可用")).toBeInTheDocument();
  });
});
