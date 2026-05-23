import { Phim, Prisma } from '@prisma/client';
import prisma from '../config/prisma';
import { PhimQueryInput } from '../validators/phim.validator';

// ========================
// Types
// ========================
export interface PhimListResult {
  items: Phim[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ========================
// Repository
// ========================

/**
 * Find a Phim by MaPhim (primary key)
 */
export const findPhimById = async (maPhim: string): Promise<Phim | null> => {
  return prisma.phim.findUnique({
    where: { MaPhim: maPhim },
  });
};

/**
 * Get a list of Phim with filtering, search, and pagination
 */
export const findAllPhim = async (
  query: PhimQueryInput,
): Promise<PhimListResult> => {
  const { keyword, theLoai, gioiHanTuoi, page, limit } = query;

  const where: Prisma.PhimWhereInput = {
    KhaDung: true, // Default: only active movies
    ...(keyword && {
      OR: [
        { TenPhim: { contains: keyword } },
        { DaoDien: { contains: keyword } },
        { DienVien: { contains: keyword } },
      ],
    }),
    ...(theLoai && {
      TheLoai: { contains: theLoai },
    }),
    ...(gioiHanTuoi && {
      GioiHanTuoi: gioiHanTuoi,
    }),
  };

  const skip = (page - 1) * limit;

  const [items, total] = await prisma.$transaction([
    prisma.phim.findMany({
      where,
      skip,
      take: limit,
      orderBy: { NgayTao: 'desc' },
    }),
    prisma.phim.count({ where }),
  ]);

  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

/**
 * Create a new Phim
 */
export const createPhim = async (
  data: Prisma.PhimCreateInput,
): Promise<Phim> => {
  return prisma.phim.create({ data });
};

/**
 * Update a Phim
 */
export const updatePhim = async (
  maPhim: string,
  data: Prisma.PhimUpdateInput,
): Promise<Phim> => {
  return prisma.phim.update({
    where: { MaPhim: maPhim },
    data,
  });
};

/**
 * Soft delete: set KhaDung = false
 */
export const softDeletePhim = async (maPhim: string): Promise<Phim> => {
  return prisma.phim.update({
    where: { MaPhim: maPhim },
    data: { KhaDung: false },
  });
};

/**
 * Hard delete: permanently remove from database
 */
export const hardDeletePhim = async (maPhim: string): Promise<Phim> => {
  return prisma.phim.delete({
    where: { MaPhim: maPhim },
  });
};
