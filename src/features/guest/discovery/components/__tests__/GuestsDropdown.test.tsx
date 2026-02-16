/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { GuestsDropdown } from "../GuestsDropdown";

const mockOnChange = vi.fn();
const mockOnDetailChange = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  cleanup();
});

// 辅助: 打开下拉框
function openDropdown() {
  const trigger = document.querySelector("[data-guests-trigger]") as HTMLElement;
  fireEvent.click(trigger);
}

describe("GuestsDropdown", () => {
  describe("渲染", () => {
    it("显示客人数量 (内部状态: 默认 women=1)", () => {
      render(<GuestsDropdown value={1} onChange={mockOnChange} />);
      // 默认 men=0, women=1, children=0 → totalGuests=1
      expect(screen.getByText("1 位客人")).toBeInTheDocument();
    });

    it("使用 initialDetail 显示正确总数", () => {
      render(
        <GuestsDropdown
          value={3}
          onChange={mockOnChange}
          initialDetail={{ total: 3, men: 1, women: 1, children: 1 }}
        />
      );
      expect(screen.getByText("3 位客人")).toBeInTheDocument();
    });

    it("默认不显示下拉面板", () => {
      render(<GuestsDropdown value={1} onChange={mockOnChange} />);
      expect(screen.queryByText("男士")).not.toBeInTheDocument();
    });
  });

  describe("下拉交互", () => {
    it("点击触发按钮打开下拉面板", () => {
      render(<GuestsDropdown value={1} onChange={mockOnChange} />);
      openDropdown();
      expect(screen.getByText("男士")).toBeInTheDocument();
      expect(screen.getByText("女士")).toBeInTheDocument();
      expect(screen.getByText("儿童")).toBeInTheDocument();
    });

    it("点击外部区域关闭下拉面板", () => {
      render(<GuestsDropdown value={1} onChange={mockOnChange} />);
      openDropdown();
      expect(screen.getByText("男士")).toBeInTheDocument();

      fireEvent.mouseDown(document.body);
      expect(screen.queryByText("男士")).not.toBeInTheDocument();
    });
  });

  describe("计数操作", () => {
    it("增加人数时调用 onChange", () => {
      render(<GuestsDropdown value={1} onChange={mockOnChange} />);
      openDropdown();

      // 找所有按钮，每个分类有 - 和 + 两个按钮
      const buttons = screen.getAllByRole("button");
      // 过滤出非 trigger 的按钮 (下拉面板中的按钮)
      const panelButtons = buttons.filter((b) => !b.hasAttribute("data-guests-trigger"));
      // 第 2 个按钮应是男士的 + 按钮 (第 1 个是 -)
      fireEvent.click(panelButtons[1]);

      expect(mockOnChange).toHaveBeenCalled();
    });

    it("人数为 0 的分类减少按钮被禁用", () => {
      // 默认: men=0, women=1, children=0
      render(<GuestsDropdown value={1} onChange={mockOnChange} />);
      openDropdown();

      // 找所有禁用的按钮（men=0 和 children=0 的减少按钮）
      const disabledButtons = screen
        .getAllByRole("button")
        .filter((b) => b.hasAttribute("disabled"));
      expect(disabledButtons.length).toBe(2);
    });

    it("传递 onDetailChange 时回调包含详细信息", () => {
      render(
        <GuestsDropdown value={1} onChange={mockOnChange} onDetailChange={mockOnDetailChange} />
      );
      openDropdown();

      // 点击第一个 + 按钮（男士增加）
      const buttons = screen
        .getAllByRole("button")
        .filter((b) => !b.hasAttribute("data-guests-trigger") && !b.hasAttribute("disabled"));
      fireEvent.click(buttons[0]);

      expect(mockOnDetailChange).toHaveBeenCalled();
      const detail = mockOnDetailChange.mock.calls[0][0];
      expect(detail).toHaveProperty("total");
      expect(detail).toHaveProperty("men");
      expect(detail).toHaveProperty("women");
      expect(detail).toHaveProperty("children");
    });
  });

  describe("initialDetail", () => {
    it("使用 initialDetail 初始化各分类数量", () => {
      render(
        <GuestsDropdown
          value={5}
          onChange={mockOnChange}
          initialDetail={{ total: 5, men: 2, women: 2, children: 1 }}
        />
      );
      openDropdown();
      // 验证能看到各分类的计数 (men=2, women=2, children=1)
      const counts = screen.getAllByText("2", { selector: "span" });
      expect(counts.length).toBeGreaterThanOrEqual(2); // 男士2 + 女士2
    });
  });

  describe("提示信息", () => {
    it("显示人数限制提示", () => {
      render(<GuestsDropdown value={1} onChange={mockOnChange} />);
      openDropdown();
      expect(screen.getByText(/至少选择1位客人/)).toBeInTheDocument();
    });
  });
});
