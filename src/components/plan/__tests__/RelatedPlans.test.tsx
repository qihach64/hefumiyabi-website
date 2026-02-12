/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";

// Mock PlanCard 为简化骨架
vi.mock("@/features/guest/plans", () => ({
  PlanCard: ({ plan }: { plan: { id: string; name: string } }) => (
    <div data-testid={`plan-card-${plan.id}`}>{plan.name}</div>
  ),
}));

import RelatedPlans from "../RelatedPlans";

const mockPlans = [
  { id: "p1", name: "樱花套餐", price: 980000 },
  { id: "p2", name: "枫叶套餐", price: 1280000 },
  { id: "p3", name: "竹林套餐", price: 780000 },
];

describe("RelatedPlans", () => {
  afterEach(() => {
    cleanup();
  });

  it("空数组返回 null（不渲染）", () => {
    const { container } = render(<RelatedPlans plans={[]} />);
    expect(container.innerHTML).toBe("");
  });

  it('显示 "猜你喜欢" 标题', () => {
    render(<RelatedPlans plans={mockPlans} />);
    expect(screen.getByText("猜你喜欢")).toBeInTheDocument();
  });

  it('有 themeName 时显示 "· {themeName}主题"', () => {
    render(<RelatedPlans plans={mockPlans} themeName="樱花" />);
    expect(screen.getByText("· 樱花主题")).toBeInTheDocument();
  });

  it('有 themeSlug 时显示 "查看全部" 链接', () => {
    render(<RelatedPlans plans={mockPlans} themeSlug="trendy-photo" />);
    const link = screen.getByText("查看全部").closest("a");
    expect(link).toHaveAttribute("href", "/plans?theme=trendy-photo");
  });

  it('无 themeSlug 时不显示 "查看全部"', () => {
    render(<RelatedPlans plans={mockPlans} />);
    expect(screen.queryByText("查看全部")).not.toBeInTheDocument();
  });

  it("渲染正确数量的 PlanCard", () => {
    render(<RelatedPlans plans={mockPlans} />);
    expect(screen.getByTestId("plan-card-p1")).toBeInTheDocument();
    expect(screen.getByTestId("plan-card-p2")).toBeInTheDocument();
    expect(screen.getByTestId("plan-card-p3")).toBeInTheDocument();
  });

  it('"You May Also Like" 装饰文字', () => {
    render(<RelatedPlans plans={mockPlans} />);
    expect(screen.getByText("You May Also Like")).toBeInTheDocument();
  });

  it("主题色正确应用（themeSlug 映射 → accentColor）", () => {
    const { container } = render(<RelatedPlans plans={mockPlans} themeSlug="trendy-photo" />);
    // trendy-photo 对应 #F28B82
    const decorLine = container.querySelector("[style]");
    expect(decorLine).toBeInTheDocument();
    expect(decorLine!.getAttribute("style")).toContain("#F28B82");
  });
});
