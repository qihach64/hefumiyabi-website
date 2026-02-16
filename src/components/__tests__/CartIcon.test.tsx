/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, act } from "@testing-library/react";

// Mock useCartStore
const mockGetTotalItems = vi.fn(() => 0);
vi.mock("@/store/cart", () => ({
  useCartStore: (selector: (state: { getTotalItems: () => number }) => unknown) =>
    selector({ getTotalItems: mockGetTotalItems }),
}));

import CartIcon from "../CartIcon";

describe("CartIcon", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetTotalItems.mockReturnValue(0);
  });

  afterEach(() => {
    cleanup();
  });

  it("渲染购物车图标链接", () => {
    render(<CartIcon />);
    const link = screen.getByRole("link");
    expect(link).toBeInTheDocument();
  });

  it("链接 href 为 /cart", () => {
    render(<CartIcon />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/cart");
  });

  it('aria-label 为 "购物车"', () => {
    render(<CartIcon />);
    expect(screen.getByLabelText("购物车")).toBeInTheDocument();
  });

  it("空购物车不显示数量 badge", async () => {
    mockGetTotalItems.mockReturnValue(0);
    const { container } = render(<CartIcon />);
    // 触发 useEffect 挂载
    await act(async () => {});
    expect(container.querySelector(".rounded-full.bg-sakura-600")).not.toBeInTheDocument();
  });

  it("有商品时显示数量 badge", async () => {
    mockGetTotalItems.mockReturnValue(3);
    render(<CartIcon />);
    await act(async () => {});
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it('数量 >99 时显示 "99+"', async () => {
    mockGetTotalItems.mockReturnValue(150);
    render(<CartIcon />);
    await act(async () => {});
    expect(screen.getByText("99+")).toBeInTheDocument();
  });

  describe("样式 regression 防护", () => {
    // 防止图标容器过大，破坏 Header 视觉平衡

    it("图标容器尺寸为 h-9 w-9（不大于 h-10 w-10）", () => {
      render(<CartIcon />);
      const link = screen.getByRole("link");
      expect(link.className).toContain("h-9");
      expect(link.className).toContain("w-9");
      expect(link.className).not.toContain("h-10");
      expect(link.className).not.toContain("w-10");
    });
  });
});
