/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import MiniBookingBar from '../MiniBookingBar';

describe('MiniBookingBar', () => {
  const defaultProps = {
    plan: {
      id: 'plan-1',
      name: '樱花和服套餐',
      price: 980000, // ¥9,800
      originalPrice: 1200000, // ¥12,000
      isCampaign: true,
    },
    visible: true,
    onScrollToBooking: vi.fn(),
  };

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  describe('可见性', () => {
    it('visible=true 时显示', () => {
      const { container } = render(<MiniBookingBar {...defaultProps} />);

      const bar = container.firstChild;
      expect(bar).toHaveClass('translate-y-0');
      expect(bar).not.toHaveClass('translate-y-full');
    });

    it('visible=false 时隐藏 (滑出)', () => {
      const { container } = render(<MiniBookingBar {...defaultProps} visible={false} />);

      const bar = container.firstChild;
      expect(bar).toHaveClass('translate-y-full');
    });
  });

  describe('价格显示', () => {
    it('显示当前价格', () => {
      render(<MiniBookingBar {...defaultProps} />);

      expect(screen.getByText('¥9,800')).toBeInTheDocument();
    });

    it('显示原价（划线）', () => {
      render(<MiniBookingBar {...defaultProps} />);

      expect(screen.getByText('¥12,000')).toBeInTheDocument();
      // 原价应该有划线样式
      const originalPrice = screen.getByText('¥12,000');
      expect(originalPrice).toHaveClass('line-through');
    });

    it('无原价时不显示划线价格', () => {
      const propsWithoutOriginal = {
        ...defaultProps,
        plan: {
          ...defaultProps.plan,
          originalPrice: undefined,
        },
      };

      render(<MiniBookingBar {...propsWithoutOriginal} />);

      expect(screen.getByText('¥9,800')).toBeInTheDocument();
      expect(screen.queryByText('¥12,000')).not.toBeInTheDocument();
    });

    it('原价等于当前价时不显示划线价格', () => {
      const propsWithSamePrice = {
        ...defaultProps,
        plan: {
          ...defaultProps.plan,
          price: 980000,
          originalPrice: 980000,
        },
      };

      render(<MiniBookingBar {...propsWithSamePrice} />);

      const prices = screen.getAllByText('¥9,800');
      expect(prices.length).toBe(1);
    });

    it('显示价格单位 "/人"', () => {
      render(<MiniBookingBar {...defaultProps} />);

      expect(screen.getByText('/ 人')).toBeInTheDocument();
    });
  });

  describe('活动标签', () => {
    it('isCampaign=true 时显示折扣和限时优惠标签', () => {
      render(<MiniBookingBar {...defaultProps} />);

      // 显示折扣百分比 -18% (原价12000 -> 9800)
      expect(screen.getByText('-18%')).toBeInTheDocument();
      expect(screen.getByText('限时优惠')).toBeInTheDocument();
    });

    it('isCampaign=false 时不显示标签', () => {
      const propsWithoutCampaign = {
        ...defaultProps,
        plan: {
          ...defaultProps.plan,
          isCampaign: false,
        },
      };

      render(<MiniBookingBar {...propsWithoutCampaign} />);

      expect(screen.queryByText('限时优惠')).not.toBeInTheDocument();
    });
  });

  describe('操作按钮', () => {
    it('渲染"查看预订详情"按钮', () => {
      render(<MiniBookingBar {...defaultProps} />);

      expect(screen.getByText('查看预订详情')).toBeInTheDocument();
    });

    it('渲染"立即预订"按钮', () => {
      render(<MiniBookingBar {...defaultProps} />);

      expect(screen.getByText('立即预订')).toBeInTheDocument();
    });

    it('点击"查看预订详情"触发 onScrollToBooking', () => {
      const onScrollToBooking = vi.fn();
      render(<MiniBookingBar {...defaultProps} onScrollToBooking={onScrollToBooking} />);

      const detailsButton = screen.getByText('查看预订详情');
      fireEvent.click(detailsButton);

      expect(onScrollToBooking).toHaveBeenCalled();
    });

    it('点击"立即预订"触发 onScrollToBooking', () => {
      const onScrollToBooking = vi.fn();
      render(<MiniBookingBar {...defaultProps} onScrollToBooking={onScrollToBooking} />);

      const bookButton = screen.getByText('立即预订');
      fireEvent.click(bookButton);

      expect(onScrollToBooking).toHaveBeenCalled();
    });
  });

  describe('响应式显示', () => {
    it('默认在大屏幕显示 (lg:block)', () => {
      const { container } = render(<MiniBookingBar {...defaultProps} />);

      const bar = container.firstChild;
      expect(bar).toHaveClass('hidden', 'lg:block');
    });
  });

  describe('折扣计算', () => {
    it('正确计算折扣百分比', () => {
      // 原价 12000，现价 9800，折扣 (12000-9800)/12000 = 18.33% ≈ 18%
      render(<MiniBookingBar {...defaultProps} />);

      expect(screen.getByText('-18%')).toBeInTheDocument();
    });

    it('折扣为0时不显示折扣标签', () => {
      const propsNoDiscount = {
        ...defaultProps,
        plan: {
          ...defaultProps.plan,
          price: 1200000,
          originalPrice: 1200000,
          isCampaign: false,
        },
      };

      render(<MiniBookingBar {...propsNoDiscount} />);

      expect(screen.queryByText(/-\d+%/)).not.toBeInTheDocument();
    });
  });
});
