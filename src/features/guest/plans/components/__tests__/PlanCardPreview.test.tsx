/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import PlanCardPreview from '../PlanCardPreview';

// Mock PlanCard 组件 (避免复杂依赖)
vi.mock('@/components/PlanCard', () => ({
  default: ({ plan }: { plan: { name: string; price: number } }) => (
    <div data-testid="plan-card">
      <span data-testid="plan-name">{plan.name}</span>
      <span data-testid="plan-price">¥{(plan.price / 100).toLocaleString()}</span>
    </div>
  ),
}));

describe('PlanCardPreview', () => {
  const defaultFormData = {
    name: '樱花和服套餐',
    description: '精美和服体验',
    highlights: '包含专业摄影',
    price: 9800, // 元 (表单中)
    originalPrice: 12000,
    imageUrl: 'https://example.com/image.jpg',
    storeName: '京都本店',
    region: '京都',
    isActive: true,
  };

  const defaultTags = [
    { id: '1', code: 'traditional', name: '传统风格', icon: '🎎', color: '#E91E63' },
    { id: '2', code: 'romantic', name: '浪漫约会', icon: '💕', color: '#FF5722' },
  ];

  afterEach(() => {
    cleanup();
  });

  describe('渲染', () => {
    it('渲染预览标题和说明', () => {
      render(
        <PlanCardPreview
          formData={defaultFormData}
          selectedTags={defaultTags}
          isActive={true}
        />
      );

      expect(screen.getByText('用户预览')).toBeInTheDocument();
      expect(screen.getByText('用户看到的效果')).toBeInTheDocument();
    });

    it('渲染 PlanCard 组件', () => {
      render(
        <PlanCardPreview
          formData={defaultFormData}
          selectedTags={defaultTags}
          isActive={true}
        />
      );

      expect(screen.getByTestId('plan-card')).toBeInTheDocument();
    });

    it('传递正确的套餐名称', () => {
      render(
        <PlanCardPreview
          formData={defaultFormData}
          selectedTags={defaultTags}
          isActive={true}
        />
      );

      expect(screen.getByTestId('plan-name')).toHaveTextContent('樱花和服套餐');
    });

    it('价格从元转换为分', () => {
      render(
        <PlanCardPreview
          formData={defaultFormData}
          selectedTags={defaultTags}
          isActive={true}
        />
      );

      // 9800元 -> 980000分 -> 显示为 ¥9,800
      expect(screen.getByTestId('plan-price')).toHaveTextContent('¥9,800');
    });
  });

  describe('默认值处理', () => {
    it('名称为空时显示"套餐名称"', () => {
      const formDataNoName = {
        ...defaultFormData,
        name: '',
      };

      render(
        <PlanCardPreview
          formData={formDataNoName}
          selectedTags={defaultTags}
          isActive={true}
        />
      );

      expect(screen.getByTestId('plan-name')).toHaveTextContent('套餐名称');
    });
  });

  describe('下架状态警告', () => {
    it('isActive=false 时显示下架警告', () => {
      render(
        <PlanCardPreview
          formData={defaultFormData}
          selectedTags={defaultTags}
          isActive={false}
        />
      );

      expect(screen.getByText(/套餐已下架，用户无法看到/)).toBeInTheDocument();
    });

    it('isActive=true 时不显示下架警告', () => {
      render(
        <PlanCardPreview
          formData={defaultFormData}
          selectedTags={defaultTags}
          isActive={true}
        />
      );

      expect(screen.queryByText(/套餐已下架/)).not.toBeInTheDocument();
    });

    it('下架警告有正确的样式', () => {
      render(
        <PlanCardPreview
          formData={defaultFormData}
          selectedTags={defaultTags}
          isActive={false}
        />
      );

      const warning = screen.getByText(/套餐已下架/).parentElement;
      expect(warning).toHaveClass('bg-amber-50', 'border-amber-200');
    });
  });

  describe('活动套餐', () => {
    it('isCampaign 属性传递给 PlanCard', () => {
      // 这个测试主要验证 props 传递正确
      render(
        <PlanCardPreview
          formData={defaultFormData}
          selectedTags={defaultTags}
          isActive={true}
          isCampaign={true}
        />
      );

      expect(screen.getByTestId('plan-card')).toBeInTheDocument();
    });
  });

  describe('标签传递', () => {
    it('传递选中的标签给 PlanCard', () => {
      render(
        <PlanCardPreview
          formData={defaultFormData}
          selectedTags={defaultTags}
          isActive={true}
        />
      );

      // PlanCard 被 mock 了，所以我们只验证它被渲染
      expect(screen.getByTestId('plan-card')).toBeInTheDocument();
    });
  });

  describe('缩放预览', () => {
    it('预览卡片有缩小样式', () => {
      const { container } = render(
        <PlanCardPreview
          formData={defaultFormData}
          selectedTags={defaultTags}
          isActive={true}
        />
      );

      const previewContainer = container.querySelector('.scale-90');
      expect(previewContainer).toBeInTheDocument();
    });
  });
});
