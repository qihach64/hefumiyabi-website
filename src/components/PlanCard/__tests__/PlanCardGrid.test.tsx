/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";

import PlanCardGrid from "../PlanCardGrid";

describe("PlanCardGrid", () => {
  afterEach(() => {
    cleanup();
  });

  it('默认 variant="grid-4" 应用 grid 类名', () => {
    const { container } = render(
      <PlanCardGrid>
        <div>child</div>
      </PlanCardGrid>
    );
    const wrapper = container.firstElementChild!;
    expect(wrapper.className).toContain("grid");
    expect(wrapper.className).toContain("grid-cols-2");
  });

  it('variant="horizontal-scroll" 应用 flex + overflow-x-auto', () => {
    const { container } = render(
      <PlanCardGrid variant="horizontal-scroll">
        <div>child</div>
      </PlanCardGrid>
    );
    const wrapper = container.firstElementChild!;
    expect(wrapper.className).toContain("flex");
    expect(wrapper.className).toContain("overflow-x-auto");
  });

  it('variant="grid-2" 应用 md:grid-cols-2', () => {
    const { container } = render(
      <PlanCardGrid variant="grid-2">
        <div>child</div>
      </PlanCardGrid>
    );
    const wrapper = container.firstElementChild!;
    expect(wrapper.className).toContain("md:grid-cols-2");
  });

  it('variant="grid-3" 应用 sm:grid-cols-3', () => {
    const { container } = render(
      <PlanCardGrid variant="grid-3">
        <div>child</div>
      </PlanCardGrid>
    );
    const wrapper = container.firstElementChild!;
    expect(wrapper.className).toContain("sm:grid-cols-3");
  });

  it("自定义 className 合并到输出", () => {
    const { container } = render(
      <PlanCardGrid className="my-custom-class">
        <div>child</div>
      </PlanCardGrid>
    );
    const wrapper = container.firstElementChild!;
    expect(wrapper.className).toContain("my-custom-class");
  });

  it("正确渲染 children", () => {
    render(
      <PlanCardGrid>
        <div data-testid="child-1">A</div>
        <div data-testid="child-2">B</div>
      </PlanCardGrid>
    );
    expect(screen.getByTestId("child-1")).toBeInTheDocument();
    expect(screen.getByTestId("child-2")).toBeInTheDocument();
  });
});
