/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import CollapsibleDateTimePicker from '../CollapsibleDateTimePicker';

describe('CollapsibleDateTimePicker', () => {
  let mockOnDateChange: ReturnType<typeof vi.fn>;
  let mockOnTimeChange: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnDateChange = vi.fn();
    mockOnTimeChange = vi.fn();
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  describe('渲染', () => {
    it('渲染日期和时间选择区域', () => {
      render(
        <CollapsibleDateTimePicker
          date=""
          time=""
          onDateChange={mockOnDateChange}
          onTimeChange={mockOnTimeChange}
        />
      );

      expect(screen.getByText('到店日期')).toBeInTheDocument();
      expect(screen.getByText('到店时间')).toBeInTheDocument();
    });

    it('无选中值时显示占位文本', () => {
      render(
        <CollapsibleDateTimePicker
          date=""
          time=""
          onDateChange={mockOnDateChange}
          onTimeChange={mockOnTimeChange}
        />
      );

      expect(screen.getByText('请选择日期')).toBeInTheDocument();
      expect(screen.getByText('请选择时间')).toBeInTheDocument();
    });

    it('显示已选中的日期', () => {
      render(
        <CollapsibleDateTimePicker
          date="2025-01-20"
          time=""
          onDateChange={mockOnDateChange}
          onTimeChange={mockOnTimeChange}
        />
      );

      // 日期选中后不再显示占位文本
      expect(screen.queryByText('请选择日期')).not.toBeInTheDocument();
    });

    it('显示已选中的时间', () => {
      render(
        <CollapsibleDateTimePicker
          date=""
          time="14:30"
          onDateChange={mockOnDateChange}
          onTimeChange={mockOnTimeChange}
        />
      );

      expect(screen.getByText('下午 14:30')).toBeInTheDocument();
    });
  });

  describe('折叠/展开', () => {
    it('点击日期区域展开日历', async () => {
      render(
        <CollapsibleDateTimePicker
          date=""
          time=""
          onDateChange={mockOnDateChange}
          onTimeChange={mockOnTimeChange}
        />
      );

      const dateButton = screen.getByText('请选择日期').closest('button');
      fireEvent.click(dateButton!);

      // 日历应该可见 - 快捷按钮出现
      await waitFor(() => {
        expect(screen.getByText('今天')).toBeInTheDocument();
      });
    });

    it('点击时间区域展开时间选择器', async () => {
      render(
        <CollapsibleDateTimePicker
          date=""
          time=""
          onDateChange={mockOnDateChange}
          onTimeChange={mockOnTimeChange}
        />
      );

      const timeButton = screen.getByText('请选择时间').closest('button');
      fireEvent.click(timeButton!);

      // 时间选择器应该可见
      await waitFor(() => {
        expect(screen.getByText('上午')).toBeInTheDocument();
        expect(screen.getByText('下午')).toBeInTheDocument();
      });
    });
  });

  describe('时间选择', () => {
    it('选择时间触发 onTimeChange', async () => {
      render(
        <CollapsibleDateTimePicker
          date=""
          time=""
          onDateChange={mockOnDateChange}
          onTimeChange={mockOnTimeChange}
        />
      );

      // 展开时间选择器
      const timeButton = screen.getByText('请选择时间').closest('button');
      fireEvent.click(timeButton!);

      await waitFor(() => {
        expect(screen.getByText('上午')).toBeInTheDocument();
      });

      // 选择时间
      fireEvent.click(screen.getByText('10:00'));

      expect(mockOnTimeChange).toHaveBeenCalledWith('10:00');
    });
  });

  describe('日期自动填充标记', () => {
    it('dateAutoFilled=true 时显示已预填标记', () => {
      render(
        <CollapsibleDateTimePicker
          date="2025-01-20"
          time=""
          onDateChange={mockOnDateChange}
          onTimeChange={mockOnTimeChange}
          dateAutoFilled
        />
      );

      expect(screen.getByText('✓ 已预填')).toBeInTheDocument();
    });

    it('dateAutoFilled=false 时不显示预填标记', () => {
      render(
        <CollapsibleDateTimePicker
          date="2025-01-20"
          time=""
          onDateChange={mockOnDateChange}
          onTimeChange={mockOnTimeChange}
          dateAutoFilled={false}
        />
      );

      expect(screen.queryByText('✓ 已预填')).not.toBeInTheDocument();
    });

    it('没有日期时不显示预填标记', () => {
      render(
        <CollapsibleDateTimePicker
          date=""
          time=""
          onDateChange={mockOnDateChange}
          onTimeChange={mockOnTimeChange}
          dateAutoFilled
        />
      );

      expect(screen.queryByText('✓ 已预填')).not.toBeInTheDocument();
    });
  });

  describe('时间格式化', () => {
    it('上午时间显示"上午"前缀', () => {
      render(
        <CollapsibleDateTimePicker
          date=""
          time="09:30"
          onDateChange={mockOnDateChange}
          onTimeChange={mockOnTimeChange}
        />
      );

      expect(screen.getByText('上午 09:30')).toBeInTheDocument();
    });

    it('中午时间显示"中午"前缀', () => {
      render(
        <CollapsibleDateTimePicker
          date=""
          time="12:00"
          onDateChange={mockOnDateChange}
          onTimeChange={mockOnTimeChange}
        />
      );

      expect(screen.getByText('中午 12:00')).toBeInTheDocument();
    });

    it('下午时间显示"下午"前缀', () => {
      render(
        <CollapsibleDateTimePicker
          date=""
          time="15:00"
          onDateChange={mockOnDateChange}
          onTimeChange={mockOnTimeChange}
        />
      );

      expect(screen.getByText('下午 15:00')).toBeInTheDocument();
    });
  });
});
