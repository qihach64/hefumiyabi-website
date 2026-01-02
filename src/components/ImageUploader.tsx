'use client';

import { useState, useCallback, useRef } from 'react';
import Image from 'next/image';
import { Upload, X, Loader2, AlertCircle, ImageIcon, Star, GripVertical } from 'lucide-react';
import type { ImageCategory, ImagePurpose } from '@/lib/aws';

interface UploadedImage {
  key: string;
  publicUrl: string;
  status: 'uploading' | 'success' | 'error';
  progress?: number;
  error?: string;
  file?: File;
  preview?: string;
}

interface ImageUploaderProps {
  category: ImageCategory;
  entityId?: string;
  purpose?: ImagePurpose;
  multiple?: boolean;
  maxFiles?: number;
  // 所有图片 URL
  value?: string[];
  // 主图 URL
  mainImage?: string;
  // 图片变化回调
  onChange?: (urls: string[]) => void;
  // 主图变化回调
  onMainImageChange?: (url: string) => void;
  onUploadComplete?: (urls: string[]) => void;
  onError?: (error: string) => void;
  className?: string;
  aspectRatio?: '3:4' | '4:3' | '1:1' | '16:9';
  disabled?: boolean;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export default function ImageUploader({
  category,
  entityId,
  purpose = 'main',
  multiple = true,
  maxFiles = 10,
  value = [],
  mainImage,
  onChange,
  onMainImageChange,
  onUploadComplete,
  onError,
  className = '',
  aspectRatio = '3:4',
  disabled = false,
}: ImageUploaderProps) {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 已有图片
  const existingUrls = value || [];

  const aspectRatioClass = {
    '3:4': 'aspect-[3/4]',
    '4:3': 'aspect-[4/3]',
    '1:1': 'aspect-square',
    '16:9': 'aspect-video',
  }[aspectRatio];

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return `不支持的文件类型。支持: JPEG, PNG, WebP`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return `文件太大。最大支持 ${MAX_FILE_SIZE / 1024 / 1024}MB`;
    }
    return null;
  };

  const uploadFile = async (file: File): Promise<UploadedImage> => {
    const preview = URL.createObjectURL(file);
    const tempId = `temp-${Date.now()}-${Math.random()}`;

    const uploadingImage: UploadedImage = {
      key: tempId,
      publicUrl: '',
      status: 'uploading',
      progress: 0,
      file,
      preview,
    };

    setImages((prev) => [...prev, uploadingImage]);

    try {
      // 1. 获取预签名 URL
      const presignRes = await fetch('/api/upload/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileType: file.type,
          fileSize: file.size,
          category,
          entityId,
          purpose,
        }),
      });

      if (!presignRes.ok) {
        const error = await presignRes.json();
        throw new Error(error.error || '获取上传凭证失败');
      }

      const { presignedUrl, key, publicUrl } = await presignRes.json();

      // 2. 上传到 S3
      const uploadRes = await fetch(presignedUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type,
        },
        body: file,
      });

      if (!uploadRes.ok) {
        throw new Error('上传失败');
      }

      // 3. 更新状态
      const successImage: UploadedImage = {
        key,
        publicUrl,
        status: 'success',
        preview,
      };

      setImages((prev) =>
        prev.map((img) => (img.key === tempId ? successImage : img))
      );

      return successImage;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : '上传失败';

      const errorImage: UploadedImage = {
        key: tempId,
        publicUrl: '',
        status: 'error',
        error: errorMessage,
        preview,
      };

      setImages((prev) =>
        prev.map((img) => (img.key === tempId ? errorImage : img))
      );

      onError?.(errorMessage);
      return errorImage;
    }
  };

  const handleFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const currentCount = images.length + existingUrls.length;
    const remainingSlots = maxFiles - currentCount;

    if (remainingSlots <= 0) {
      onError?.(`最多上传 ${maxFiles} 张图片`);
      return;
    }

    const filesToUpload = fileArray.slice(0, remainingSlots);
    const validationErrors: string[] = [];

    // 验证文件
    const validFiles = filesToUpload.filter((file) => {
      const error = validateFile(file);
      if (error) {
        validationErrors.push(`${file.name}: ${error}`);
        return false;
      }
      return true;
    });

    if (validationErrors.length > 0) {
      onError?.(validationErrors.join('\n'));
    }

    if (validFiles.length === 0) return;

    // 并行上传
    const results = await Promise.all(validFiles.map(uploadFile));
    const successUrls = results
      .filter((r) => r.status === 'success')
      .map((r) => r.publicUrl);

    if (successUrls.length > 0) {
      onUploadComplete?.(successUrls);

      // 清除已成功上传的图片从 images 状态（它们会通过 existingUrls 显示）
      setImages((prev) => {
        const successKeys = results
          .filter((r) => r.status === 'success')
          .map((r) => r.key);
        return prev.filter((img) => !successKeys.includes(img.key));
      });

      // 更新外部 value
      if (onChange) {
        const allUrls = [...existingUrls, ...successUrls];
        onChange(allUrls);

        // 如果没有主图，自动设置第一张为主图
        if (!mainImage && allUrls.length > 0 && onMainImageChange) {
          onMainImageChange(allUrls[0]);
        }
      }
    }
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      if (disabled) return;

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleFiles(files);
      }
    },
    [disabled]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
    // 重置 input 以允许重复选择同一文件
    e.target.value = '';
  };

  const removeImage = (key: string) => {
    setImages((prev) => {
      const removed = prev.find((img) => img.key === key);
      if (removed?.preview) {
        URL.revokeObjectURL(removed.preview);
      }
      return prev.filter((img) => img.key !== key);
    });
  };

  const removeExistingUrl = (url: string) => {
    if (onChange) {
      const newUrls = existingUrls.filter((u) => u !== url);
      onChange(newUrls);

      // 如果删除的是主图，重新设置主图
      if (url === mainImage && onMainImageChange) {
        onMainImageChange(newUrls[0] || '');
      }
    }
  };

  const setAsMainImage = (url: string) => {
    if (onMainImageChange) {
      onMainImageChange(url);
    }
  };

  const totalCount = existingUrls.length + images.length;
  const canAddMore = totalCount < maxFiles;

  // 确定当前主图（如果未设置，使用第一张）
  const currentMainImage = mainImage || existingUrls[0] || '';

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 图片网格 */}
      {(existingUrls.length > 0 || images.length > 0) && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {/* 已保存的图片 */}
          {existingUrls.map((url) => {
            const isMain = url === currentMainImage;
            return (
              <div
                key={url}
                className={`relative ${aspectRatioClass} bg-gray-100 rounded-xl overflow-hidden group cursor-pointer
                  ${isMain ? 'ring-2 ring-sakura-500 ring-offset-2' : 'hover:ring-2 hover:ring-gray-300'}`}
                onClick={() => !disabled && setAsMainImage(url)}
              >
                <Image
                  src={url}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="200px"
                />

                {/* 主图标记 */}
                {isMain && (
                  <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 bg-sakura-500 text-white text-xs font-medium rounded-full">
                    <Star className="w-3 h-3 fill-current" />
                    主图
                  </div>
                )}

                {/* 悬停提示 - 非主图时显示 */}
                {!isMain && !disabled && (
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white text-sm font-medium">点击设为主图</span>
                  </div>
                )}

                {/* 删除按钮 */}
                {!disabled && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeExistingUrl(url);
                    }}
                    className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })}

          {/* 新上传的图片 */}
          {images.map((img) => (
            <div
              key={img.key}
              className={`relative ${aspectRatioClass} bg-gray-100 rounded-xl overflow-hidden group`}
            >
              {img.preview && (
                <Image
                  src={img.preview}
                  alt=""
                  fill
                  className={`object-cover ${img.status === 'uploading' ? 'opacity-50' : ''}`}
                  sizes="200px"
                />
              )}

              {/* 上传中 */}
              {img.status === 'uploading' && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                </div>
              )}

              {/* 上传失败 */}
              {img.status === 'error' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-500/80 text-white p-2">
                  <AlertCircle className="w-6 h-6 mb-1" />
                  <span className="text-xs text-center">{img.error}</span>
                </div>
              )}

              {/* 删除按钮 */}
              {!disabled && img.status !== 'uploading' && (
                <button
                  type="button"
                  onClick={() => removeImage(img.key)}
                  className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}

          {/* 添加更多按钮 */}
          {canAddMore && !disabled && (
            <div
              onClick={handleClick}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`
                relative ${aspectRatioClass} border-2 border-dashed rounded-xl
                flex flex-col items-center justify-center cursor-pointer
                transition-colors duration-200
                ${isDragging
                  ? 'border-sakura-500 bg-sakura-50'
                  : 'border-gray-300 hover:border-sakura-400 hover:bg-gray-50'
                }
              `}
            >
              <Upload className="w-6 h-6 text-gray-400 mb-1" />
              <span className="text-xs text-gray-500">添加图片</span>
            </div>
          )}
        </div>
      )}

      {/* 空状态 - 上传区域 */}
      {existingUrls.length === 0 && images.length === 0 && !disabled && (
        <div
          onClick={handleClick}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`
            relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
            transition-colors duration-200
            ${isDragging
              ? 'border-sakura-500 bg-sakura-50'
              : 'border-gray-300 hover:border-sakura-400 hover:bg-gray-50'
            }
          `}
        >
          <div className="flex flex-col items-center gap-2">
            {isDragging ? (
              <Upload className="w-10 h-10 text-sakura-500" />
            ) : (
              <ImageIcon className="w-10 h-10 text-gray-400" />
            )}

            <div className="text-sm text-gray-600">
              <span className="font-medium text-sakura-600">
                点击上传
              </span>
              <span> 或拖拽图片到此处</span>
            </div>

            <p className="text-xs text-gray-400">
              支持 JPEG, PNG, WebP，最大 10MB
              {multiple && maxFiles > 1 && (
                <span>，最多 {maxFiles} 张</span>
              )}
            </p>
          </div>
        </div>
      )}

      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ALLOWED_TYPES.join(',')}
        multiple={multiple}
        onChange={handleFileInput}
        className="hidden"
      />

      {/* 使用说明 */}
      {existingUrls.length > 0 && !disabled && (
        <p className="text-xs text-gray-500 flex items-center gap-1">
          <Star className="w-3 h-3 text-sakura-500 fill-current" />
          点击图片可设为主图，主图将用于套餐卡片展示
        </p>
      )}
    </div>
  );
}
