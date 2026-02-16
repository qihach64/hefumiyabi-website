/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";

// Mock useSearchState
const mockSetSort = vi.fn().mockResolvedValue(undefined);
const mockState = { sort: null as string | null };

vi.mock("@/shared/hooks", () => ({
  useSearchState: () => ({
    sort: mockState.sort,
    setSort: mockSetSort,
    // 其他字段省略（组件不使用）
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
    category: null,
    setCategory: vi.fn(),
    tags: null,
    setTags: vi.fn(),
    hasFilters: false,
    clearAll: vi.fn(),
    setPriceRange: vi.fn(),
  }),
}));

import { SortSelector } from "../SortSelector";

beforeEach(() => {
  vi.clearAllMocks();
  mockState.sort = null;
});

afterEach(() => {
  cleanup();
});

describe("SortSelector", () => {
  it("渲染排序标签和下拉框", () => {
    render(<SortSelector />);
    expect(screen.getByText("排序:")).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it('默认选中"推荐排序"', () => {
    render(<SortSelector />);
    const select = screen.getByRole("combobox") as HTMLSelectElement;
    expect(select.value).toBe("recommended");
  });

  it("显示所有三个选项", () => {
    render(<SortSelector />);
    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(3);
    expect(options[0]).toHaveTextContent("推荐排序");
    expect(options[1]).toHaveTextContent("价格从低到高");
    expect(options[2]).toHaveTextContent("价格从高到低");
  });

  it('选择"价格从低到高"时调用 setSort("price_asc")', () => {
    render(<SortSelector />);
    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "price_asc" } });
    expect(mockSetSort).toHaveBeenCalledWith("price_asc");
  });

  it('选择"价格从高到低"时调用 setSort("price_desc")', () => {
    render(<SortSelector />);
    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "price_desc" } });
    expect(mockSetSort).toHaveBeenCalledWith("price_desc");
  });

  it('选择"推荐排序"时调用 setSort(null)', () => {
    mockState.sort = "price_asc";
    render(<SortSelector />);
    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "recommended" } });
    expect(mockSetSort).toHaveBeenCalledWith(null);
  });

  it("当 sort 有值时显示对应选项", () => {
    mockState.sort = "price_desc";
    render(<SortSelector />);
    const select = screen.getByRole("combobox") as HTMLSelectElement;
    expect(select.value).toBe("price_desc");
  });
});
