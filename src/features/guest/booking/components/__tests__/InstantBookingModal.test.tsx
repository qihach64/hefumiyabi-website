/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import InstantBookingModal from '../InstantBookingModal';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

// Mock next-auth/react
vi.mock('next-auth/react', () => ({
  useSession: () => ({
    data: null,
    status: 'unauthenticated',
  }),
}));

describe('InstantBookingModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    plan: {
      id: 'plan-1',
      name: '樱花和服套餐',
      price: 980000, // ¥9,800
      originalPrice: 1200000,
      duration: 180,
      depositAmount: 300000,
      isCampaign: true,
      pricingUnit: 'person' as const,
      unitLabel: '人',
    },
    store: {
      id: 'store-1',
      name: '京都本店',
    },
    quantity: 2,
    visitDate: '2025-01-20',
    visitTime: '10:00',
    phone: '',
    selectedUpgrades: [],
    subtotal: 1960000, // ¥19,600
    deposit: 300000,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe('渲染', () => {
    it('isOpen=false 时不渲染', () => {
      render(<InstantBookingModal {...defaultProps} isOpen={false} />);

      expect(screen.queryByText('确认预约')).not.toBeInTheDocument();
    });

    it('isOpen=true 时渲染模态框', () => {
      render(<InstantBookingModal {...defaultProps} />);

      // 标题和按钮都有"确认预约"文字，使用 heading 角色查询
      expect(screen.getByRole('heading', { name: '确认预约' })).toBeInTheDocument();
    });

    it('渲染套餐信息', () => {
      render(<InstantBookingModal {...defaultProps} />);

      expect(screen.getByText('樱花和服套餐')).toBeInTheDocument();
      expect(screen.getByText('京都本店')).toBeInTheDocument();
    });

    it('渲染日期和时间', () => {
      render(<InstantBookingModal {...defaultProps} />);

      expect(screen.getByText('10:00')).toBeInTheDocument();
    });

    it('渲染联系表单', () => {
      render(<InstantBookingModal {...defaultProps} />);

      expect(screen.getByText('联系信息')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('请输入您的姓名')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('example@email.com')).toBeInTheDocument();
    });

    it('渲染价格明细', () => {
      render(<InstantBookingModal {...defaultProps} />);

      expect(screen.getByText('合计')).toBeInTheDocument();
      // 价格可能出现多次（明细和合计）
      const priceElements = screen.getAllByText('¥19,600');
      expect(priceElements.length).toBeGreaterThanOrEqual(1);
    });

    it('渲染确认按钮', () => {
      render(<InstantBookingModal {...defaultProps} />);

      // 查找禁用状态的提交按钮
      const submitButton = screen.getByRole('button', { name: /确认预约/ });
      expect(submitButton).toBeInTheDocument();
    });

    it('渲染关闭按钮', () => {
      render(<InstantBookingModal {...defaultProps} />);

      expect(screen.getByRole('button', { name: '关闭' })).toBeInTheDocument();
    });
  });

  describe('关闭模态框', () => {
    it('点击遮罩关闭', () => {
      const onClose = vi.fn();
      render(<InstantBookingModal {...defaultProps} onClose={onClose} />);

      // 点击遮罩层
      const overlay = document.querySelector('.fixed.inset-0.bg-black\\/50');
      fireEvent.click(overlay!);

      expect(onClose).toHaveBeenCalled();
    });

    it('点击关闭按钮关闭', () => {
      const onClose = vi.fn();
      render(<InstantBookingModal {...defaultProps} onClose={onClose} />);

      const closeButton = screen.getByRole('button', { name: '关闭' });
      fireEvent.click(closeButton);

      expect(onClose).toHaveBeenCalled();
    });

    it('点击模态框内容不会关闭', () => {
      const onClose = vi.fn();
      render(<InstantBookingModal {...defaultProps} onClose={onClose} />);

      // 点击模态框内容
      const modalContent = screen.getByRole('heading', { name: '确认预约' }).closest('.bg-white');
      fireEvent.click(modalContent!);

      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('表单验证', () => {
    it('姓名为空时禁用提交按钮', () => {
      render(<InstantBookingModal {...defaultProps} />);

      const submitButton = screen.getByRole('button', { name: /确认预约/ });
      expect(submitButton).toBeDisabled();
    });

    it('只填姓名没有联系方式时禁用提交按钮', () => {
      render(<InstantBookingModal {...defaultProps} />);

      const nameInput = screen.getByPlaceholderText('请输入您的姓名');
      fireEvent.change(nameInput, { target: { value: '张三' } });

      const submitButton = screen.getByRole('button', { name: '确认预约' });
      expect(submitButton).toBeDisabled();
    });

    it('填写姓名和邮箱后启用提交按钮', () => {
      render(<InstantBookingModal {...defaultProps} />);

      const nameInput = screen.getByPlaceholderText('请输入您的姓名');
      const emailInput = screen.getByPlaceholderText('example@email.com');

      fireEvent.change(nameInput, { target: { value: '张三' } });
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

      const submitButton = screen.getByRole('button', { name: '确认预约' });
      expect(submitButton).not.toBeDisabled();
    });

    it('填写姓名和电话后启用提交按钮', () => {
      render(<InstantBookingModal {...defaultProps} />);

      const nameInput = screen.getByPlaceholderText('请输入您的姓名');
      const phoneInput = screen.getByPlaceholderText('用于预约确认通知');

      fireEvent.change(nameInput, { target: { value: '张三' } });
      fireEvent.change(phoneInput, { target: { value: '13812345678' } });

      const submitButton = screen.getByRole('button', { name: '确认预约' });
      expect(submitButton).not.toBeDisabled();
    });
  });

  describe('表单提交', () => {
    it('提交时显示加载状态', async () => {
      // Mock fetch to hang
      global.fetch = vi.fn().mockImplementation(
        () => new Promise(() => {})
      );

      render(<InstantBookingModal {...defaultProps} />);

      // 填写表单
      const nameInput = screen.getByPlaceholderText('请输入您的姓名');
      const emailInput = screen.getByPlaceholderText('example@email.com');

      fireEvent.change(nameInput, { target: { value: '张三' } });
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

      // 点击提交
      const submitButton = screen.getByRole('button', { name: '确认预约' });
      fireEvent.click(submitButton);

      // 应该显示加载状态
      await waitFor(() => {
        expect(screen.getByText('处理中...')).toBeInTheDocument();
      });
    });

    it('提交成功后调用 API', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ id: 'booking-123' }),
      });

      render(<InstantBookingModal {...defaultProps} />);

      // 填写表单
      const nameInput = screen.getByPlaceholderText('请输入您的姓名');
      const emailInput = screen.getByPlaceholderText('example@email.com');

      fireEvent.change(nameInput, { target: { value: '张三' } });
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

      // 点击提交
      const submitButton = screen.getByRole('button', { name: '确认预约' });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/bookings', expect.any(Object));
      });
    });

    it('提交失败时显示错误信息', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: '预约失败，请稍后重试' }),
      });

      render(<InstantBookingModal {...defaultProps} />);

      // 填写表单
      const nameInput = screen.getByPlaceholderText('请输入您的姓名');
      const emailInput = screen.getByPlaceholderText('example@email.com');

      fireEvent.change(nameInput, { target: { value: '张三' } });
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

      // 点击提交
      const submitButton = screen.getByRole('button', { name: '确认预约' });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('预约失败，请稍后重试')).toBeInTheDocument();
      });
    });
  });

  describe('增值服务', () => {
    it('显示增值服务价格', () => {
      const propsWithUpgrades = {
        ...defaultProps,
        selectedUpgrades: [
          { id: '1', name: '专业摄影', icon: '📷', price: 300000 },
        ],
        subtotal: 2260000, // 9800*2 + 3000*2 = 25600
      };

      render(<InstantBookingModal {...propsWithUpgrades} />);

      expect(screen.getByText(/专业摄影/)).toBeInTheDocument();
    });
  });

  describe('初始电话号码', () => {
    it('预填初始电话号码', () => {
      render(<InstantBookingModal {...defaultProps} phone="13912345678" />);

      const phoneInput = screen.getByPlaceholderText('用于预约确认通知');
      expect(phoneInput).toHaveValue('13912345678');
    });
  });

  describe('服务条款提示', () => {
    it('显示服务条款提示', () => {
      render(<InstantBookingModal {...defaultProps} />);

      expect(screen.getByText(/点击确认即表示同意服务条款/)).toBeInTheDocument();
    });
  });
});
