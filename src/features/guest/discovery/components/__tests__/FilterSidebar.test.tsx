/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { FilterSidebar } from "../FilterSidebar";

const mockStores = [
  { id: "store-1", name: "京都本店", slug: "kyoto", region: "京都" },
  { id: "store-2", name: "大阪店", slug: "osaka", region: "大阪" },
];

const mockTagCategories = [
  {
    id: "cat-1",
    code: "style",
    name: "风格",
    nameEn: "Style",
    icon: "🎨",
    color: null,
    tags: [
      { id: "tag-1", code: "formal", name: "正装", nameEn: "Formal", icon: null, color: null },
      { id: "tag-2", code: "casual", name: "休闲", nameEn: "Casual", icon: null, color: null },
    ],
  },
];

const mockRegions = ["京都", "大阪", "东京"];

const defaultProps = {
  stores: mockStores,
  tagCategories: mockTagCategories,
  regions: mockRegions,
  selectedStoreId: null as string | null,
  setSelectedStoreId: vi.fn(),
  selectedRegion: null as string | null,
  setSelectedRegion: vi.fn(),
  selectedTagIds: [] as string[],
  toggleTag: vi.fn(),
  clearFilters: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  cleanup();
});

describe("FilterSidebar", () => {
  describe("渲染", () => {
    it("渲染筛选条件标题", () => {
      render(<FilterSidebar {...defaultProps} />);
      expect(screen.getByText("筛选条件")).toBeInTheDocument();
    });

    it("渲染店铺筛选区", () => {
      render(<FilterSidebar {...defaultProps} />);
      expect(screen.getByText("选择店铺")).toBeInTheDocument();
      expect(screen.getByText("全部店铺")).toBeInTheDocument();
    });

    it("渲染地区筛选区", () => {
      render(<FilterSidebar {...defaultProps} />);
      expect(screen.getByText("选择地区")).toBeInTheDocument();
      expect(screen.getByText("全部地区")).toBeInTheDocument();
    });

    it("渲染标签分类", () => {
      render(<FilterSidebar {...defaultProps} />);
      expect(screen.getByText("风格")).toBeInTheDocument();
      expect(screen.getByText("正装")).toBeInTheDocument();
      expect(screen.getByText("休闲")).toBeInTheDocument();
    });
  });

  describe("店铺筛选", () => {
    it("点击店铺按钮调用 setSelectedStoreId", () => {
      render(<FilterSidebar {...defaultProps} />);
      fireEvent.click(screen.getByText("京都本店"));
      expect(defaultProps.setSelectedStoreId).toHaveBeenCalledWith("store-1");
    });

    it('点击"全部店铺"清除选中', () => {
      render(<FilterSidebar {...defaultProps} selectedStoreId="store-1" />);
      fireEvent.click(screen.getByText("全部店铺"));
      expect(defaultProps.setSelectedStoreId).toHaveBeenCalledWith(null);
    });
  });

  describe("地区筛选", () => {
    it("点击地区按钮调用 setSelectedRegion", () => {
      render(<FilterSidebar {...defaultProps} />);
      fireEvent.click(screen.getByText("京都"));
      expect(defaultProps.setSelectedRegion).toHaveBeenCalledWith("京都");
    });

    it('点击"全部地区"清除选中', () => {
      render(<FilterSidebar {...defaultProps} selectedRegion="京都" />);
      fireEvent.click(screen.getByText("全部地区"));
      expect(defaultProps.setSelectedRegion).toHaveBeenCalledWith(null);
    });
  });

  describe("标签筛选", () => {
    it("点击标签调用 toggleTag", () => {
      render(<FilterSidebar {...defaultProps} />);
      fireEvent.click(screen.getByText("正装"));
      expect(defaultProps.toggleTag).toHaveBeenCalledWith("tag-1");
    });

    it("已选中标签显示高亮", () => {
      render(<FilterSidebar {...defaultProps} selectedTagIds={["tag-1"]} />);
      const tagButton = screen.getByText("正装").closest("button");
      expect(tagButton?.className).toContain("ring-2");
    });
  });

  describe("清除筛选", () => {
    it("有筛选条件时显示清除按钮", () => {
      render(<FilterSidebar {...defaultProps} selectedStoreId="store-1" />);
      expect(screen.getByText("清除")).toBeInTheDocument();
    });

    it("无筛选条件时不显示清除按钮", () => {
      render(<FilterSidebar {...defaultProps} />);
      expect(screen.queryByText("清除")).not.toBeInTheDocument();
    });

    it("点击清除按钮调用 clearFilters", () => {
      render(<FilterSidebar {...defaultProps} selectedStoreId="store-1" />);
      fireEvent.click(screen.getByText("清除"));
      expect(defaultProps.clearFilters).toHaveBeenCalled();
    });
  });
});
