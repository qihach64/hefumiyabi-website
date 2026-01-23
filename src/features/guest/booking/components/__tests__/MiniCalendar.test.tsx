/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import MiniCalendar from '../MiniCalendar';

describe('MiniCalendar', () => {
  let mockOnChange: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnChange = vi.fn();
    // 固定时间为 2025-01-15
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-15T10:00:00'));
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  describe('渲染', () => {
    it('渲染当前月份', () => {
      render(<MiniCalendar value="" onChange={mockOnChange} />);

      expect(screen.getByText('2025年1月')).toBeInTheDocument();
    });

    it('渲染星期标题', () => {
      render(<MiniCalendar value="" onChange={mockOnChange} />);

      expect(screen.getByText('日')).toBeInTheDocument();
      expect(screen.getByText('一')).toBeInTheDocument();
      expect(screen.getByText('二')).toBeInTheDocument();
      expect(screen.getByText('三')).toBeInTheDocument();
      expect(screen.getByText('四')).toBeInTheDocument();
      expect(screen.getByText('五')).toBeInTheDocument();
      expect(screen.getByText('六')).toBeInTheDocument();
    });

    it('渲染快捷选择按钮', () => {
      render(<MiniCalendar value="" onChange={mockOnChange} />);

      expect(screen.getByText('今天')).toBeInTheDocument();
      expect(screen.getByText('明天')).toBeInTheDocument();
      expect(screen.getByText('周末')).toBeInTheDocument();
    });

    it('应用自定义 className', () => {
      const { container } = render(
        <MiniCalendar value="" onChange={mockOnChange} className="custom-class" />
      );

      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('月份导航', () => {
    it('点击下个月按钮切换到下月', () => {
      render(<MiniCalendar value="" onChange={mockOnChange} />);

      const nextButton = screen.getByRole('button', { name: '下个月' });
      fireEvent.click(nextButton);

      expect(screen.getByText('2025年2月')).toBeInTheDocument();
    });

    it('当前月禁用上个月按钮', () => {
      render(<MiniCalendar value="" onChange={mockOnChange} />);

      const prevButton = screen.getByRole('button', { name: '上个月' });
      expect(prevButton).toBeDisabled();
    });

    it('非当前月可以点击上个月按钮', () => {
      render(<MiniCalendar value="" onChange={mockOnChange} />);

      // 先切换到下个月
      const nextButton = screen.getByRole('button', { name: '下个月' });
      fireEvent.click(nextButton);
      expect(screen.getByText('2025年2月')).toBeInTheDocument();

      // 然后点击上个月
      const prevButton = screen.getByRole('button', { name: '上个月' });
      expect(prevButton).not.toBeDisabled();
      fireEvent.click(prevButton);

      expect(screen.getByText('2025年1月')).toBeInTheDocument();
    });
  });

  describe('日期选择', () => {
    it('点击日期触发 onChange 回调', () => {
      render(<MiniCalendar value="" onChange={mockOnChange} />);

      // 点击 1 月 20 日
      const dayButtons = screen.getAllByRole('button');
      const day20 = dayButtons.find((btn) => btn.textContent === '20');
      expect(day20).toBeDefined();
      fireEvent.click(day20!);

      expect(mockOnChange).toHaveBeenCalledWith('2025-01-20');
    });

    it('选中日期高亮显示', () => {
      render(<MiniCalendar value="2025-01-20" onChange={mockOnChange} />);

      const dayButtons = screen.getAllByRole('button');
      const selectedDay = dayButtons.find((btn) => btn.textContent === '20');

      expect(selectedDay).toHaveClass('bg-sakura-500', 'text-white');
    });

    it('今天日期有特殊样式', () => {
      render(<MiniCalendar value="" onChange={mockOnChange} />);

      const dayButtons = screen.getAllByRole('button');
      // 1月15日是今天
      const todayButton = dayButtons.find((btn) => btn.textContent === '15');

      expect(todayButton).toHaveClass('bg-sakura-50');
    });
  });

  describe('过去日期禁用', () => {
    it('过去的日期被禁用', () => {
      render(<MiniCalendar value="" onChange={mockOnChange} />);

      const dayButtons = screen.getAllByRole('button');
      // 1月14日是昨天，应该被禁用
      const yesterdayButton = dayButtons.find((btn) => btn.textContent === '14');

      expect(yesterdayButton).toBeDisabled();
    });

    it('点击过去日期不触发 onChange', () => {
      render(<MiniCalendar value="" onChange={mockOnChange} />);

      const dayButtons = screen.getAllByRole('button');
      const pastDay = dayButtons.find((btn) => btn.textContent === '10');
      fireEvent.click(pastDay!);

      expect(mockOnChange).not.toHaveBeenCalled();
    });
  });

  describe('快捷选择', () => {
    it('点击今天选择今日日期', () => {
      render(<MiniCalendar value="" onChange={mockOnChange} />);

      const todayButton = screen.getByText('今天');
      fireEvent.click(todayButton);

      expect(mockOnChange).toHaveBeenCalledWith('2025-01-15');
    });

    it('点击明天选择明日日期', () => {
      render(<MiniCalendar value="" onChange={mockOnChange} />);

      const tomorrowButton = screen.getByText('明天');
      fireEvent.click(tomorrowButton);

      expect(mockOnChange).toHaveBeenCalledWith('2025-01-16');
    });

    it('点击周末选择下一个周六', () => {
      render(<MiniCalendar value="" onChange={mockOnChange} />);

      const weekendButton = screen.getByText('周末');
      fireEvent.click(weekendButton);

      // 2025-01-15 是周三，下一个周六是 2025-01-18
      expect(mockOnChange).toHaveBeenCalledWith('2025-01-18');
    });
  });

  describe('初始化', () => {
    it('如果有选中值，从该月开始显示', () => {
      render(<MiniCalendar value="2025-03-15" onChange={mockOnChange} />);

      expect(screen.getByText('2025年3月')).toBeInTheDocument();
    });
  });
});
