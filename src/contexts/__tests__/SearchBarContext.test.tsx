/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { SearchBarProvider, useSearchBar } from "../SearchBarContext";
import type { ReactNode } from "react";

// Provider wrapper
const wrapper = ({ children }: { children: ReactNode }) => (
  <SearchBarProvider>{children}</SearchBarProvider>
);

describe("SearchBarContext", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // 重置 scrollY
    Object.defineProperty(window, "scrollY", { value: 0, writable: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("useSearchBar hook", () => {
    it("在 Provider 外调用时抛出错误", () => {
      // 抑制 console.error (React 会打印错误信息)
      const spy = vi.spyOn(console, "error").mockImplementation(() => {});
      expect(() => {
        renderHook(() => useSearchBar());
      }).toThrow("useSearchBar must be used within a SearchBarProvider");
      spy.mockRestore();
    });

    it("初始状态正确", () => {
      const { result } = renderHook(() => useSearchBar(), { wrapper });

      expect(result.current.isSearchBarExpanded).toBe(true);
      expect(result.current.isHeroVisible).toBe(true);
      expect(result.current.hideSearchBar).toBe(false);
      expect(result.current.hideThemeSelector).toBe(false);
    });
  });

  describe("setIsSearchBarExpanded", () => {
    it("可以手动设置展开状态", () => {
      const { result } = renderHook(() => useSearchBar(), { wrapper });

      act(() => {
        result.current.setIsSearchBarExpanded(false);
      });
      expect(result.current.isSearchBarExpanded).toBe(false);

      act(() => {
        result.current.setIsSearchBarExpanded(true);
      });
      expect(result.current.isSearchBarExpanded).toBe(true);
    });
  });

  describe("setIsHeroVisible", () => {
    it("可以设置 Hero 可见性", () => {
      const { result } = renderHook(() => useSearchBar(), { wrapper });

      act(() => {
        result.current.setIsHeroVisible(false);
      });
      expect(result.current.isHeroVisible).toBe(false);
    });
  });

  describe("setHideSearchBar", () => {
    it("可以设置搜索栏隐藏", () => {
      const { result } = renderHook(() => useSearchBar(), { wrapper });

      act(() => {
        result.current.setHideSearchBar(true);
      });
      expect(result.current.hideSearchBar).toBe(true);
    });
  });

  describe("setHideThemeSelector", () => {
    it("可以设置主题选择器隐藏", () => {
      const { result } = renderHook(() => useSearchBar(), { wrapper });

      act(() => {
        result.current.setHideThemeSelector(true);
      });
      expect(result.current.hideThemeSelector).toBe(true);
    });
  });

  describe("expandManually", () => {
    it("手动展开搜索栏", () => {
      const { result } = renderHook(() => useSearchBar(), { wrapper });

      // 先收起
      act(() => {
        result.current.setIsSearchBarExpanded(false);
      });
      expect(result.current.isSearchBarExpanded).toBe(false);

      // 手动展开
      act(() => {
        result.current.expandManually();
      });
      expect(result.current.isSearchBarExpanded).toBe(true);
    });
  });

  describe("移动端搜索模态框", () => {
    it("初始状态为关闭", () => {
      const { result } = renderHook(() => useSearchBar(), { wrapper });
      expect(result.current.isMobileSearchModalOpen).toBe(false);
    });

    it("openMobileSearchModal / closeMobileSearchModal 正确切换状态", () => {
      const { result } = renderHook(() => useSearchBar(), { wrapper });

      act(() => {
        result.current.openMobileSearchModal();
      });
      expect(result.current.isMobileSearchModalOpen).toBe(true);

      act(() => {
        result.current.closeMobileSearchModal();
      });
      expect(result.current.isMobileSearchModalOpen).toBe(false);
    });

    it("返回所有 BottomNav 依赖的方法", () => {
      const { result } = renderHook(() => useSearchBar(), { wrapper });

      // BottomNav 依赖这些方法，缺少会导致 undefined 调用
      expect(result.current.openMobileSearchModal).toBeDefined();
      expect(result.current.closeMobileSearchModal).toBeDefined();
      expect(typeof result.current.isMobileSearchModalOpen).toBe("boolean");
    });
  });

  describe("scroll 行为", () => {
    it("滚动超过阈值(100px)后搜索栏收起", async () => {
      const { result } = renderHook(() => useSearchBar(), { wrapper });
      expect(result.current.isSearchBarExpanded).toBe(true);

      // 模拟滚动超过阈值
      Object.defineProperty(window, "scrollY", { value: 150, writable: true });

      await act(async () => {
        window.dispatchEvent(new Event("scroll"));
        // requestAnimationFrame callback
        vi.advanceTimersByTime(16);
      });

      expect(result.current.isSearchBarExpanded).toBe(false);
    });

    it("滚回顶部(<=100px)后搜索栏展开", async () => {
      const { result } = renderHook(() => useSearchBar(), { wrapper });

      // 先滚动超过阈值
      Object.defineProperty(window, "scrollY", { value: 150, writable: true });
      await act(async () => {
        window.dispatchEvent(new Event("scroll"));
        vi.advanceTimersByTime(16);
      });
      expect(result.current.isSearchBarExpanded).toBe(false);

      // 滚回顶部
      Object.defineProperty(window, "scrollY", { value: 50, writable: true });
      await act(async () => {
        window.dispatchEvent(new Event("scroll"));
        vi.advanceTimersByTime(16);
      });

      expect(result.current.isSearchBarExpanded).toBe(true);
    });

    it("在阈值内滚动不触发状态变更", async () => {
      const { result } = renderHook(() => useSearchBar(), { wrapper });

      // 滚动但未超阈值
      Object.defineProperty(window, "scrollY", { value: 80, writable: true });
      await act(async () => {
        window.dispatchEvent(new Event("scroll"));
        vi.advanceTimersByTime(16);
      });

      expect(result.current.isSearchBarExpanded).toBe(true);
    });
  });
});
