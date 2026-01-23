/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import TimeSlotPicker from '../TimeSlotPicker';

describe('TimeSlotPicker', () => {
  let mockOnChange: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnChange = vi.fn();
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  describe('渲染', () => {
    it('渲染三个时间段分组 (上午/中午/下午)', () => {
      render(<TimeSlotPicker value="" onChange={mockOnChange} />);

      expect(screen.getByText('上午')).toBeInTheDocument();
      expect(screen.getByText('中午')).toBeInTheDocument();
      expect(screen.getByText('下午')).toBeInTheDocument();
    });

    it('渲染正确的时间选项', () => {
      render(<TimeSlotPicker value="" onChange={mockOnChange} />);

      // 上午时段
      expect(screen.getByText('9:00')).toBeInTheDocument();
      expect(screen.getByText('10:00')).toBeInTheDocument();
      expect(screen.getByText('11:30')).toBeInTheDocument();

      // 中午时段
      expect(screen.getByText('12:00')).toBeInTheDocument();

      // 下午时段
      expect(screen.getByText('13:00')).toBeInTheDocument();
      expect(screen.getByText('15:00')).toBeInTheDocument();
      expect(screen.getByText('16:00')).toBeInTheDocument();
    });

    it('应用自定义 className', () => {
      const { container } = render(
        <TimeSlotPicker value="" onChange={mockOnChange} className="custom-class" />
      );

      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('选中状态', () => {
    it('高亮选中的时间段', () => {
      render(<TimeSlotPicker value="10:00" onChange={mockOnChange} />);

      const selectedButton = screen.getByText('10:00');
      expect(selectedButton).toHaveClass('bg-sakura-500', 'text-white');
    });

    it('未选中的时间段显示默认样式', () => {
      render(<TimeSlotPicker value="10:00" onChange={mockOnChange} />);

      const unselectedButton = screen.getByText('9:00');
      expect(unselectedButton).toHaveClass('bg-wabi-50');
      expect(unselectedButton).not.toHaveClass('bg-sakura-500');
    });
  });

  describe('用户交互', () => {
    it('点击时间段触发 onChange 回调', () => {
      render(<TimeSlotPicker value="" onChange={mockOnChange} />);

      const timeButton = screen.getByText('14:00');
      fireEvent.click(timeButton);

      expect(mockOnChange).toHaveBeenCalledWith('14:00');
    });

    it('点击不同时间段更新选中值', () => {
      render(<TimeSlotPicker value="10:00" onChange={mockOnChange} />);

      const newTimeButton = screen.getByText('15:30');
      fireEvent.click(newTimeButton);

      expect(mockOnChange).toHaveBeenCalledWith('15:30');
    });

    it('点击已选中的时间段仍然触发 onChange', () => {
      render(<TimeSlotPicker value="10:00" onChange={mockOnChange} />);

      const selectedButton = screen.getByText('10:00');
      fireEvent.click(selectedButton);

      expect(mockOnChange).toHaveBeenCalledWith('10:00');
    });
  });

  describe('时间段分组', () => {
    it('上午时段包含 9:00-11:30', () => {
      render(<TimeSlotPicker value="" onChange={mockOnChange} />);

      // 获取上午分组下的所有按钮
      const morningSection = screen.getByText('上午').parentElement?.parentElement;
      const morningButtons = morningSection?.querySelectorAll('button');

      expect(morningButtons?.length).toBe(6); // 9:00, 9:30, 10:00, 10:30, 11:00, 11:30
    });

    it('中午时段只包含 12:00', () => {
      render(<TimeSlotPicker value="" onChange={mockOnChange} />);

      const noonSection = screen.getByText('中午').parentElement?.parentElement;
      const noonButtons = noonSection?.querySelectorAll('button');

      expect(noonButtons?.length).toBe(1);
      expect(screen.getByText('12:00')).toBeInTheDocument();
    });

    it('下午时段包含 13:00-16:00', () => {
      render(<TimeSlotPicker value="" onChange={mockOnChange} />);

      const afternoonSection = screen.getByText('下午').parentElement?.parentElement;
      const afternoonButtons = afternoonSection?.querySelectorAll('button');

      expect(afternoonButtons?.length).toBe(7); // 13:00, 13:30, 14:00, 14:30, 15:00, 15:30, 16:00
    });
  });
});
