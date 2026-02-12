/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';

// Footer 是纯展示组件，next/link 在 happy-dom 下渲染为 <a>，无需 mock
import Footer from '../Footer';

describe('Footer', () => {
  afterEach(() => {
    cleanup();
  });

  describe('品牌信息', () => {
    it('显示品牌名称', () => {
      render(<Footer />);
      expect(screen.getByText('江戸和装工房雅')).toBeInTheDocument();
    });

    it('显示品牌描述', () => {
      render(<Footer />);
      expect(screen.getByText(/专业和服租赁服务/)).toBeInTheDocument();
      expect(screen.getByText(/体验传统日本文化/)).toBeInTheDocument();
    });
  });

  describe('导航链接', () => {
    it('渲染所有快速链接', () => {
      render(<Footer />);
      expect(screen.getByText('和服套餐')).toBeInTheDocument();
      expect(screen.getByText('租赁套餐')).toBeInTheDocument();
      expect(screen.getByText('店铺信息')).toBeInTheDocument();
    });

    it('渲染客户服务链接', () => {
      render(<Footer />);
      expect(screen.getByText('联系我们')).toBeInTheDocument();
      expect(screen.getByText('关于我们')).toBeInTheDocument();
      expect(screen.getByText('常见问题')).toBeInTheDocument();
    });

    it('渲染合作伙伴链接', () => {
      render(<Footer />);
      expect(screen.getByText(/成为商家/)).toBeInTheDocument();
      expect(screen.getByText('商家帮助中心')).toBeInTheDocument();
    });

    it('链接 href 正确', () => {
      render(<Footer />);

      const links: Record<string, string> = {
        '和服套餐': '/plans',
        '店铺信息': '/stores',
        '联系我们': '/contact',
        '关于我们': '/about',
        '常见问题': '/faq',
        '商家帮助中心': '/about/merchants',
      };

      for (const [text, href] of Object.entries(links)) {
        const link = screen.getByText(text).closest('a');
        expect(link).toHaveAttribute('href', href);
      }

      // 成为商家 (文本包含 emoji)
      const merchantLink = screen.getByText(/成为商家/).closest('a');
      expect(merchantLink).toHaveAttribute('href', '/merchant/register');
    });
  });

  describe('联系方式', () => {
    it('显示联系信息', () => {
      render(<Footer />);
      expect(screen.getByText(/电话/)).toBeInTheDocument();
      expect(screen.getByText(/邮箱/)).toBeInTheDocument();
      expect(screen.getByText(/东京/)).toBeInTheDocument();
    });
  });

  describe('版权信息', () => {
    it('显示动态年份', () => {
      render(<Footer />);
      const year = new Date().getFullYear();
      expect(screen.getByText(new RegExp(`© ${year}`))).toBeInTheDocument();
    });

    it('显示版权文案', () => {
      render(<Footer />);
      expect(screen.getByText(/All rights reserved/)).toBeInTheDocument();
    });
  });

  describe('结构', () => {
    it('渲染 footer 元素', () => {
      const { container } = render(<Footer />);
      expect(container.querySelector('footer')).toBeInTheDocument();
    });

    it('底部有分隔线', () => {
      const { container } = render(<Footer />);
      // 版权区域有 border-t 分隔线
      const copyrightSection = container.querySelector('.border-t.text-center');
      expect(copyrightSection).toBeInTheDocument();
    });
  });
});
