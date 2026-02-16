/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";

// Mock 子组件，防止加载真实组件的副作用
vi.mock("@/components/layout/Header", () => ({
  default: () => <header data-testid="header">Header</header>,
}));
vi.mock("@/components/layout/Footer", () => ({
  default: () => <footer data-testid="footer">Footer</footer>,
}));
vi.mock("@/components/layout/MobileSearchBar", () => ({
  default: () => <div data-testid="mobile-search-bar">MobileSearchBar</div>,
}));
vi.mock("@/components/layout/BottomNav", () => ({
  default: () => <nav data-testid="bottom-nav">BottomNav</nav>,
}));
vi.mock("@/contexts/SearchLoadingContext", () => ({
  SearchLoadingProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock("@/contexts/SearchBarContext", () => ({
  SearchBarProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import MainLayout from "../layout";

describe("MainLayout - sticky 定位约束", () => {
  afterEach(() => {
    cleanup();
  });

  it("外层容器不应有 overflow-x-hidden（会破坏 sticky 定位）", () => {
    const { container } = render(
      <MainLayout>
        <div>内容</div>
      </MainLayout>
    );

    // 外层 flex 容器
    const outerDiv = container.firstElementChild as HTMLElement;
    expect(outerDiv).toBeTruthy();
    expect(outerDiv.className).not.toMatch(/overflow-x-hidden/);
    expect(outerDiv.className).not.toMatch(/overflow-y-/);
  });

  it("main 元素可以有 overflow-x-hidden", () => {
    const { container } = render(
      <MainLayout>
        <div>内容</div>
      </MainLayout>
    );

    const main = container.querySelector("main");
    expect(main).toBeTruthy();
    // main 有 overflow-x-hidden 是安全的，不会破坏 Header/MobileSearchBar 的 sticky
    expect(main!.className).toContain("overflow-x-hidden");
  });

  it("包含所有必需的布局组件", () => {
    const { getByTestId } = render(
      <MainLayout>
        <div>内容</div>
      </MainLayout>
    );

    expect(getByTestId("header")).toBeTruthy();
    expect(getByTestId("mobile-search-bar")).toBeTruthy();
    expect(getByTestId("footer")).toBeTruthy();
    expect(getByTestId("bottom-nav")).toBeTruthy();
  });
});
