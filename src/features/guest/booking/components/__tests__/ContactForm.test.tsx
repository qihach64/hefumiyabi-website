/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import ContactForm, { type ContactFormValues, type ContactFormErrors } from '../ContactForm';

describe('ContactForm', () => {
  let mockOnChange: ReturnType<typeof vi.fn>;
  const defaultValues: ContactFormValues = {
    name: '',
    email: '',
    phone: '',
    notes: '',
  };

  beforeEach(() => {
    mockOnChange = vi.fn();
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  describe('渲染', () => {
    it('渲染所有表单字段', () => {
      render(<ContactForm values={defaultValues} onChange={mockOnChange} />);

      expect(screen.getByText('姓名')).toBeInTheDocument();
      expect(screen.getByText('邮箱')).toBeInTheDocument();
      expect(screen.getByText('手机号')).toBeInTheDocument();
      expect(screen.getByText('备注')).toBeInTheDocument();
    });

    it('渲染联系信息标题', () => {
      render(<ContactForm values={defaultValues} onChange={mockOnChange} />);

      expect(screen.getByText('联系信息')).toBeInTheDocument();
    });

    it('showTitle=false 时不渲染标题', () => {
      render(<ContactForm values={defaultValues} onChange={mockOnChange} showTitle={false} />);

      expect(screen.queryByText('联系信息')).not.toBeInTheDocument();
    });

    it('渲染占位符文本', () => {
      render(<ContactForm values={defaultValues} onChange={mockOnChange} />);

      expect(screen.getByPlaceholderText('请输入您的姓名')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('example@email.com')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('用于预约确认通知')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('如有特殊要求或备注，请在此处填写...')).toBeInTheDocument();
    });
  });

  describe('必填字段标记', () => {
    it('姓名、邮箱、手机号标记为必填 (红色 *)', () => {
      render(<ContactForm values={defaultValues} onChange={mockOnChange} />);

      // 检查必填标记
      const requiredMarkers = screen.getAllByText('*');
      expect(requiredMarkers.length).toBe(3);

      // 每个必填标记应该是红色的
      requiredMarkers.forEach((marker) => {
        expect(marker).toHaveClass('text-red-500');
      });
    });

    it('备注字段标记为可选', () => {
      render(<ContactForm values={defaultValues} onChange={mockOnChange} />);

      expect(screen.getByText('(可选)')).toBeInTheDocument();
    });
  });

  describe('输入交互', () => {
    it('输入姓名触发 onChange', () => {
      render(<ContactForm values={defaultValues} onChange={mockOnChange} />);

      const nameInput = screen.getByPlaceholderText('请输入您的姓名');
      fireEvent.change(nameInput, { target: { value: '张三' } });

      expect(mockOnChange).toHaveBeenCalledWith({
        ...defaultValues,
        name: '张三',
      });
    });

    it('输入邮箱触发 onChange', () => {
      render(<ContactForm values={defaultValues} onChange={mockOnChange} />);

      const emailInput = screen.getByPlaceholderText('example@email.com');
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

      expect(mockOnChange).toHaveBeenCalledWith({
        ...defaultValues,
        email: 'test@example.com',
      });
    });

    it('输入电话触发 onChange', () => {
      render(<ContactForm values={defaultValues} onChange={mockOnChange} />);

      const phoneInput = screen.getByPlaceholderText('用于预约确认通知');
      fireEvent.change(phoneInput, { target: { value: '13812345678' } });

      expect(mockOnChange).toHaveBeenCalledWith({
        ...defaultValues,
        phone: '13812345678',
      });
    });

    it('输入备注触发 onChange', () => {
      render(<ContactForm values={defaultValues} onChange={mockOnChange} />);

      const notesInput = screen.getByPlaceholderText('如有特殊要求或备注，请在此处填写...');
      fireEvent.change(notesInput, { target: { value: '需要轮椅通道' } });

      expect(mockOnChange).toHaveBeenCalledWith({
        ...defaultValues,
        notes: '需要轮椅通道',
      });
    });
  });

  describe('显示当前值', () => {
    it('显示传入的表单值', () => {
      const filledValues: ContactFormValues = {
        name: '李四',
        email: 'lisi@example.com',
        phone: '13987654321',
        notes: '早点到',
      };

      render(<ContactForm values={filledValues} onChange={mockOnChange} />);

      expect(screen.getByDisplayValue('李四')).toBeInTheDocument();
      expect(screen.getByDisplayValue('lisi@example.com')).toBeInTheDocument();
      expect(screen.getByDisplayValue('13987654321')).toBeInTheDocument();
      expect(screen.getByDisplayValue('早点到')).toBeInTheDocument();
    });
  });

  describe('错误状态显示', () => {
    it('显示姓名错误信息', () => {
      const errors: ContactFormErrors = {
        name: '请填写姓名',
      };

      render(<ContactForm values={defaultValues} onChange={mockOnChange} errors={errors} />);

      expect(screen.getByText('请填写姓名')).toBeInTheDocument();
    });

    it('显示邮箱错误信息', () => {
      const errors: ContactFormErrors = {
        email: '邮箱格式不正确',
      };

      render(<ContactForm values={defaultValues} onChange={mockOnChange} errors={errors} />);

      expect(screen.getByText('邮箱格式不正确')).toBeInTheDocument();
    });

    it('显示电话错误信息', () => {
      const errors: ContactFormErrors = {
        phone: '请填写手机号',
      };

      render(<ContactForm values={defaultValues} onChange={mockOnChange} errors={errors} />);

      expect(screen.getByText('请填写手机号')).toBeInTheDocument();
    });

    it('错误输入框显示红色边框', () => {
      const errors: ContactFormErrors = {
        name: '请填写姓名',
      };

      render(<ContactForm values={defaultValues} onChange={mockOnChange} errors={errors} />);

      const nameInput = screen.getByPlaceholderText('请输入您的姓名');
      expect(nameInput).toHaveClass('border-red-400');
    });
  });

  describe('紧凑模式', () => {
    it('compact=true 时应用紧凑样式', () => {
      const { container } = render(
        <ContactForm values={defaultValues} onChange={mockOnChange} compact />
      );

      // 紧凑模式下间距更小
      expect(container.firstChild).toHaveClass('space-y-3');
    });

    it('compact=false 时应用标准样式', () => {
      const { container } = render(
        <ContactForm values={defaultValues} onChange={mockOnChange} compact={false} />
      );

      expect(container.firstChild).toHaveClass('space-y-4');
    });

    it('紧凑模式下备注框行数更少', () => {
      render(<ContactForm values={defaultValues} onChange={mockOnChange} compact />);

      const notesTextarea = screen.getByPlaceholderText('如有特殊要求或备注，请在此处填写...');
      expect(notesTextarea).toHaveAttribute('rows', '2');
    });

    it('标准模式下备注框行数更多', () => {
      render(<ContactForm values={defaultValues} onChange={mockOnChange} compact={false} />);

      const notesTextarea = screen.getByPlaceholderText('如有特殊要求或备注，请在此处填写...');
      expect(notesTextarea).toHaveAttribute('rows', '3');
    });
  });
});
