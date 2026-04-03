import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import GalleryPage from "@/app/gallery/page";

describe("GalleryPage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders saved history from localStorage", () => {
    localStorage.setItem(
      "seedance-history",
      JSON.stringify([
        {
          taskId: "task-1",
          prompt: "月下决斗",
          videoUrl: "https://cdn.example.com/task-1.mp4",
          ratio: "16:9",
          duration: 5,
          createdAt: 1712121600000
        }
      ])
    );

    render(<GalleryPage />);

    expect(screen.getByText("月下决斗")).toBeInTheDocument();
    expect(screen.getByText(/2024/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "下载" })).toHaveAttribute(
      "href",
      "https://cdn.example.com/task-1.mp4"
    );
  });

  it("uses the same shell structure as the home page", () => {
    render(<GalleryPage />);

    expect(screen.getAllByRole("banner")).toHaveLength(1);
    expect(screen.getByRole("link", { name: "首页" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "← 返回生成" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("heading", { name: "视频画廊" })).toBeInTheDocument();
  });

  it("shows the empty state when there is no history", () => {
    render(<GalleryPage />);

    expect(screen.getByText("还没有作品，去生成第一个吧 →")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "还没有作品，去生成第一个吧 →" })).toHaveAttribute(
      "href",
      "/"
    );
  });

  it("reloads history on mount and syncs when storage changes", () => {
    localStorage.setItem(
      "seedance-history",
      JSON.stringify([
        {
          taskId: "task-initial",
          prompt: "初始记录",
          videoUrl: "https://cdn.example.com/initial.mp4",
          ratio: "16:9",
          duration: 5,
          createdAt: 1712121600000
        }
      ])
    );

    const { unmount } = render(<GalleryPage />);
    expect(screen.getByText("初始记录")).toBeInTheDocument();

    localStorage.setItem(
      "seedance-history",
      JSON.stringify([
        {
          taskId: "task-latest",
          prompt: "新记录",
          videoUrl: "https://cdn.example.com/latest.mp4",
          ratio: "16:9",
          duration: 5,
          createdAt: 1712121600000
        }
      ])
    );

    unmount();
    render(<GalleryPage />);
    expect(screen.getByText("新记录")).toBeInTheDocument();

    act(() => {
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: "seedance-history",
          newValue: localStorage.getItem("seedance-history"),
          storageArea: localStorage
        })
      );
    });

    expect(screen.getByText("新记录")).toBeInTheDocument();
  });
});
