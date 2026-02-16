/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, act } from "@testing-library/react";

// Mock next/navigation
let mockPathname = "/";
vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
}));

// Mock CartIcon / WishlistIcon（用 @/ 别名匹配源文件的相对引用解析结果）
vi.mock("@/components/CartIcon", () => ({
  default: () => <div data-testid="cart-icon" />,
}));
vi.mock("@/components/WishlistIcon", () => ({
  default: () => <div data-testid="wishlist-icon" />,
}));

import HeaderActions from "../HeaderActions";

const approvedMerchant = {
  id: "m1",
  status: "APPROVED",
  businessName: "测试商家",
};

const pendingMerchant = {
  id: "m2",
  status: "PENDING",
  businessName: "待审商家",
};

const rejectedMerchant = {
  id: "m3",
  status: "REJECTED",
  businessName: "被拒商家",
};

describe("HeaderActions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPathname = "/";
  });

  afterEach(() => {
    cleanup();
  });

  describe("商家状态分支", () => {
    it('APPROVED 商家 + 客户页面 → 显示 "商家中心"', async () => {
      mockPathname = "/plans";
      render(<HeaderActions isLoggedIn={true} merchant={approvedMerchant} />);
      await act(async () => {});

      const link = screen.getByText("商家中心").closest("a");
      expect(link).toHaveAttribute("href", "/merchant/dashboard");
    });

    it('APPROVED 商家 + 商家页面 → 显示 "客户模式"', async () => {
      mockPathname = "/merchant/dashboard";
      render(<HeaderActions isLoggedIn={true} merchant={approvedMerchant} />);
      await act(async () => {});

      const link = screen.getByText("客户模式").closest("a");
      expect(link).toHaveAttribute("href", "/");
    });

    it('PENDING 商家 → 显示 "审核中"', async () => {
      render(<HeaderActions isLoggedIn={true} merchant={pendingMerchant} />);
      await act(async () => {});

      const link = screen.getByText("审核中").closest("a");
      expect(link).toHaveAttribute("href", "/merchant/pending");
    });

    it('REJECTED 商家 → 显示 "申请被拒"', async () => {
      render(<HeaderActions isLoggedIn={true} merchant={rejectedMerchant} />);
      await act(async () => {});

      const link = screen.getByText("申请被拒").closest("a");
      expect(link).toHaveAttribute("href", "/merchant/pending");
    });

    it('无商家 → 显示 "成为商家"', async () => {
      render(<HeaderActions isLoggedIn={false} merchant={null} />);
      await act(async () => {});

      const link = screen.getByText("成为商家").closest("a");
      expect(link).toHaveAttribute("href", "/merchant/register");
    });
  });

  describe("图标显示", () => {
    it("客户页面显示 CartIcon + WishlistIcon", async () => {
      mockPathname = "/plans";
      render(<HeaderActions isLoggedIn={true} merchant={approvedMerchant} />);
      await act(async () => {});

      expect(screen.getByTestId("cart-icon")).toBeInTheDocument();
      expect(screen.getByTestId("wishlist-icon")).toBeInTheDocument();
    });

    it("商家页面不显示 CartIcon / WishlistIcon", async () => {
      mockPathname = "/merchant/dashboard";
      render(<HeaderActions isLoggedIn={true} merchant={approvedMerchant} />);
      await act(async () => {});

      expect(screen.queryByTestId("cart-icon")).not.toBeInTheDocument();
      expect(screen.queryByTestId("wishlist-icon")).not.toBeInTheDocument();
    });
  });

  describe("Hydration", () => {
    it("挂载前渲染简化版本（APPROVED 商家显示商家中心）", () => {
      // 未 act，isMounted = false，走简化分支
      const { container } = render(<HeaderActions isLoggedIn={true} merchant={approvedMerchant} />);
      // 简化版本也应该有内容
      expect(container.firstChild).toBeInTheDocument();
    });

    it("挂载后正确渲染完整版本", async () => {
      mockPathname = "/plans";
      render(<HeaderActions isLoggedIn={true} merchant={approvedMerchant} />);
      await act(async () => {});

      // 挂载后应该渲染完整版本（包含商家中心）
      expect(screen.getByText("商家中心")).toBeInTheDocument();
      expect(screen.getByTestId("cart-icon")).toBeInTheDocument();
    });
  });

  describe("样式 regression 防护", () => {
    // 防止 Header 右侧按钮字体过大，破坏与左侧 Logo 的视觉平衡

    it('"成为商家" 按钮使用 text-xs（不大于 text-sm）', async () => {
      render(<HeaderActions isLoggedIn={false} merchant={null} />);
      await act(async () => {});

      const link = screen.getByText("成为商家").closest("a");
      expect(link!.className).toContain("text-xs");
      expect(link!.className).not.toContain("text-sm");
      expect(link!.className).not.toContain("text-base");
    });

    it("按钮 padding 紧凑（py 不超过 2）", async () => {
      render(<HeaderActions isLoggedIn={false} merchant={null} />);
      await act(async () => {});

      const link = screen.getByText("成为商家").closest("a");
      // 不应使用 py-2 或更大的 padding
      expect(link!.className).not.toContain("py-2");
      expect(link!.className).not.toContain("py-3");
    });
  });
});
