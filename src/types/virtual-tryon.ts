export interface KimonoItem {
  id: string;
  name: string;
  imageUrl: string;
  planId?: string;
  source: 'plan' | 'upload';
}

export interface TryOnResult {
  userPhoto: string;
  kimonoImage: string;
  resultImage: string;
  timestamp: Date;
}
