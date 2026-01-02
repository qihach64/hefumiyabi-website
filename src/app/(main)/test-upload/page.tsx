'use client';

import { useState } from 'react';
import ImageUploader from '@/components/ImageUploader';
import Image from 'next/image';

export default function TestUploadPage() {
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="container mx-auto py-8 px-4 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">图片上传测试</h1>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-medium mb-4">上传图片</h2>

        <ImageUploader
          category="tryon"
          entityId="test-upload"
          purpose="main"
          multiple={true}
          maxFiles={5}
          onChange={(urls) => {
            const urlArray = Array.isArray(urls) ? urls : [urls];
            setUploadedUrls(urlArray.filter(Boolean));
          }}
          onUploadComplete={(urls) => {
            console.log('Upload complete:', urls);
          }}
          onError={(err) => {
            setError(err);
            console.error('Upload error:', err);
          }}
        />

        {error && (
          <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}
      </div>

      {uploadedUrls.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium mb-4">已上传的图片 URL</h2>

          <div className="space-y-3">
            {uploadedUrls.map((url, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="relative w-16 h-20 flex-shrink-0 bg-gray-200 rounded overflow-hidden">
                  <Image
                    src={url}
                    alt={`Uploaded ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 mb-1">图片 {index + 1}</p>
                  <code className="text-xs break-all text-gray-700 block">
                    {url}
                  </code>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 text-sm text-gray-500">
        <p>测试说明：</p>
        <ul className="list-disc list-inside mt-2 space-y-1">
          <li>支持 JPEG, PNG, WebP 格式</li>
          <li>最大文件大小 20MB</li>
          <li>最多上传 5 张图片</li>
          <li>上传后图片通过 CloudFront CDN 访问</li>
        </ul>
      </div>
    </div>
  );
}
