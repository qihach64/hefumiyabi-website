import { Prisma } from "@prisma/client";

// ============ Kimono Types ============
export type KimonoWithImages = Prisma.KimonoGetPayload<{
  include: { images: true };
}>;

export type KimonoWithStores = Prisma.KimonoGetPayload<{
  include: { stores: { include: { store: true } } };
}>;

export type KimonoWithAll = Prisma.KimonoGetPayload<{
  include: {
    images: true;
    stores: { include: { store: true } };
  };
}>;

// ============ Booking Types ============
export type BookingWithRelations = Prisma.BookingGetPayload<{
  include: {
    user: true;
    store: true;
    plan: true;
    kimonos: { include: { kimono: { include: { images: true } } } };
  };
}>;

// ============ User Types ============
export type UserWithPreference = Prisma.UserGetPayload<{
  include: { preference: true };
}>;

// ============ Store Types ============
export type StoreWithKimonos = Prisma.StoreGetPayload<{
  include: { kimonos: { include: { kimono: { include: { images: true } } } } };
}>;

// ============ API Response Types ============
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ============ Theme Types ============
export interface Theme {
  id: string;
  slug: string;
  name: string;
  icon: string | null;
  color: string | null;
  coverImage?: string | null;
  description?: string | null;
}

// ============ Filter Types ============
export interface KimonoFilters {
  category?: string;
  style?: string;
  color?: string[];
  pattern?: string[];
  season?: string[];
  minPrice?: number;
  maxPrice?: number;
  storeId?: string;
  isAvailable?: boolean;
}

export interface BookingFilters {
  status?: string;
  paymentStatus?: string;
  storeId?: string;
  userId?: string;
  startDate?: Date;
  endDate?: Date;
}
