/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";

// Mock next/image
vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => {
    const { fill, priority, sizes, quality, ...rest } = props;
    return <img {...rest} data-testid="next-image" />;
  },
}));

// Mock next/navigation
const mockSearchParams = new URLSearchParams();
vi.mock("next/navigation", () => ({
  useSearchParams: () => mockSearchParams,
}));

// Mock useCartToggle
const mockHandleToggleCart = vi.fn(
  (e: { preventDefault: () => void; stopPropagation: () => void }) => {
    e.preventDefault();
    e.stopPropagation();
  }
);
const mockCartState = {
  isInCart: false,
  isAdding: false,
  justChanged: false,
  lastAction: null as "add" | "remove" | null,
  handleToggleCart: mockHandleToggleCart,
};
vi.mock("../useCartToggle", () => ({
  useCartToggle: () => mockCartState,
}));

// Mock Badge
vi.mock("@/components/ui", () => ({
  Badge: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
    <span data-testid="badge" {...props}>
      {children}
    </span>
  ),
}));

import PlanCard from "../index";

// 基础测试数据
const basePlan = {
  id: "plan-1",
  name: "樱花和服套餐",
  price: 980000, // ¥9,800
  imageUrl: "https://example.com/kimono.jpg",
};

describe("PlanCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // 重置 cart 状态
    mockCartState.isInCart = false;
    mockCartState.isAdding = false;
    mockCartState.justChanged = false;
    mockCartState.lastAction = null;
    // 重置 searchParams
    mockSearchParams.delete("date");
    mockSearchParams.delete("guests");
    mockSearchParams.delete("men");
    mockSearchParams.delete("women");
    mockSearchParams.delete("children");
  });

  afterEach(() => {
    cleanup();
  });

  describe("基础渲染", () => {
    it("显示套餐名称", () => {
      render(<PlanCard plan={basePlan} />);
      expect(screen.getByText("樱花和服套餐")).toBeInTheDocument();
    });

    it("显示价格（分转元）", () => {
      render(<PlanCard plan={basePlan} />);
      expect(screen.getByText(/¥9,800/)).toBeInTheDocument();
      expect(screen.getByText(/\/人/)).toBeInTheDocument();
    });

    it("渲染图片", () => {
      render(<PlanCard plan={basePlan} />);
      const img = screen.getByTestId("next-image");
      expect(img).toHaveAttribute("src", "https://example.com/kimono.jpg");
      expect(img).toHaveAttribute("alt", "樱花和服套餐");
    });

    it("无图片时显示 fallback", () => {
      render(<PlanCard plan={{ ...basePlan, imageUrl: undefined }} />);
      expect(screen.queryByTestId("next-image")).not.toBeInTheDocument();
      expect(screen.getByText("👘")).toBeInTheDocument();
    });
  });

  describe("商家信息", () => {
    it("showMerchant=true 时显示商家名称", () => {
      render(<PlanCard plan={{ ...basePlan, merchantName: "京都本店" }} showMerchant={true} />);
      expect(screen.getByText("京都本店")).toBeInTheDocument();
    });

    it("showMerchant=false 时不显示商家名称", () => {
      render(<PlanCard plan={{ ...basePlan, merchantName: "京都本店" }} showMerchant={false} />);
      expect(screen.queryByText("京都本店")).not.toBeInTheDocument();
    });

    it("显示地区信息", () => {
      render(<PlanCard plan={{ ...basePlan, region: "京都" }} />);
      expect(screen.getByText("京都")).toBeInTheDocument();
    });
  });

  describe("价格展示", () => {
    it("有折扣时显示原价和省钱标签", () => {
      render(<PlanCard plan={{ ...basePlan, originalPrice: 1200000 }} />);
      // 原价 ¥12,000
      expect(screen.getByText("¥12,000")).toBeInTheDocument();
      // 省 ¥2,200
      expect(screen.getByText(/省¥2,200/)).toBeInTheDocument();
    });

    it("无折扣时仅显示现价", () => {
      render(<PlanCard plan={basePlan} />);
      expect(screen.getByText(/¥9,800/)).toBeInTheDocument();
      expect(screen.queryByText(/省¥/)).not.toBeInTheDocument();
    });

    it("originalPrice <= price 时不显示折扣", () => {
      render(<PlanCard plan={{ ...basePlan, originalPrice: 980000 }} />);
      expect(screen.queryByText(/省¥/)).not.toBeInTheDocument();
    });
  });

  describe("包含项", () => {
    it("显示前两项包含物", () => {
      render(<PlanCard plan={{ ...basePlan, includes: ["和服", "腰带", "发型"] }} />);
      expect(screen.getByText(/含 和服 · 腰带/)).toBeInTheDocument();
    });

    it('超过两项显示"等N项"', () => {
      render(<PlanCard plan={{ ...basePlan, includes: ["和服", "腰带", "发型"] }} />);
      expect(screen.getByText(/等3项/)).toBeInTheDocument();
    });

    it("无 includes 时不渲染", () => {
      const { container } = render(<PlanCard plan={basePlan} />);
      expect(container.querySelector(".line-clamp-1")).not.toBeInTheDocument();
    });
  });

  describe("标签", () => {
    const planWithTags = {
      ...basePlan,
      planTags: [
        { tag: { id: "1", code: "traditional", name: "传统", icon: "🎎", color: null } },
        { tag: { id: "2", code: "romantic", name: "浪漫", icon: null, color: null } },
        { tag: { id: "3", code: "photo", name: "摄影", icon: "📸", color: null } },
        { tag: { id: "4", code: "couple", name: "情侣", icon: null, color: null } },
      ],
    };

    it("最多显示 3 个标签", () => {
      render(<PlanCard plan={planWithTags} />);
      expect(screen.getByText("传统")).toBeInTheDocument();
      expect(screen.getByText("浪漫")).toBeInTheDocument();
      expect(screen.getByText("摄影")).toBeInTheDocument();
      expect(screen.queryByText("情侣")).not.toBeInTheDocument();
    });

    it("超过 3 个标签显示 +N", () => {
      render(<PlanCard plan={planWithTags} />);
      expect(screen.getByText("+1")).toBeInTheDocument();
    });

    it("标签有 icon 时显示", () => {
      render(<PlanCard plan={planWithTags} />);
      expect(screen.getByText("🎎")).toBeInTheDocument();
    });
  });

  describe("详情链接", () => {
    it("链接指向 /plans/[id]", () => {
      render(<PlanCard plan={basePlan} />);
      const link = screen.getByRole("link");
      expect(link).toHaveAttribute("href", "/plans/plan-1");
    });

    it("保留 URL 搜索参数到详情链接", () => {
      mockSearchParams.set("date", "2025-03-01");
      mockSearchParams.set("guests", "2");
      render(<PlanCard plan={basePlan} />);
      const link = screen.getByRole("link");
      const href = link.getAttribute("href")!;
      expect(href).toContain("date=2025-03-01");
      expect(href).toContain("guests=2");
    });

    it("无搜索参数时链接不带 query string", () => {
      render(<PlanCard plan={basePlan} />);
      const link = screen.getByRole("link");
      expect(link).toHaveAttribute("href", "/plans/plan-1");
    });

    it('链接在当前窗口打开（无 target="_blank"）', () => {
      render(<PlanCard plan={basePlan} />);
      const link = screen.getByRole("link");
      expect(link).not.toHaveAttribute("target", "_blank");
    });
  });

  describe("购物车交互", () => {
    it('未在购物车时按钮显示"加入购物车"', () => {
      render(<PlanCard plan={basePlan} />);
      const btn = screen.getByRole("button", { name: "加入购物车" });
      expect(btn).toBeInTheDocument();
    });

    it('已在购物车时按钮显示"从购物车移除"', () => {
      mockCartState.isInCart = true;
      render(<PlanCard plan={basePlan} />);
      const btn = screen.getByRole("button", { name: "从购物车移除" });
      expect(btn).toBeInTheDocument();
    });

    it("点击购物车按钮调用 handleToggleCart", () => {
      render(<PlanCard plan={basePlan} />);
      const btn = screen.getByRole("button", { name: "加入购物车" });
      fireEvent.click(btn);
      expect(mockHandleToggleCart).toHaveBeenCalled();
    });

    it("isAdding 时按钮禁用", () => {
      mockCartState.isAdding = true;
      render(<PlanCard plan={basePlan} />);
      const btn = screen.getByRole("button");
      expect(btn).toBeDisabled();
    });
  });

  describe("推荐标签", () => {
    it("isRecommended=true 时显示推荐标签", () => {
      render(<PlanCard plan={basePlan} isRecommended={true} />);
      expect(screen.getByText(/为您推荐/)).toBeInTheDocument();
    });

    it("isRecommended=false 时不显示推荐标签", () => {
      render(<PlanCard plan={basePlan} isRecommended={false} />);
      expect(screen.queryByText(/为您推荐/)).not.toBeInTheDocument();
    });
  });
});
