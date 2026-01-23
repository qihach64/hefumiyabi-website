/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import PlanCardManagement from '../PlanCardManagement';

// Mock next/image
vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    <img src={src} alt={alt} data-testid="plan-image" />
  ),
}));

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href} data-testid="link">
      {children}
    </a>
  ),
}));

describe('PlanCardManagement', () => {
  const defaultPlan = {
    id: 'plan-1',
    slug: 'sakura-kimono',
    name: '樱花和服套餐',
    category: 'LADIES',
    price: 980000,
    originalPrice: 1200000,
    imageUrl: 'https://example.com/image.jpg',
    isActive: true,
    isFeatured: false,
    isCampaign: false,
    currentBookings: 42,
    duration: 180,
    includes: ['和服', '腰带', '配饰'],
    planTags: [
      { tag: { id: '1', code: 'traditional', name: '传统风格', icon: '🎎', color: '#E91E63' } },
    ],
  };

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  describe('渲染', () => {
    it('渲染套餐名称', () => {
      render(<PlanCardManagement plan={defaultPlan} />);

      expect(screen.getByText('樱花和服套餐')).toBeInTheDocument();
    });

    it('渲染套餐价格', () => {
      render(<PlanCardManagement plan={defaultPlan} />);

      expect(screen.getByText('¥9,800')).toBeInTheDocument();
    });

    it('渲染原价（划线）', () => {
      render(<PlanCardManagement plan={defaultPlan} />);

      expect(screen.getByText('¥12,000')).toBeInTheDocument();
    });

    it('渲染套餐图片', () => {
      render(<PlanCardManagement plan={defaultPlan} />);

      const image = screen.getByTestId('plan-image');
      expect(image).toHaveAttribute('src', defaultPlan.imageUrl);
    });

    it('无图片时显示占位图标', () => {
      const planNoImage = {
        ...defaultPlan,
        imageUrl: null,
      };

      render(<PlanCardManagement plan={planNoImage} />);

      // 应该不渲染图片
      expect(screen.queryByTestId('plan-image')).not.toBeInTheDocument();
    });

    it('渲染预订次数', () => {
      render(<PlanCardManagement plan={defaultPlan} />);

      expect(screen.getByText('42 次')).toBeInTheDocument();
    });

    it('渲染类别标签', () => {
      render(<PlanCardManagement plan={defaultPlan} />);

      expect(screen.getByText('女士套餐')).toBeInTheDocument();
    });
  });

  describe('状态标签', () => {
    it('isActive=true 显示"上架"标签', () => {
      render(<PlanCardManagement plan={defaultPlan} />);

      expect(screen.getByText('上架')).toBeInTheDocument();
    });

    it('isActive=false 显示"下架"标签', () => {
      const inactivePlan = {
        ...defaultPlan,
        isActive: false,
      };

      render(<PlanCardManagement plan={inactivePlan} />);

      expect(screen.getByText('下架')).toBeInTheDocument();
    });

    it('isFeatured=true 显示"精选"标签', () => {
      const featuredPlan = {
        ...defaultPlan,
        isFeatured: true,
      };

      render(<PlanCardManagement plan={featuredPlan} />);

      expect(screen.getByText('精选')).toBeInTheDocument();
    });

    it('isCampaign=true 显示"活动"标签', () => {
      const campaignPlan = {
        ...defaultPlan,
        isCampaign: true,
      };

      render(<PlanCardManagement plan={campaignPlan} />);

      expect(screen.getByText('活动')).toBeInTheDocument();
    });
  });

  describe('标签显示', () => {
    it('显示套餐标签', () => {
      render(<PlanCardManagement plan={defaultPlan} />);

      expect(screen.getByText('传统风格')).toBeInTheDocument();
    });

    it('标签超过2个时显示 +N', () => {
      const planWithManyTags = {
        ...defaultPlan,
        planTags: [
          { tag: { id: '1', code: 't1', name: '标签1', icon: null, color: null } },
          { tag: { id: '2', code: 't2', name: '标签2', icon: null, color: null } },
          { tag: { id: '3', code: 't3', name: '标签3', icon: null, color: null } },
        ],
      };

      render(<PlanCardManagement plan={planWithManyTags} />);

      expect(screen.getByText('标签1')).toBeInTheDocument();
      expect(screen.getByText('标签2')).toBeInTheDocument();
      expect(screen.queryByText('标签3')).not.toBeInTheDocument();
      expect(screen.getByText('+1')).toBeInTheDocument();
    });
  });

  describe('操作按钮', () => {
    it('渲染预览按钮', () => {
      render(<PlanCardManagement plan={defaultPlan} />);

      expect(screen.getByText('预览')).toBeInTheDocument();
    });

    it('渲染编辑按钮', () => {
      render(<PlanCardManagement plan={defaultPlan} />);

      expect(screen.getByText('编辑')).toBeInTheDocument();
    });

    it('预览链接指向正确页面', () => {
      render(<PlanCardManagement plan={defaultPlan} />);

      const links = screen.getAllByTestId('link');
      const previewLink = links.find((link) => link.getAttribute('href')?.includes('/plans/'));

      expect(previewLink).toHaveAttribute('href', '/plans/sakura-kimono');
    });

    it('编辑链接指向正确页面', () => {
      render(<PlanCardManagement plan={defaultPlan} />);

      const links = screen.getAllByTestId('link');
      const editLink = links.find((link) => link.getAttribute('href')?.includes('/edit'));

      expect(editLink).toHaveAttribute('href', '/merchant/listings/plan-1/edit');
    });
  });

  describe('快速操作菜单', () => {
    it('点击更多按钮打开菜单', () => {
      render(<PlanCardManagement plan={defaultPlan} />);

      // 默认菜单不可见
      expect(screen.queryByText('下架套餐')).not.toBeInTheDocument();

      // 点击更多按钮
      const moreButton = document.querySelector('button')!;
      fireEvent.click(moreButton);

      // 菜单应该可见
      expect(screen.getByText('下架套餐')).toBeInTheDocument();
      expect(screen.getByText('复制套餐')).toBeInTheDocument();
      expect(screen.getByText('删除套餐')).toBeInTheDocument();
    });

    it('isActive=true 时显示"下架套餐"', () => {
      render(<PlanCardManagement plan={defaultPlan} />);

      const moreButton = document.querySelector('button')!;
      fireEvent.click(moreButton);

      expect(screen.getByText('下架套餐')).toBeInTheDocument();
    });

    it('isActive=false 时显示"上架套餐"', () => {
      const inactivePlan = {
        ...defaultPlan,
        isActive: false,
      };

      render(<PlanCardManagement plan={inactivePlan} />);

      const moreButton = document.querySelector('button')!;
      fireEvent.click(moreButton);

      expect(screen.getByText('上架套餐')).toBeInTheDocument();
    });

    it('点击下架套餐触发 onToggleStatus', () => {
      const onToggleStatus = vi.fn();
      render(<PlanCardManagement plan={defaultPlan} onToggleStatus={onToggleStatus} />);

      const moreButton = document.querySelector('button')!;
      fireEvent.click(moreButton);

      const toggleButton = screen.getByText('下架套餐');
      fireEvent.click(toggleButton);

      expect(onToggleStatus).toHaveBeenCalledWith('plan-1');
    });

    it('点击复制套餐触发 onCopy', () => {
      const onCopy = vi.fn();
      render(<PlanCardManagement plan={defaultPlan} onCopy={onCopy} />);

      const moreButton = document.querySelector('button')!;
      fireEvent.click(moreButton);

      const copyButton = screen.getByText('复制套餐');
      fireEvent.click(copyButton);

      expect(onCopy).toHaveBeenCalledWith('plan-1');
    });

    it('点击删除套餐触发 onDelete', () => {
      const onDelete = vi.fn();
      render(<PlanCardManagement plan={defaultPlan} onDelete={onDelete} />);

      const moreButton = document.querySelector('button')!;
      fireEvent.click(moreButton);

      const deleteButton = screen.getByText('删除套餐');
      fireEvent.click(deleteButton);

      expect(onDelete).toHaveBeenCalledWith('plan-1');
    });

    it('点击菜单外部关闭菜单', () => {
      render(<PlanCardManagement plan={defaultPlan} />);

      const moreButton = document.querySelector('button')!;
      fireEvent.click(moreButton);

      // 菜单可见
      expect(screen.getByText('下架套餐')).toBeInTheDocument();

      // 点击遮罩层 (fixed inset-0 element)
      const overlay = document.querySelector('.fixed.inset-0.z-40');
      fireEvent.click(overlay!);

      // 菜单应该关闭
      expect(screen.queryByText('下架套餐')).not.toBeInTheDocument();
    });
  });

  describe('价格显示', () => {
    it('原价低于或等于当前价时不显示原价', () => {
      const planNoDiscount = {
        ...defaultPlan,
        originalPrice: 980000,
      };

      render(<PlanCardManagement plan={planNoDiscount} />);

      // 只有一个 9,800
      const prices = screen.getAllByText('¥9,800');
      expect(prices.length).toBe(1);
    });

    it('原价为 null 时不显示原价', () => {
      const planNoOriginal = {
        ...defaultPlan,
        originalPrice: null,
      };

      render(<PlanCardManagement plan={planNoOriginal} />);

      expect(screen.queryByText('¥12,000')).not.toBeInTheDocument();
    });
  });

  describe('类别翻译', () => {
    const categories = [
      { code: 'LADIES', label: '女士套餐' },
      { code: 'MENS', label: '男士套餐' },
      { code: 'COUPLE', label: '情侣套餐' },
      { code: 'FAMILY', label: '家庭套餐' },
      { code: 'GROUP', label: '团体套餐' },
      { code: 'SPECIAL', label: '特别套餐' },
    ];

    categories.forEach(({ code, label }) => {
      it(`类别 ${code} 显示为 ${label}`, () => {
        const plan = {
          ...defaultPlan,
          category: code,
        };

        render(<PlanCardManagement plan={plan} />);

        expect(screen.getByText(label)).toBeInTheDocument();
      });
    });
  });
});
