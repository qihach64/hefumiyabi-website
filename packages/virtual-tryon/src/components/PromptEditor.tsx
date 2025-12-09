'use client';

import { useState } from 'react';
import { RotateCcw, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { DEFAULT_PROMPT } from '../lib/prompts';

interface PromptEditorProps {
  prompt: string;
  onPromptChange: (prompt: string) => void;
  /** 是否显示为只读预览模式 */
  readOnly?: boolean;
}

/**
 * Prompt 编辑器组件 (V2 简化版)
 *
 * 移除了模板选择功能，使用统一的默认 Prompt
 * 支持只读预览模式和可折叠展示
 */
export default function PromptEditor({
  prompt,
  onPromptChange,
  readOnly = false
}: PromptEditorProps) {
  const [localPrompt, setLocalPrompt] = useState(prompt);
  const [hasChanges, setHasChanges] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLocalPrompt(e.target.value);
    setHasChanges(e.target.value !== prompt);
  };

  const handleApply = () => {
    onPromptChange(localPrompt);
    setHasChanges(false);
  };

  const handleReset = () => {
    setLocalPrompt(DEFAULT_PROMPT);
    setHasChanges(DEFAULT_PROMPT !== prompt);
  };

  const isModified = prompt !== DEFAULT_PROMPT;

  // 只读预览模式
  if (readOnly) {
    return (
      <div className="space-y-2">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="text-sm">📝</span>
            <span className="text-sm font-medium text-gray-700">查看 Prompt</span>
            {isModified && (
              <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                已修改
              </span>
            )}
          </div>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-gray-500" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-500" />
          )}
        </button>

        {isExpanded && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <pre className="text-xs text-gray-600 whitespace-pre-wrap font-mono max-h-40 overflow-y-auto">
              {prompt}
            </pre>
          </div>
        )}
      </div>
    );
  }

  // 可编辑模式
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">🔧</span>
          <h3 className="text-sm font-semibold text-gray-900">Prompt 设置</h3>
          {isModified && (
            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
              自定义
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">
            {localPrompt.length} / 5000 字符
          </span>
        </div>
      </div>

      {/* Info Banner */}
      <div className="p-3 bg-blue-50 rounded-lg">
        <p className="text-xs text-blue-700">
          💡 系统已自动使用优化后的统一 Prompt，通常无需修改。如需自定义，可在下方编辑。
        </p>
      </div>

      {/* Textarea */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1.5">
          提示词内容
        </label>
        <textarea
          value={localPrompt}
          onChange={handleTextChange}
          rows={10}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-y"
          placeholder="输入自定义提示词..."
          spellCheck={false}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={handleReset}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          重置默认
        </button>
        <button
          onClick={handleApply}
          disabled={!hasChanges}
          className={`
            flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2
            ${hasChanges
              ? 'bg-pink-600 text-white hover:bg-pink-700 active:scale-[0.98]'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }
          `}
        >
          <Check className="h-4 w-4" />
          {hasChanges ? '应用修改' : '已应用'}
        </button>
      </div>

      {/* Warning */}
      {localPrompt.length > 4500 && (
        <p className="text-xs text-orange-600 flex items-center gap-1">
          ⚠️ 提示词长度接近限制 (5000字符)
        </p>
      )}
    </div>
  );
}
