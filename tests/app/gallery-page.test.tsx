import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import GalleryPage from "@/app/gallery/page";

describe("GalleryPage", () => {
  beforeEach(() => {
    localStorage.clear();
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

  it("shows the empty state when there is no history", () => {
    render(<GalleryPage />);

    expect(screen.getByText("还没有作品，去生成第一个吧 →")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "还没有作品，去生成第一个吧 →" })).toHaveAttribute(
      "href",
      "/"
    );
  });
});
