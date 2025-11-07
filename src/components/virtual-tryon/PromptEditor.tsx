'use client';

import { useState } from 'react';
import { RotateCcw, Check } from 'lucide-react';
import { PROMPT_PRESETS, DEFAULT_PROMPT } from '@/lib/virtual-tryon-prompts';

interface PromptEditorProps {
  prompt: string;
  onPromptChange: (prompt: string) => void;
}

export default function PromptEditor({ prompt, onPromptChange }: PromptEditorProps) {
  const [localPrompt, setLocalPrompt] = useState(prompt);
  const [hasChanges, setHasChanges] = useState(false);

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

  const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedPreset = PROMPT_PRESETS.find(p => p.name === e.target.value);
    if (selectedPreset) {
      setLocalPrompt(selectedPreset.prompt);
      setHasChanges(selectedPreset.prompt !== prompt);
    }
  };

  const currentPreset = PROMPT_PRESETS.find(p => p.prompt === localPrompt);
  const isModified = prompt !== DEFAULT_PROMPT;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">🔧</span>
          <h3 className="text-sm font-semibold text-gray-900">Prompt 编辑器</h3>
          {isModified && (
            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
              自定义
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">
            字数: {localPrompt.length} / 5000
          </span>
        </div>
      </div>

      {/* Preset Selector */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1.5">
          预设模板
        </label>
        <select
          value={currentPreset?.name || ''}
          onChange={handlePresetChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sakura-500 focus:border-transparent"
        >
          <option value="">选择预设模板...</option>
          {PROMPT_PRESETS.map((preset) => (
            <option key={preset.name} value={preset.name}>
              {preset.name} - {preset.description}
            </option>
          ))}
        </select>
      </div>

      {/* Textarea */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1.5">
          提示词内容
        </label>
        <textarea
          value={localPrompt}
          onChange={handleTextChange}
          rows={12}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-sakura-500 focus:border-transparent resize-y"
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
          重置为默认
        </button>
        <button
          onClick={handleApply}
          disabled={!hasChanges}
          className={`
            flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2
            ${hasChanges
              ? 'bg-sakura-600 text-white hover:bg-sakura-700 active:scale-[0.98]'
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
