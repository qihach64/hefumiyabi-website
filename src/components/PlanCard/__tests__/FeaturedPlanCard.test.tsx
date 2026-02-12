/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';

// Mock next/image
vi.mock('next/image', () => ({
  default: (props: Record<string, unknown>) => {
    const { fill, priority, sizes, quality, ...rest } = props;
    return <img {...rest} data-testid="next-image" />;
  },
}));

// Mock next/navigation
const mockSearchParams = new URLSearchParams();
vi.mock('next/navigation', () => ({
  useSearchParams: () => mockSearchParams,
}));

// Mock useCartToggle
const mockHandleToggleCart = vi.fn((e: { preventDefault: () => void; stopPropagation: () => void }) => {
  e.preventDefault();
  e.stopPropagation();
});
const mockCartState = {
  isInCart: false,
  isAdding: false,
  justChanged: false,
  lastAction: null as 'add' | 'remove' | null,
  handleToggleCart: mockHandleToggleCart,
};
vi.mock('../useCartToggle', () => ({
  useCartToggle: () => mockCartState,
}));

import FeaturedPlanCard from '../FeaturedPlanCard';

const basePlan = {
  id: 'plan-1',
  name: '京都经典和服体验',
  price: 1280000, // ¥12,800
  imageUrl: 'https://example.com/featured.jpg',
};

describe('FeaturedPlanCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCartState.isInCart = false;
    mockCartState.isAdding = false;
    mockCartState.justChanged = false;
    mockCartState.lastAction = null;
    mockSearchParams.delete('date');
    mockSearchParams.delete('guests');
  });

  afterEach(() => {
    cleanup();
  });

  describe('精选标签', () => {
    it('"精选推荐" 标签固定显示', () => {
      render(<FeaturedPlanCard plan={basePlan} />);
      expect(screen.getByText('精选推荐')).toBeInTheDocument();
    });
  });

  describe('基础渲染', () => {
    it('显示套餐名称', () => {
      render(<FeaturedPlanCard plan={basePlan} />);
      expect(screen.getByText('京都经典和服体验')).toBeInTheDocument();
    });

    it('渲染图片', () => {
      render(<FeaturedPlanCard plan={basePlan} />);
      const img = screen.getByTestId('next-image');
      expect(img).toHaveAttribute('src', 'https://example.com/featured.jpg');
    });

    it('无图片时显示 fallback', () => {
      render(<FeaturedPlanCard plan={{ ...basePlan, imageUrl: undefined }} />);
      expect(screen.queryByTestId('next-image')).not.toBeInTheDocument();
      expect(screen.getByText('👘')).toBeInTheDocument();
    });

    it('显示商家名称', () => {
      render(
        <FeaturedPlanCard plan={{ ...basePlan, merchantName: '雅和服店' }} />
      );
      expect(screen.getByText('雅和服店')).toBeInTheDocument();
    });

    it('显示地区信息', () => {
      render(
        <FeaturedPlanCard plan={{ ...basePlan, region: '京都' }} />
      );
      expect(screen.getByText('京都')).toBeInTheDocument();
    });
  });

  describe('description 条件显示', () => {
    it('有 description 时显示', () => {
      render(
        <FeaturedPlanCard plan={{ ...basePlan, description: '精美和服租赁体验' }} />
      );
      expect(screen.getByText('精美和服租赁体验')).toBeInTheDocument();
    });

    it('无 description 时不渲染', () => {
      const { container } = render(<FeaturedPlanCard plan={basePlan} />);
      // description 段落不存在
      const descP = container.querySelector('p.text-sm.text-gray-600');
      expect(descP).not.toBeInTheDocument();
    });
  });

  describe('包含项', () => {
    it('显示所有包含物', () => {
      render(
        <FeaturedPlanCard plan={{ ...basePlan, includes: ['和服', '腰带', '草履'] }} />
      );
      expect(screen.getByText('包含')).toBeInTheDocument();
      expect(screen.getByText('和服')).toBeInTheDocument();
      expect(screen.getByText('腰带')).toBeInTheDocument();
      expect(screen.getByText('草履')).toBeInTheDocument();
    });

    it('无 includes 时不渲染包含区块', () => {
      render(<FeaturedPlanCard plan={basePlan} />);
      expect(screen.queryByText('包含')).not.toBeInTheDocument();
    });
  });

  describe('标签', () => {
    const planWithTags = {
      ...basePlan,
      planTags: [
        { tag: { id: '1', code: 'trad', name: '传统', icon: '🎎', color: null } },
        { tag: { id: '2', code: 'rom', name: '浪漫', icon: null, color: null } },
      ],
    };

    it('显示所有标签', () => {
      render(<FeaturedPlanCard plan={planWithTags} />);
      expect(screen.getByText('标签')).toBeInTheDocument();
      expect(screen.getByText('传统')).toBeInTheDocument();
      expect(screen.getByText('浪漫')).toBeInTheDocument();
    });

    it('标签有 icon 时显示', () => {
      render(<FeaturedPlanCard plan={planWithTags} />);
      expect(screen.getByText('🎎')).toBeInTheDocument();
    });

    it('无标签时不渲染标签区块', () => {
      render(<FeaturedPlanCard plan={basePlan} />);
      expect(screen.queryByText('标签')).not.toBeInTheDocument();
    });
  });

  describe('价格', () => {
    it('显示价格（分转元）', () => {
      render(<FeaturedPlanCard plan={basePlan} />);
      expect(screen.getByText(/¥12,800/)).toBeInTheDocument();
      expect(screen.getByText('/人')).toBeInTheDocument();
    });

    it('有折扣时显示原价和省钱标签', () => {
      render(
        <FeaturedPlanCard plan={{ ...basePlan, originalPrice: 1580000 }} />
      );
      expect(screen.getByText('¥15,800')).toBeInTheDocument();
      expect(screen.getByText(/省¥3,000/)).toBeInTheDocument();
    });

    it('价格在底部（mt-auto 布局）', () => {
      const { container } = render(<FeaturedPlanCard plan={basePlan} />);
      const priceSection = container.querySelector('.mt-auto');
      expect(priceSection).toBeInTheDocument();
    });
  });

  describe('详情链接', () => {
    it('链接指向 /plans/[id]', () => {
      render(<FeaturedPlanCard plan={basePlan} />);
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/plans/plan-1');
    });

    it('保留 URL 参数到详情链接', () => {
      mockSearchParams.set('date', '2025-04-01');
      mockSearchParams.set('guests', '3');
      render(<FeaturedPlanCard plan={basePlan} />);
      const link = screen.getByRole('link');
      const href = link.getAttribute('href')!;
      expect(href).toContain('date=2025-04-01');
      expect(href).toContain('guests=3');
    });
  });

  describe('购物车交互', () => {
    it('点击购物车按钮调用 handleToggleCart', () => {
      render(<FeaturedPlanCard plan={basePlan} />);
      const btn = screen.getByRole('button', { name: '加入购物车' });
      fireEvent.click(btn);
      expect(mockHandleToggleCart).toHaveBeenCalled();
    });

    it('已在购物车时按钮显示"从购物车移除"', () => {
      mockCartState.isInCart = true;
      render(<FeaturedPlanCard plan={basePlan} />);
      expect(screen.getByRole('button', { name: '从购物车移除' })).toBeInTheDocument();
    });
  });

  describe('布局', () => {
    it('使用 flex column 布局', () => {
      const { container } = render(<FeaturedPlanCard plan={basePlan} />);
      const flexCol = container.querySelector('.flex.flex-col');
      expect(flexCol).toBeInTheDocument();
    });

    it('卡片有 h-full 使其填满容器', () => {
      render(<FeaturedPlanCard plan={basePlan} />);
      const link = screen.getByRole('link');
      expect(link.className).toContain('h-full');
    });
  });
});
