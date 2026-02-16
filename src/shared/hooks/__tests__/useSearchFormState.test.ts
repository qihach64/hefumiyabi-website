/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

// Mock nuqs
const mockSetLocation = vi.fn();
const mockSetDate = vi.fn();
const mockSetTheme = vi.fn();

let mockLocationValue: string | null = null;
let mockDateValue: string | null = null;
let mockThemeValue: string | null = null;

vi.mock("nuqs", () => ({
  useQueryState: vi.fn((key: string) => {
    switch (key) {
      case "location":
        return [mockLocationValue, mockSetLocation];
      case "date":
        return [mockDateValue, mockSetDate];
      case "theme":
        return [mockThemeValue, mockSetTheme];
      default:
        return [null, vi.fn()];
    }
  }),
  parseAsString: {
    withDefault: (defaultValue: string) => ({ defaultValue }),
  },
  parseAsInteger: {
    withDefault: (defaultValue: number) => ({ defaultValue }),
  },
  parseAsArrayOf: () => ({}),
}));

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

import { useSearchFormState } from "../useSearchFormState";

const mockThemes = [
  { id: "1", slug: "traditional", name: "传统", icon: null, color: null },
  { id: "2", slug: "modern", name: "现代", icon: null, color: null },
];

describe("useSearchFormState", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocationValue = null;
    mockDateValue = null;
    mockThemeValue = null;
    mockFetch.mockResolvedValue({
      json: () => Promise.resolve({ themes: mockThemes }),
    });
  });

  describe("handleThemeSelect", () => {
    it("只更新 selectedTheme，不触发导航", () => {
      const { result } = renderHook(() => useSearchFormState({ themes: mockThemes }));

      act(() => {
        result.current.handleThemeSelect(mockThemes[0]);
      });

      expect(result.current.selectedTheme).toEqual(mockThemes[0]);
    });

    it("传入 null 清除选中主题", () => {
      const { result } = renderHook(() => useSearchFormState({ themes: mockThemes }));

      // 先选中
      act(() => {
        result.current.handleThemeSelect(mockThemes[0]);
      });
      expect(result.current.selectedTheme).toEqual(mockThemes[0]);

      // 清除
      act(() => {
        result.current.handleThemeSelect(null);
      });
      expect(result.current.selectedTheme).toBeNull();
    });
  });

  describe("buildSearchUrl", () => {
    it("无参数时返回 /plans", () => {
      const { result } = renderHook(() => useSearchFormState({ themes: mockThemes }));

      expect(result.current.buildSearchUrl()).toBe("/plans");
    });

    it("包含 location 参数", () => {
      const { result } = renderHook(() => useSearchFormState({ themes: mockThemes }));

      act(() => {
        result.current.setLocalLocation("京都");
      });

      expect(result.current.buildSearchUrl()).toBe("/plans?location=%E4%BA%AC%E9%83%BD");
    });

    it("包含 date 参数", () => {
      const { result } = renderHook(() => useSearchFormState({ themes: mockThemes }));

      act(() => {
        result.current.setLocalDate("2026-03-15");
      });

      expect(result.current.buildSearchUrl()).toBe("/plans?date=2026-03-15");
    });

    it("包含 theme 参数", () => {
      const { result } = renderHook(() => useSearchFormState({ themes: mockThemes }));

      act(() => {
        result.current.handleThemeSelect(mockThemes[0]);
      });

      expect(result.current.buildSearchUrl()).toBe("/plans?theme=traditional");
    });

    it("组合多个参数", () => {
      const { result } = renderHook(() => useSearchFormState({ themes: mockThemes }));

      act(() => {
        result.current.setLocalLocation("京都");
        result.current.setLocalDate("2026-03-15");
        result.current.handleThemeSelect(mockThemes[1]);
      });

      const url = result.current.buildSearchUrl();
      expect(url).toContain("location=");
      expect(url).toContain("date=2026-03-15");
      expect(url).toContain("theme=modern");
    });
  });

  describe("URL → 本地状态同步", () => {
    it("URL location 同步到 localLocation", () => {
      mockLocationValue = "东京";
      const { result } = renderHook(() => useSearchFormState({ themes: mockThemes }));

      expect(result.current.localLocation).toBe("东京");
    });

    it("URL date 同步到 localDate", () => {
      mockDateValue = "2026-03-15";
      const { result } = renderHook(() => useSearchFormState({ themes: mockThemes }));

      expect(result.current.localDate).toBe("2026-03-15");
    });

    it("URL theme slug 同步到 selectedTheme 对象", () => {
      mockThemeValue = "traditional";
      const { result } = renderHook(() => useSearchFormState({ themes: mockThemes }));

      expect(result.current.selectedTheme).toEqual(mockThemes[0]);
    });

    it("无效 theme slug 不设置 selectedTheme", () => {
      mockThemeValue = "nonexistent";
      const { result } = renderHook(() => useSearchFormState({ themes: mockThemes }));

      expect(result.current.selectedTheme).toBeNull();
    });
  });

  describe("主题加载", () => {
    it("传入 themes props 时不发起 fetch", () => {
      renderHook(() => useSearchFormState({ themes: mockThemes }));

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("未传入 themes 时自动加载", async () => {
      renderHook(() => useSearchFormState());

      expect(mockFetch).toHaveBeenCalledWith("/api/themes");
    });

    it("lazyLoadThemes=true 且未触发时不加载", () => {
      renderHook(() => useSearchFormState({ lazyLoadThemes: true, lazyLoadTrigger: false }));

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("lazyLoadThemes=true 且触发后加载", () => {
      renderHook(() => useSearchFormState({ lazyLoadThemes: true, lazyLoadTrigger: true }));

      expect(mockFetch).toHaveBeenCalledWith("/api/themes");
    });
  });
});
