/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import PriceBreakdown, { type UpgradeItem, type CartItem } from '../PriceBreakdown';

describe('PriceBreakdown', () => {
  afterEach(() => {
    cleanup();
  });

  describe('单商品模式', () => {
    it('渲染基本价格信息', () => {
      render(
        <PriceBreakdown
          mode="single"
          planName="樱花和服套餐"
          planPrice={980000} // ¥9,800
          quantity={2}
          unitLabel="人"
        />
      );

      // 显示单价和数量
      expect(screen.getByText(/¥9,800 × 2 人/)).toBeInTheDocument();
      // 显示合计 (价格出现在明细和合计两处)
      const totalElements = screen.getAllByText('¥19,600');
      expect(totalElements.length).toBeGreaterThanOrEqual(1);
    });

    it('计算正确的总价', () => {
      render(
        <PriceBreakdown
          mode="single"
          planName="豪华套餐"
          planPrice={1500000} // ¥15,000
          quantity={3}
          unitLabel="人"
        />
      );

      // 3 * 15,000 = 45,000
      const totalElements = screen.getAllByText('¥45,000');
      expect(totalElements.length).toBeGreaterThanOrEqual(1);
    });

    it('显示增值服务明细', () => {
      const upgrades: UpgradeItem[] = [
        { id: '1', name: '专业摄影', icon: '📷', price: 300000 }, // ¥3,000
        { id: '2', name: '化妆服务', icon: '💄', price: 200000 }, // ¥2,000
      ];

      render(
        <PriceBreakdown
          mode="single"
          planName="基础套餐"
          planPrice={500000} // ¥5,000
          quantity={2}
          unitLabel="人"
          upgrades={upgrades}
        />
      );

      // 显示增值服务
      expect(screen.getByText(/专业摄影/)).toBeInTheDocument();
      expect(screen.getByText(/化妆服务/)).toBeInTheDocument();

      // 单价 = 5000 + 3000 + 2000 = 10000
      // 总价 = 10000 * 2 = 20000
      const totalElements = screen.getAllByText('¥20,000');
      expect(totalElements.length).toBeGreaterThanOrEqual(1);
    });

    it('显示增值服务价格', () => {
      const upgrades: UpgradeItem[] = [
        { id: '1', name: '专业摄影', price: 300000 },
      ];

      render(
        <PriceBreakdown
          mode="single"
          planName="基础套餐"
          planPrice={500000}
          quantity={1}
          unitLabel="人"
          upgrades={upgrades}
        />
      );

      expect(screen.getByText(/\+¥3,000\/人/)).toBeInTheDocument();
    });

    it('无增值服务时显示简单价格', () => {
      render(
        <PriceBreakdown
          mode="single"
          planName="基础套餐"
          planPrice={500000}
          quantity={1}
          unitLabel="人"
        />
      );

      expect(screen.getByText(/¥5,000 × 1 人/)).toBeInTheDocument();
      expect(screen.queryByText(/单价：套餐/)).not.toBeInTheDocument();
    });
  });

  describe('多商品模式', () => {
    const mockItems: CartItem[] = [
      { id: '1', name: '套餐A', price: 500000, quantity: 2 },
      { id: '2', name: '套餐B', price: 300000, quantity: 1 },
    ];

    it('渲染套餐总数', () => {
      render(<PriceBreakdown mode="multi" items={mockItems} />);

      // 2 + 1 = 3 个
      expect(screen.getByText('3 个')).toBeInTheDocument();
    });

    it('计算正确的小计', () => {
      render(<PriceBreakdown mode="multi" items={mockItems} />);

      // (5000 * 2) + (3000 * 1) = 13000
      const totalElements = screen.getAllByText('¥13,000');
      expect(totalElements.length).toBeGreaterThanOrEqual(1);
    });

    it('显示套餐总数标签', () => {
      render(<PriceBreakdown mode="multi" items={mockItems} />);

      expect(screen.getByText('套餐总数')).toBeInTheDocument();
      expect(screen.getByText('小计')).toBeInTheDocument();
    });
  });

  describe('定金/尾款显示', () => {
    it('有定金时显示定金和尾款', () => {
      render(
        <PriceBreakdown
          mode="single"
          planName="套餐"
          planPrice={1000000} // ¥10,000
          quantity={1}
          unitLabel="人"
          deposit={300000} // ¥3,000
        />
      );

      expect(screen.getByText(/定金 ¥3,000/)).toBeInTheDocument();
      expect(screen.getByText(/到店支付 ¥7,000/)).toBeInTheDocument();
    });

    it('无定金时不显示定金信息', () => {
      render(
        <PriceBreakdown
          mode="single"
          planName="套餐"
          planPrice={1000000}
          quantity={1}
          unitLabel="人"
        />
      );

      expect(screen.queryByText(/定金/)).not.toBeInTheDocument();
      expect(screen.queryByText(/到店支付/)).not.toBeInTheDocument();
    });

    it('定金为0时不显示定金信息', () => {
      render(
        <PriceBreakdown
          mode="single"
          planName="套餐"
          planPrice={1000000}
          quantity={1}
          unitLabel="人"
          deposit={0}
        />
      );

      expect(screen.queryByText(/定金/)).not.toBeInTheDocument();
    });
  });

  describe('紧凑模式', () => {
    it('compact=true 时应用紧凑样式', () => {
      const { container } = render(
        <PriceBreakdown
          mode="single"
          planName="套餐"
          planPrice={500000}
          quantity={1}
          unitLabel="人"
          compact
        />
      );

      expect(container.firstChild).toHaveClass('p-3');
    });

    it('compact=false 时应用标准样式', () => {
      const { container } = render(
        <PriceBreakdown
          mode="single"
          planName="套餐"
          planPrice={500000}
          quantity={1}
          unitLabel="人"
          compact={false}
        />
      );

      expect(container.firstChild).toHaveClass('p-4');
    });
  });

  describe('价格格式化', () => {
    it('正确格式化大数字价格', () => {
      render(
        <PriceBreakdown
          mode="single"
          planName="豪华套餐"
          planPrice={12345600} // ¥123,456
          quantity={1}
          unitLabel="人"
        />
      );

      const totalElements = screen.getAllByText('¥123,456');
      expect(totalElements.length).toBeGreaterThanOrEqual(1);
    });

    it('正确格式化小数字价格', () => {
      render(
        <PriceBreakdown
          mode="single"
          planName="经济套餐"
          planPrice={100} // ¥1
          quantity={1}
          unitLabel="人"
        />
      );

      const totalElements = screen.getAllByText('¥1');
      expect(totalElements.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('合计显示', () => {
    it('始终显示合计行', () => {
      render(
        <PriceBreakdown
          mode="single"
          planName="套餐"
          planPrice={500000}
          quantity={1}
          unitLabel="人"
        />
      );

      expect(screen.getByText('合计')).toBeInTheDocument();
    });

    it('合计金额使用 sakura 颜色', () => {
      render(
        <PriceBreakdown
          mode="single"
          planName="套餐"
          planPrice={500000}
          quantity={1}
          unitLabel="人"
        />
      );

      // 找到合计行
      const totalRow = screen.getByText('合计').parentElement;
      const totalAmount = totalRow?.querySelector('.text-sakura-600');
      expect(totalAmount).toBeInTheDocument();
    });
  });
});
