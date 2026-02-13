/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { StoreFilter } from "../StoreFilter";

const mockStores = [
  { id: "store-1", name: "京都本店" },
  { id: "store-2", name: "大阪店" },
  { id: "store-3", name: "东京店" },
];

const mockOnStoreChange = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  cleanup();
});

describe("StoreFilter", () => {
  it("渲染标签和下拉框", () => {
    render(
      <StoreFilter stores={mockStores} selectedStoreId={null} onStoreChange={mockOnStoreChange} />
    );
    expect(screen.getByText("筛选店铺")).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it('显示"所有店铺"和所有店铺选项', () => {
    render(
      <StoreFilter stores={mockStores} selectedStoreId={null} onStoreChange={mockOnStoreChange} />
    );
    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(4); // "所有店铺" + 3 个店铺
    expect(options[0]).toHaveTextContent("所有店铺");
    expect(options[1]).toHaveTextContent("京都本店");
    expect(options[2]).toHaveTextContent("大阪店");
    expect(options[3]).toHaveTextContent("东京店");
  });

  it('默认选中"所有店铺"', () => {
    render(
      <StoreFilter stores={mockStores} selectedStoreId={null} onStoreChange={mockOnStoreChange} />
    );
    const select = screen.getByRole("combobox") as HTMLSelectElement;
    expect(select.value).toBe("");
  });

  it("选中特定店铺时显示正确", () => {
    render(
      <StoreFilter
        stores={mockStores}
        selectedStoreId="store-2"
        onStoreChange={mockOnStoreChange}
      />
    );
    const select = screen.getByRole("combobox") as HTMLSelectElement;
    expect(select.value).toBe("store-2");
  });

  it("选择店铺时调用 onStoreChange(storeId)", () => {
    render(
      <StoreFilter stores={mockStores} selectedStoreId={null} onStoreChange={mockOnStoreChange} />
    );
    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "store-1" } });
    expect(mockOnStoreChange).toHaveBeenCalledWith("store-1");
  });

  it('选择"所有店铺"时调用 onStoreChange(null)', () => {
    render(
      <StoreFilter
        stores={mockStores}
        selectedStoreId="store-1"
        onStoreChange={mockOnStoreChange}
      />
    );
    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "" } });
    expect(mockOnStoreChange).toHaveBeenCalledWith(null);
  });

  it('空店铺列表只显示"所有店铺"', () => {
    render(<StoreFilter stores={[]} selectedStoreId={null} onStoreChange={mockOnStoreChange} />);
    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(1);
    expect(options[0]).toHaveTextContent("所有店铺");
  });
});
