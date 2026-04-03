import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import HomePage from "@/app/page";

const fetchMock = vi.fn();

describe("HomePage", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    localStorage.clear();
    sessionStorage.clear();
    fetchMock.mockReset();
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
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
      expect(fetchMock).toHaveBeenNthCalledWith(2, "/api/status/task-123");
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

    expect(fetchMock).toHaveBeenCalledTimes(2);
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

  it("disables the gallery entry while generating", async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ taskId: "task-guard" })
      })
      .mockResolvedValueOnce(
        new Promise(() => {
          // Keep the poll pending so the page stays in generating state.
        })
      );

    render(<HomePage />);

    fireEvent.change(screen.getByLabelText("故事描述"), { target: { value: "一个短剧故事" } });
    fireEvent.click(screen.getByRole("button", { name: "开始生成" }));

    await waitFor(() => {
      const galleryLink = screen.getByText("画廊");
      expect(galleryLink).toHaveAttribute("title", "生成完成后再查看");
      expect(galleryLink).toHaveAttribute("aria-disabled", "true");
      expect(sessionStorage.getItem("seedance-generation-state")).toContain("\"active\":true");
    });
  });

  it("restores the generation guard from sessionStorage on mount", () => {
    sessionStorage.setItem(
      "seedance-generation-state",
      JSON.stringify({
        active: true
      })
    );

    render(<HomePage />);

    const galleryLink = screen.getByText("画廊");
    expect(galleryLink).toHaveAttribute("title", "生成完成后再查看");
    expect(galleryLink).toHaveAttribute("aria-disabled", "true");
  });
});
