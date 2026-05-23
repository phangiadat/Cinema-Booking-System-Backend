import { Phim } from '@prisma/client';
import {
  findPhimById,
  findAllPhim,
  createPhim,
  updatePhim,
  softDeletePhim,
  hardDeletePhim,
  PhimListResult,
} from '../repositories/phim.repository';
import {
  CreatePhimInput,
  UpdatePhimInput,
  PhimQueryInput,
} from '../validators/phim.validator';
import { NotFoundError, BadRequestError } from '../utils/errors';

// ========================
// Helper: Assert phim exists
// ========================
const assertPhimExists = async (maPhim: string): Promise<Phim> => {
  const phim = await findPhimById(maPhim);
  if (!phim) {
    throw new NotFoundError(`Không tìm thấy phim với mã: ${maPhim}`);
  }
  return phim;
};

// ========================
// Service: Get list of movies
// ========================
export const getDanhSachPhim = async (
  query: PhimQueryInput,
): Promise<PhimListResult> => {
  return findAllPhim(query);
};

// ========================
// Service: Get single movie by ID
// ========================
export const getChiTietPhim = async (maPhim: string): Promise<Phim> => {
  return assertPhimExists(maPhim);
};

// ========================
// Service: Create a new movie
// ========================
export const taoPhim = async (input: CreatePhimInput): Promise<Phim> => {
  // Business rule: NgayKetThuc must be after NgayKhoiChieu if provided
  if (input.NgayKetThuc && input.NgayKetThuc <= input.NgayKhoiChieu) {
    throw new BadRequestError('Ngày kết thúc phải sau ngày khởi chiếu');
  }

  return createPhim({
    TenPhim: input.TenPhim,
    ThoiLuong: input.ThoiLuong,
    TheLoai: input.TheLoai,
    NgayKhoiChieu: input.NgayKhoiChieu,
    NgayKetThuc: input.NgayKetThuc ?? null,
    DaoDien: input.DaoDien ?? null,
    DienVien: input.DienVien ?? null,
    GioiHanTuoi: input.GioiHanTuoi,
    NoiDung: input.NoiDung ?? null,
    Trailer: input.Trailer,
    HinhAnh: input.HinhAnh ?? null,
  });
};

// ========================
// Service: Update a movie
// ========================
export const capNhatPhim = async (
  maPhim: string,
  input: UpdatePhimInput,
): Promise<Phim> => {
  await assertPhimExists(maPhim);

  // Business rule: NgayKetThuc must be after NgayKhoiChieu if both provided
  if (input.NgayKetThuc && input.NgayKhoiChieu) {
    if (input.NgayKetThuc <= input.NgayKhoiChieu) {
      throw new BadRequestError('Ngày kết thúc phải sau ngày khởi chiếu');
    }
  }

  return updatePhim(maPhim, {
    ...(input.TenPhim !== undefined && { TenPhim: input.TenPhim }),
    ...(input.ThoiLuong !== undefined && { ThoiLuong: input.ThoiLuong }),
    ...(input.TheLoai !== undefined && { TheLoai: input.TheLoai }),
    ...(input.NgayKhoiChieu !== undefined && { NgayKhoiChieu: input.NgayKhoiChieu }),
    ...(input.NgayKetThuc !== undefined && { NgayKetThuc: input.NgayKetThuc }),
    ...(input.DaoDien !== undefined && { DaoDien: input.DaoDien }),
    ...(input.DienVien !== undefined && { DienVien: input.DienVien }),
    ...(input.GioiHanTuoi !== undefined && { GioiHanTuoi: input.GioiHanTuoi }),
    ...(input.NoiDung !== undefined && { NoiDung: input.NoiDung }),
    ...(input.Trailer !== undefined && { Trailer: input.Trailer }),
    ...(input.HinhAnh !== undefined && { HinhAnh: input.HinhAnh }),
  });
};

// ========================
// Service: Soft delete a movie (KhaDung = false)
// ========================
export const anPhim = async (maPhim: string): Promise<Phim> => {
  await assertPhimExists(maPhim);
  return softDeletePhim(maPhim);
};

// ========================
// Service: Hard delete a movie (permanent)
// ========================
export const xoaPhim = async (maPhim: string): Promise<void> => {
  await assertPhimExists(maPhim);
  await hardDeletePhim(maPhim);
};
