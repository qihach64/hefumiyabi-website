'use client';

import { ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import type { DebugInfo } from '../types';

export type { DebugInfo };

interface DebugPanelProps {
  debugInfo: DebugInfo | null;
  duration?: number;
  error?: string | null;
}

export default function DebugPanel({ debugInfo, duration, error }: DebugPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyJSON = () => {
    if (!debugInfo) return;
    const json = JSON.stringify({ debugInfo, duration, error }, null, 2);
    navigator.clipboard.writeText(json);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden bg-white">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">📡</span>
          <h3 className="text-sm font-semibold text-gray-900">API Debug 信息</h3>
          {debugInfo && (
            <span className="text-xs text-gray-500">
              ({debugInfo.model})
            </span>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="h-5 w-5 text-gray-500" />
        ) : (
          <ChevronDown className="h-5 w-5 text-gray-500" />
        )}
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="p-4 space-y-4 text-sm">
          {debugInfo ? (
            <>
              {/* Request Info */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">请求参数</h4>
                <div className="bg-gray-50 rounded p-3 space-y-1.5 font-mono text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600">模型:</span>
                    <span className="text-gray-900 font-medium">{debugInfo.model}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">提示词长度:</span>
                    <span className="text-gray-900 font-medium">
                      {debugInfo.promptLength} 字符
                      {debugInfo.isCustomPrompt && (
                        <span className="ml-2 text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded">
                          自定义
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">人物图片大小:</span>
                    <span className="text-gray-900 font-medium">
                      {formatBytes(debugInfo.personImageSize)} (base64)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">和服图片大小:</span>
                    <span className="text-gray-900 font-medium">
                      {formatBytes(debugInfo.kimonoImageSize)} (base64)
                    </span>
                  </div>
                </div>
              </div>

              {/* Response Info */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">响应信息</h4>
                <div className="bg-gray-50 rounded p-3 space-y-1.5 font-mono text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600">生成耗时:</span>
                    <span className="text-gray-900 font-medium">
                      {duration ? `${duration}s` : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">状态:</span>
                    <span className="text-green-600 font-medium">200 OK</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">结果图片大小:</span>
                    <span className="text-gray-900 font-medium">
                      {formatBytes(debugInfo.resultImageSize)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">时间戳:</span>
                    <span className="text-gray-900 font-medium">
                      {new Date(debugInfo.timestamp).toLocaleTimeString('zh-CN')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={handleCopyJSON}
                  className="flex-1 py-2 px-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 text-green-600" />
                      <span className="text-green-600">已复制</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      <span>复制完整 JSON</span>
                    </>
                  )}
                </button>
              </div>
            </>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded p-3">
              <p className="text-sm text-red-800 font-medium">错误信息</p>
              <pre className="text-xs text-red-700 mt-2 whitespace-pre-wrap break-words">
                {error}
              </pre>
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">
              生成图片后将显示调试信息
            </p>
          )}
        </div>
      )}
    </div>
  );
}
