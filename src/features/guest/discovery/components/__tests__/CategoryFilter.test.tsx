/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";

// Mock useSearchState
const mockSetCategory = vi.fn().mockResolvedValue(undefined);
const mockState = { category: null as string | null };

vi.mock("@/shared/hooks", () => ({
  useSearchState: () => ({
    category: mockState.category,
    setCategory: mockSetCategory,
    // 其他字段
    location: null,
    setLocation: vi.fn(),
    date: null,
    setDate: vi.fn(),
    theme: null,
    setTheme: vi.fn(),
    guests: 1,
    setGuests: vi.fn(),
    minPrice: null,
    maxPrice: null,
    setMinPrice: vi.fn(),
    setMaxPrice: vi.fn(),
    sort: null,
    setSort: vi.fn(),
    tags: null,
    setTags: vi.fn(),
    hasFilters: false,
    clearAll: vi.fn(),
    setPriceRange: vi.fn(),
  }),
}));

import { CategoryFilter } from "../CategoryFilter";

beforeEach(() => {
  vi.clearAllMocks();
  mockState.category = null;
});

afterEach(() => {
  cleanup();
});

describe("CategoryFilter", () => {
  it("渲染所有分类按钮", () => {
    render(<CategoryFilter />);
    expect(screen.getByText("全部")).toBeInTheDocument();
    expect(screen.getByText("女士")).toBeInTheDocument();
    expect(screen.getByText("男士")).toBeInTheDocument();
    expect(screen.getByText("情侣")).toBeInTheDocument();
    expect(screen.getByText("亲子")).toBeInTheDocument();
    expect(screen.getByText("团体")).toBeInTheDocument();
    expect(screen.getByText("特别")).toBeInTheDocument();
    expect(screen.getByText("AI试穿")).toBeInTheDocument();
  });

  it('默认选中"全部"', () => {
    render(<CategoryFilter />);
    const allButton = screen.getByText("全部").closest("button");
    expect(allButton?.className).toContain("text-sakura-600");
  });

  it("点击分类按钮调用 setCategory", () => {
    render(<CategoryFilter />);
    fireEvent.click(screen.getByText("女士"));
    expect(mockSetCategory).toHaveBeenCalledWith("LADIES");
  });

  it('点击"全部"时传入 null', () => {
    mockState.category = "LADIES";
    render(<CategoryFilter />);
    fireEvent.click(screen.getByText("全部"));
    expect(mockSetCategory).toHaveBeenCalledWith(null);
  });

  it("当前选中分类高亮显示", () => {
    mockState.category = "MENS";
    render(<CategoryFilter />);
    const mensButton = screen.getByText("男士").closest("button");
    expect(mensButton?.className).toContain("text-sakura-600");
  });

  it("未选中的分类不高亮", () => {
    mockState.category = "LADIES";
    render(<CategoryFilter />);
    const mensButton = screen.getByText("男士").closest("button");
    expect(mensButton?.className).toContain("text-gray-600");
  });
});
