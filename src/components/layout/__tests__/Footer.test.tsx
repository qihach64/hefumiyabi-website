/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";

// Footer 是纯展示组件，next/link 在 happy-dom 下渲染为 <a>，无需 mock
import Footer from "../Footer";

describe("Footer", () => {
  afterEach(() => {
    cleanup();
  });

  describe("品牌信息", () => {
    it("显示品牌名称", () => {
      render(<Footer />);
      expect(screen.getByText("Kimono")).toBeInTheDocument();
      expect(screen.getByText("One")).toBeInTheDocument();
    });

    it("显示品牌描述", () => {
      render(<Footer />);
      expect(screen.getByText(/专业和服租赁服务/)).toBeInTheDocument();
    });

    it("显示日文 tagline", () => {
      render(<Footer />);
      expect(screen.getByText(/伝統の美、現代の心/)).toBeInTheDocument();
    });
  });

  describe("导航链接", () => {
    it("渲染所有快速链接", () => {
      render(<Footer />);
      expect(screen.getByText("和服套餐")).toBeInTheDocument();
      expect(screen.getByText("店铺信息")).toBeInTheDocument();
      expect(screen.getByText("优惠活动")).toBeInTheDocument();
    });

    it("渲染客户服务链接", () => {
      render(<Footer />);
      expect(screen.getByText("联系我们")).toBeInTheDocument();
      expect(screen.getByText("关于我们")).toBeInTheDocument();
      expect(screen.getByText("常见问题")).toBeInTheDocument();
    });

    it("渲染合作伙伴链接", () => {
      render(<Footer />);
      expect(screen.getByText("成为商家")).toBeInTheDocument();
    });

    it("链接 href 正确", () => {
      render(<Footer />);

      const links: Record<string, string> = {
        和服套餐: "/plans",
        店铺信息: "/stores",
        优惠活动: "/campaigns",
        联系我们: "/contact",
        关于我们: "/about",
        常见问题: "/faq",
        成为商家: "/merchant/register",
      };

      for (const [text, href] of Object.entries(links)) {
        const link = screen.getByText(text).closest("a");
        expect(link).toHaveAttribute("href", href);
      }
    });
  });

  describe("联系方式", () => {
    it("显示联系信息", () => {
      render(<Footer />);
      expect(screen.getByText(/info@kimono-one.com/)).toBeInTheDocument();
      expect(screen.getByText(/东京/)).toBeInTheDocument();
    });
  });

  describe("版权信息", () => {
    it("显示动态年份", () => {
      render(<Footer />);
      const year = new Date().getFullYear();
      expect(screen.getByText(new RegExp(`© ${year}`))).toBeInTheDocument();
    });

    it("显示版权文案", () => {
      render(<Footer />);
      expect(screen.getByText(/All rights reserved/)).toBeInTheDocument();
    });
  });

  describe("结构", () => {
    it("渲染 footer 元素", () => {
      const { container } = render(<Footer />);
      expect(container.querySelector("footer")).toBeInTheDocument();
    });

    it("有社交媒体图标", () => {
      render(<Footer />);
      expect(screen.getByLabelText("Instagram")).toBeInTheDocument();
      expect(screen.getByLabelText("Twitter")).toBeInTheDocument();
      expect(screen.getByLabelText("Youtube")).toBeInTheDocument();
    });
  });
});
