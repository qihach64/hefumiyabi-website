/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, act } from "@testing-library/react";

// Mock useFavoritesStore
let mockFavorites: { planId: string; imageUrl: string }[] = [];
vi.mock("@/store/favorites", () => ({
  useFavoritesStore: (selector: (state: { favorites: typeof mockFavorites }) => unknown) =>
    selector({ favorites: mockFavorites }),
}));

import WishlistIcon from "../WishlistIcon";

describe("WishlistIcon", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFavorites = [];
  });

  afterEach(() => {
    cleanup();
  });

  it("渲染心愿单图标链接", () => {
    render(<WishlistIcon />);
    const link = screen.getByRole("link");
    expect(link).toBeInTheDocument();
  });

  it("链接 href 为 /profile/wishlist", () => {
    render(<WishlistIcon />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/profile/wishlist");
  });

  it('aria-label 为 "心愿单"', () => {
    render(<WishlistIcon />);
    expect(screen.getByLabelText("心愿单")).toBeInTheDocument();
  });

  it("空收藏不显示数量 badge", async () => {
    mockFavorites = [];
    const { container } = render(<WishlistIcon />);
    await act(async () => {});
    expect(container.querySelector(".rounded-full.bg-sakura-600")).not.toBeInTheDocument();
  });

  it("有收藏时显示数量 badge", async () => {
    mockFavorites = [
      { planId: "1", imageUrl: "a.jpg" },
      { planId: "2", imageUrl: "b.jpg" },
      { planId: "3", imageUrl: "c.jpg" },
    ];
    render(<WishlistIcon />);
    await act(async () => {});
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it('数量 >99 时显示 "99+"', async () => {
    mockFavorites = Array.from({ length: 100 }, (_, i) => ({
      planId: `${i}`,
      imageUrl: `${i}.jpg`,
    }));
    render(<WishlistIcon />);
    await act(async () => {});
    expect(screen.getByText("99+")).toBeInTheDocument();
  });

  describe("样式 regression 防护", () => {
    it("图标容器尺寸为 h-9 w-9（不大于 h-10 w-10）", () => {
      render(<WishlistIcon />);
      const link = screen.getByRole("link");
      expect(link.className).toContain("h-9");
      expect(link.className).toContain("w-9");
      expect(link.className).not.toContain("h-10");
      expect(link.className).not.toContain("w-10");
    });
  });
});
