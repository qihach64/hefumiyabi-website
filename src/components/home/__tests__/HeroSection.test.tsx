/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, act } from "@testing-library/react";

// Mock next/image
vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => {
    const { fill, priority, sizes, quality, ...rest } = props;
    return <img {...rest} data-testid="next-image" />;
  },
}));

// Mock HeroSearchPanel 子组件
vi.mock("../HeroSearchPanel", () => ({
  default: ({ themes, variant }: { themes: unknown[]; variant: string }) => (
    <div data-testid="hero-search-panel" data-variant={variant} data-themes-count={themes.length}>
      HeroSearchPanel
    </div>
  ),
}));

// IntersectionObserver mock
type IOCallback = (entries: IntersectionObserverEntry[]) => void;
let ioCallback: IOCallback | null = null;
let ioDisconnect: ReturnType<typeof vi.fn>;

function setupIntersectionObserverMock() {
  ioDisconnect = vi.fn();
  ioCallback = null;

  const MockIO = vi.fn((callback: IOCallback) => {
    ioCallback = callback;
    return {
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: ioDisconnect,
      root: null,
      rootMargin: "",
      thresholds: [],
      takeRecords: vi.fn(() => []),
    };
  });

  vi.stubGlobal("IntersectionObserver", MockIO);
  return MockIO;
}

// 触发 IO 回调的辅助函数
function triggerIntersection(ratio: number) {
  if (!ioCallback) throw new Error("IntersectionObserver 未初始化");
  act(() => {
    ioCallback!([
      {
        intersectionRatio: ratio,
        isIntersecting: ratio > 0,
        boundingClientRect: {} as DOMRectReadOnly,
        intersectionRect: {} as DOMRectReadOnly,
        rootBounds: null,
        target: document.createElement("div"),
        time: Date.now(),
      },
    ]);
  });
}

import HeroSection from "../HeroSection";

const mockThemes = [
  { id: "1", slug: "traditional", name: "传统", icon: "🎎", color: "#E91E63" },
  { id: "2", slug: "modern", name: "现代", icon: "✨", color: "#2196F3" },
];

describe("HeroSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupIntersectionObserverMock();
  });

  afterEach(() => {
    cleanup();
  });

  describe("基础渲染", () => {
    it("渲染背景图片", () => {
      render(<HeroSection themes={mockThemes} />);
      const img = screen.getByTestId("next-image");
      expect(img).toHaveAttribute("src", "/images/hero-kimono.jpg");
      expect(img).toHaveAttribute("alt", "和服体験");
    });

    it("显示主标题", () => {
      render(<HeroSection themes={mockThemes} />);
      expect(screen.getByText("一の着物")).toBeInTheDocument();
    });

    it("显示副标题", () => {
      render(<HeroSection themes={mockThemes} />);
      expect(screen.getByText("伝統の美、現代の心")).toBeInTheDocument();
    });

    it("渲染装饰文字", () => {
      render(<HeroSection themes={mockThemes} />);
      expect(screen.getByText("京都・和服体験")).toBeInTheDocument();
      expect(screen.getByText("伝統と現代の融合")).toBeInTheDocument();
    });
  });

  describe("HeroSearchPanel", () => {
    it("传递 themes prop 给 HeroSearchPanel", () => {
      render(<HeroSection themes={mockThemes} />);
      const panel = screen.getByTestId("hero-search-panel");
      expect(panel).toHaveAttribute("data-themes-count", "2");
    });

    it("传递 light variant", () => {
      render(<HeroSection themes={mockThemes} />);
      const panel = screen.getByTestId("hero-search-panel");
      expect(panel).toHaveAttribute("data-variant", "light");
    });
  });

  describe("IntersectionObserver hysteresis 逻辑", () => {
    it("无回调时不创建 observer", () => {
      render(<HeroSection themes={mockThemes} />);
      expect(IntersectionObserver).not.toHaveBeenCalled();
    });

    it("有回调时创建 observer", () => {
      const onChange = vi.fn();
      render(<HeroSection themes={mockThemes} onHeroVisibilityChange={onChange} />);
      expect(IntersectionObserver).toHaveBeenCalledTimes(1);
    });

    it("初始状态 ratio > 0.1 → 回调 true", () => {
      const onChange = vi.fn();
      render(<HeroSection themes={mockThemes} onHeroVisibilityChange={onChange} />);
      triggerIntersection(0.5);
      expect(onChange).toHaveBeenCalledWith(true);
    });

    it("初始状态 ratio <= 0.1 → 回调 false", () => {
      const onChange = vi.fn();
      render(<HeroSection themes={mockThemes} onHeroVisibilityChange={onChange} />);
      triggerIntersection(0.05);
      expect(onChange).toHaveBeenCalledWith(false);
    });

    it("从可见到不可见：ratio < 0.05 → 回调 false", () => {
      const onChange = vi.fn();
      render(<HeroSection themes={mockThemes} onHeroVisibilityChange={onChange} />);

      // 先变为可见
      triggerIntersection(0.5);
      expect(onChange).toHaveBeenCalledWith(true);
      onChange.mockClear();

      // ratio < 0.05 → 不可见
      triggerIntersection(0.02);
      expect(onChange).toHaveBeenCalledWith(false);
    });

    it("从可见到迟滞区间(0.05 ≤ ratio ≤ 0.2)：不触发变化", () => {
      const onChange = vi.fn();
      render(<HeroSection themes={mockThemes} onHeroVisibilityChange={onChange} />);

      // 先变为可见
      triggerIntersection(0.5);
      onChange.mockClear();

      // 迟滞区间 → 保持可见，不触发
      triggerIntersection(0.1);
      expect(onChange).not.toHaveBeenCalled();
    });

    it("从不可见到迟滞区间(ratio ≤ 0.2)：不触发变化", () => {
      const onChange = vi.fn();
      render(<HeroSection themes={mockThemes} onHeroVisibilityChange={onChange} />);

      // 先变为不可见
      triggerIntersection(0.02);
      expect(onChange).toHaveBeenCalledWith(false);
      onChange.mockClear();

      // 迟滞区间 → 保持不可见，不触发
      triggerIntersection(0.15);
      expect(onChange).not.toHaveBeenCalled();
    });

    it("从不可见到可见：ratio > 0.2 → 回调 true", () => {
      const onChange = vi.fn();
      render(<HeroSection themes={mockThemes} onHeroVisibilityChange={onChange} />);

      // 先变为不可见
      triggerIntersection(0.02);
      onChange.mockClear();

      // ratio > 0.2 → 可见
      triggerIntersection(0.3);
      expect(onChange).toHaveBeenCalledWith(true);
    });

    it("组件卸载 → observer.disconnect() 被调用", () => {
      const onChange = vi.fn();
      const { unmount } = render(
        <HeroSection themes={mockThemes} onHeroVisibilityChange={onChange} />
      );
      unmount();
      expect(ioDisconnect).toHaveBeenCalled();
    });
  });

  describe("结构", () => {
    it("渲染 section 元素", () => {
      const { container } = render(<HeroSection themes={mockThemes} />);
      expect(container.querySelector("section")).toBeInTheDocument();
    });
  });

  describe("布局 regression 防护", () => {
    // 防止 Hero 内容因负 margin 过大而偏离视觉中心
    // 曾因 -mt-24 + -mt-12 累计 -144px 导致内容严重偏上

    it("主内容区负 margin 不超过 -mt-12（防止内容偏上）", () => {
      const { container } = render(<HeroSection themes={mockThemes} />);
      // 定位主内容 flex 容器（z-10 + flex + justify-center）
      const contentArea = container.querySelector(".z-10.flex.flex-col");
      expect(contentArea).toBeInTheDocument();

      const classes = contentArea!.className;
      // 不应包含 -mt-16/-mt-20/-mt-24 等过大的负 margin
      const excessiveMargins = ["-mt-16", "-mt-20", "-mt-24", "-mt-28", "-mt-32"];
      for (const m of excessiveMargins) {
        // 检查 class 中是否存在（包括带 md: 前缀的响应式变体）
        expect(classes).not.toContain(m);
      }
    });

    it("标题区域不应有大幅负 margin（防止标题偏上）", () => {
      const { container } = render(<HeroSection themes={mockThemes} />);
      // 标题 h1 的父级 div
      const titleH1 = container.querySelector("h1");
      expect(titleH1).toBeInTheDocument();
      // 往上找到包含 text-center 的标题区域 div
      const titleArea = titleH1!.closest(".text-center");
      expect(titleArea).toBeInTheDocument();

      const classes = titleArea!.className;
      const excessiveMargins = ["-mt-8", "-mt-10", "-mt-12", "-mt-16", "-mt-20", "-mt-24"];
      for (const m of excessiveMargins) {
        expect(classes).not.toContain(m);
      }
    });
  });
});
