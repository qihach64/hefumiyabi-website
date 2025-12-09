'use client';

import { VirtualTryOnApp } from '@kimono-one/virtual-tryon';
import Image from 'next/image';

// Next.js Image wrapper for the package
function NextImage({ src, alt, fill, className }: {
  src: string;
  alt: string;
  fill?: boolean;
  className?: string;
}) {
  return (
    <Image
      src={src}
      alt={alt}
      fill={fill}
      className={className}
      unoptimized={src.startsWith('data:')}
    />
  );
}

export default function Home() {
  return (
    <main>
      <VirtualTryOnApp
        apiEndpoint="/api/virtual-tryon"
        showDefaults={true}
        ImageComponent={NextImage}
        header={
          <div className="border-b border-gray-200 bg-gradient-to-r from-pink-50 to-white">
            <div className="container py-6">
              <div className="flex items-center justify-center gap-3">
                <span className="text-3xl">👘</span>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    AI 和服试穿
                  </h1>
                  <p className="text-sm text-gray-500">
                    独立开发版 · @kimono-one/virtual-tryon
                  </p>
                </div>
              </div>
            </div>
          </div>
        }
        onSuccess={(result) => {
          console.log('✅ Try-on success:', result);
        }}
        onError={(error) => {
          console.error('❌ Try-on error:', error);
        }}
      />
    </main>
  );
}
