/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";

import NavMenuButton from "../NavMenuButton";

const navLinks = [
  { href: "/plans", label: "和服套餐" },
  { href: "/stores", label: "店铺信息" },
  { href: "/about", label: "关于我们" },
  { href: "/campaigns", label: "限定活动", special: true },
];

describe("NavMenuButton", () => {
  afterEach(() => {
    cleanup();
  });

  it("渲染菜单按钮", () => {
    render(<NavMenuButton navLinks={navLinks} />);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("初始不展开下拉菜单", () => {
    render(<NavMenuButton navLinks={navLinks} />);
    expect(screen.queryByText("和服套餐")).not.toBeInTheDocument();
  });

  it("点击按钮展开菜单，渲染所有 navLinks", () => {
    render(<NavMenuButton navLinks={navLinks} />);
    fireEvent.click(screen.getByRole("button"));

    expect(screen.getByText("和服套餐")).toBeInTheDocument();
    expect(screen.getByText("店铺信息")).toBeInTheDocument();
    expect(screen.getByText("关于我们")).toBeInTheDocument();
    expect(screen.getByText("限定活动")).toBeInTheDocument();
  });

  it("链接 href 正确", () => {
    render(<NavMenuButton navLinks={navLinks} />);
    fireEvent.click(screen.getByRole("button"));

    for (const link of navLinks) {
      const el = screen.getByText(link.label).closest("a");
      expect(el).toHaveAttribute("href", link.href);
    }
  });

  it("special=true 的链接有特殊样式（sakura-600）", () => {
    render(<NavMenuButton navLinks={navLinks} />);
    fireEvent.click(screen.getByRole("button"));

    const specialLink = screen.getByText("限定活动");
    expect(specialLink.className).toContain("text-sakura-600");
    expect(specialLink.className).toContain("font-semibold");

    const normalLink = screen.getByText("和服套餐");
    expect(normalLink.className).toContain("text-gray-700");
    expect(normalLink.className).not.toContain("text-sakura-600");
  });

  it("点击背景遮罩关闭菜单", () => {
    const { container } = render(<NavMenuButton navLinks={navLinks} />);
    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByText("和服套餐")).toBeInTheDocument();

    // 点击背景遮罩（fixed inset-0 元素）
    const overlay = container.querySelector(".fixed.inset-0");
    expect(overlay).toBeInTheDocument();
    fireEvent.click(overlay!);

    expect(screen.queryByText("和服套餐")).not.toBeInTheDocument();
  });

  it("点击链接后关闭菜单", () => {
    render(<NavMenuButton navLinks={navLinks} />);
    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByText("和服套餐")).toBeInTheDocument();

    fireEvent.click(screen.getByText("和服套餐"));
    expect(screen.queryByText("店铺信息")).not.toBeInTheDocument();
  });

  describe("样式 regression 防护", () => {
    // 防止菜单按钮字体过大，破坏 Header 视觉平衡

    it("菜单按钮文字使用 text-xs（不大于 text-sm）", () => {
      render(<NavMenuButton navLinks={navLinks} />);
      const menuLabel = screen.getByText("菜单");
      expect(menuLabel.className).toContain("text-xs");
      expect(menuLabel.className).not.toContain("text-sm");
      expect(menuLabel.className).not.toContain("text-base");
    });

    it("菜单图标不超过 w-4 h-4", () => {
      const { container } = render(<NavMenuButton navLinks={navLinks} />);
      const svg = container.querySelector("button svg");
      expect(svg).toBeInTheDocument();
      // 不应使用 w-5/h-5 或更大的尺寸
      expect(svg!.className).not.toContain("w-5");
      expect(svg!.className).not.toContain("h-5");
    });
  });
});
