/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, act } from '@testing-library/react';

// Mock next/image
vi.mock('next/image', () => ({
  default: (props: Record<string, unknown>) => {
    const { fill, priority, sizes, quality, ...rest } = props;
    return <img {...rest} data-testid="next-image" />;
  },
}));

// Mock HeroSearchPanel 子组件
vi.mock('../HeroSearchPanel', () => ({
  default: ({ themes, variant }: { themes: unknown[]; variant: string }) => (
    <div data-testid="hero-search-panel" data-variant={variant} data-themes-count={themes.length}>
      HeroSearchPanel
    </div>
  ),
}));

// IntersectionObserver mock
type IOCallback = (entries: IntersectionObserverEntry[]) => void;
let ioCallback: IOCallback | null = null;
let ioDisconnect: ReturnType<typeof vi.fn>;

function setupIntersectionObserverMock() {
  ioDisconnect = vi.fn();
  ioCallback = null;

  const MockIO = vi.fn((callback: IOCallback) => {
    ioCallback = callback;
    return {
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: ioDisconnect,
      root: null,
      rootMargin: '',
      thresholds: [],
      takeRecords: vi.fn(() => []),
    };
  });

  vi.stubGlobal('IntersectionObserver', MockIO);
  return MockIO;
}

// 触发 IO 回调的辅助函数
function triggerIntersection(ratio: number) {
  if (!ioCallback) throw new Error('IntersectionObserver 未初始化');
  act(() => {
    ioCallback!([{
      intersectionRatio: ratio,
      isIntersecting: ratio > 0,
      boundingClientRect: {} as DOMRectReadOnly,
      intersectionRect: {} as DOMRectReadOnly,
      rootBounds: null,
      target: document.createElement('div'),
      time: Date.now(),
    }]);
  });
}

import HeroSection from '../HeroSection';

const mockThemes = [
  { id: '1', slug: 'traditional', name: '传统', icon: '🎎', color: '#E91E63' },
  { id: '2', slug: 'modern', name: '现代', icon: '✨', color: '#2196F3' },
];

describe('HeroSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupIntersectionObserverMock();
  });

  afterEach(() => {
    cleanup();
  });

  describe('基础渲染', () => {
    it('渲染背景图片', () => {
      render(<HeroSection themes={mockThemes} />);
      const img = screen.getByTestId('next-image');
      expect(img).toHaveAttribute('src', '/images/hero-kimono.jpg');
      expect(img).toHaveAttribute('alt', '和服体験');
    });

    it('显示主标题', () => {
      render(<HeroSection themes={mockThemes} />);
      expect(screen.getByText('一の着物')).toBeInTheDocument();
    });

    it('显示副标题', () => {
      render(<HeroSection themes={mockThemes} />);
      expect(screen.getByText('伝統の美、現代の心')).toBeInTheDocument();
    });

    it('渲染装饰文字', () => {
      render(<HeroSection themes={mockThemes} />);
      expect(screen.getByText('京都・和服体験')).toBeInTheDocument();
      expect(screen.getByText('伝統と現代の融合')).toBeInTheDocument();
    });
  });

  describe('HeroSearchPanel', () => {
    it('传递 themes prop 给 HeroSearchPanel', () => {
      render(<HeroSection themes={mockThemes} />);
      const panel = screen.getByTestId('hero-search-panel');
      expect(panel).toHaveAttribute('data-themes-count', '2');
    });

    it('传递 light variant', () => {
      render(<HeroSection themes={mockThemes} />);
      const panel = screen.getByTestId('hero-search-panel');
      expect(panel).toHaveAttribute('data-variant', 'light');
    });
  });

  describe('IntersectionObserver hysteresis 逻辑', () => {
    it('无回调时不创建 observer', () => {
      render(<HeroSection themes={mockThemes} />);
      expect(IntersectionObserver).not.toHaveBeenCalled();
    });

    it('有回调时创建 observer', () => {
      const onChange = vi.fn();
      render(<HeroSection themes={mockThemes} onHeroVisibilityChange={onChange} />);
      expect(IntersectionObserver).toHaveBeenCalledTimes(1);
    });

    it('初始状态 ratio > 0.1 → 回调 true', () => {
      const onChange = vi.fn();
      render(<HeroSection themes={mockThemes} onHeroVisibilityChange={onChange} />);
      triggerIntersection(0.5);
      expect(onChange).toHaveBeenCalledWith(true);
    });

    it('初始状态 ratio <= 0.1 → 回调 false', () => {
      const onChange = vi.fn();
      render(<HeroSection themes={mockThemes} onHeroVisibilityChange={onChange} />);
      triggerIntersection(0.05);
      expect(onChange).toHaveBeenCalledWith(false);
    });

    it('从可见到不可见：ratio < 0.05 → 回调 false', () => {
      const onChange = vi.fn();
      render(<HeroSection themes={mockThemes} onHeroVisibilityChange={onChange} />);

      // 先变为可见
      triggerIntersection(0.5);
      expect(onChange).toHaveBeenCalledWith(true);
      onChange.mockClear();

      // ratio < 0.05 → 不可见
      triggerIntersection(0.02);
      expect(onChange).toHaveBeenCalledWith(false);
    });

    it('从可见到迟滞区间(0.05 ≤ ratio ≤ 0.2)：不触发变化', () => {
      const onChange = vi.fn();
      render(<HeroSection themes={mockThemes} onHeroVisibilityChange={onChange} />);

      // 先变为可见
      triggerIntersection(0.5);
      onChange.mockClear();

      // 迟滞区间 → 保持可见，不触发
      triggerIntersection(0.1);
      expect(onChange).not.toHaveBeenCalled();
    });

    it('从不可见到迟滞区间(ratio ≤ 0.2)：不触发变化', () => {
      const onChange = vi.fn();
      render(<HeroSection themes={mockThemes} onHeroVisibilityChange={onChange} />);

      // 先变为不可见
      triggerIntersection(0.02);
      expect(onChange).toHaveBeenCalledWith(false);
      onChange.mockClear();

      // 迟滞区间 → 保持不可见，不触发
      triggerIntersection(0.15);
      expect(onChange).not.toHaveBeenCalled();
    });

    it('从不可见到可见：ratio > 0.2 → 回调 true', () => {
      const onChange = vi.fn();
      render(<HeroSection themes={mockThemes} onHeroVisibilityChange={onChange} />);

      // 先变为不可见
      triggerIntersection(0.02);
      onChange.mockClear();

      // ratio > 0.2 → 可见
      triggerIntersection(0.3);
      expect(onChange).toHaveBeenCalledWith(true);
    });

    it('组件卸载 → observer.disconnect() 被调用', () => {
      const onChange = vi.fn();
      const { unmount } = render(
        <HeroSection themes={mockThemes} onHeroVisibilityChange={onChange} />
      );
      unmount();
      expect(ioDisconnect).toHaveBeenCalled();
    });
  });

  describe('结构', () => {
    it('渲染 section 元素', () => {
      const { container } = render(<HeroSection themes={mockThemes} />);
      expect(container.querySelector('section')).toBeInTheDocument();
    });
  });
});
