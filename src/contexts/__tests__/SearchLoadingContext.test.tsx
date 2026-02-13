/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { SearchLoadingProvider, useSearchLoading } from "../SearchLoadingContext";
import type { ReactNode } from "react";

// Provider wrapper
const wrapper = ({ children }: { children: ReactNode }) => (
  <SearchLoadingProvider>{children}</SearchLoadingProvider>
);

describe("SearchLoadingContext", () => {
  describe("useSearchLoading hook", () => {
    it("在 Provider 外调用时返回默认值 (有默认 context)", () => {
      const { result } = renderHook(() => useSearchLoading());
      expect(result.current.isSearching).toBe(false);
      expect(result.current.searchTarget).toBe("");
    });

    it('初始状态: isSearching=false, searchTarget=""', () => {
      const { result } = renderHook(() => useSearchLoading(), { wrapper });
      expect(result.current.isSearching).toBe(false);
      expect(result.current.searchTarget).toBe("");
    });
  });

  describe("startSearch", () => {
    it("设置 isSearching 和 searchTarget", () => {
      const { result } = renderHook(() => useSearchLoading(), { wrapper });

      act(() => {
        result.current.startSearch("theme=modern&region=kyoto");
      });

      expect(result.current.isSearching).toBe(true);
      expect(result.current.searchTarget).toBe("theme=modern&region=kyoto");
    });

    it("连续调用覆盖之前的值", () => {
      const { result } = renderHook(() => useSearchLoading(), { wrapper });

      act(() => {
        result.current.startSearch("first");
      });
      act(() => {
        result.current.startSearch("second");
      });

      expect(result.current.isSearching).toBe(true);
      expect(result.current.searchTarget).toBe("second");
    });
  });

  describe("stopSearch", () => {
    it("清除 isSearching 和 searchTarget", () => {
      const { result } = renderHook(() => useSearchLoading(), { wrapper });

      // 先启动搜索
      act(() => {
        result.current.startSearch("some-params");
      });
      expect(result.current.isSearching).toBe(true);

      // 停止搜索
      act(() => {
        result.current.stopSearch();
      });
      expect(result.current.isSearching).toBe(false);
      expect(result.current.searchTarget).toBe("");
    });

    it("重复 stopSearch 不报错", () => {
      const { result } = renderHook(() => useSearchLoading(), { wrapper });

      act(() => {
        result.current.stopSearch();
      });
      act(() => {
        result.current.stopSearch();
      });

      expect(result.current.isSearching).toBe(false);
      expect(result.current.searchTarget).toBe("");
    });
  });

  describe("完整流程", () => {
    it("start → stop → start", () => {
      const { result } = renderHook(() => useSearchLoading(), { wrapper });

      act(() => {
        result.current.startSearch("query-1");
      });
      expect(result.current.isSearching).toBe(true);

      act(() => {
        result.current.stopSearch();
      });
      expect(result.current.isSearching).toBe(false);

      act(() => {
        result.current.startSearch("query-2");
      });
      expect(result.current.isSearching).toBe(true);
      expect(result.current.searchTarget).toBe("query-2");
    });
  });
});
