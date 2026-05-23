import { TaiKhoan, Role, Prisma } from '@prisma/client';
import prisma from '../config/prisma';

// ========================
// Types
// ========================
export type CreateTaiKhoanData = {
  TenDangNhap: string;
  MatKhau: string;
  HoTen: string;
  Email: string;
  SoDienThoai: string;
  GioiTinh?: boolean;
  NgaySinh?: Date;
  VaiTro: Role;
};

// ========================
// Repository
// ========================

/**
 * Find a TaiKhoan by MaTaiKhoan (primary key)
 */
export const findTaiKhoanById = async (
  maTaiKhoan: string,
): Promise<TaiKhoan | null> => {
  return prisma.taiKhoan.findUnique({
    where: { MaTaiKhoan: maTaiKhoan },
  });
};

/**
 * Find a TaiKhoan by TenDangNhap (username)
 */
export const findTaiKhoanByTenDangNhap = async (
  tenDangNhap: string,
): Promise<TaiKhoan | null> => {
  return prisma.taiKhoan.findUnique({
    where: { TenDangNhap: tenDangNhap },
  });
};

/**
 * Find a TaiKhoan by Email
 */
export const findTaiKhoanByEmail = async (
  email: string,
): Promise<TaiKhoan | null> => {
  return prisma.taiKhoan.findUnique({
    where: { Email: email },
  });
};

/**
 * Create a new TaiKhoan along with optional KhachHang profile
 */
export const createTaiKhoan = async (
  data: CreateTaiKhoanData,
): Promise<TaiKhoan> => {
  return prisma.taiKhoan.create({
    data: {
      ...data,
      // Auto-create KhachHang profile for CUSTOMER role
      ...(data.VaiTro === Role.CUSTOMER && {
        KhachHang: { create: { KhaDung: true } },
      }),
      // Auto-create NhanVien profile for STAFF role
      ...(data.VaiTro === Role.STAFF && {
        NhanVien: { create: { ChucVu: 'Nhân viên', KhaDung: true } },
      }),
    },
  });
};

/**
 * Update a TaiKhoan record
 */
export const updateTaiKhoan = async (
  maTaiKhoan: string,
  data: Prisma.TaiKhoanUpdateInput,
): Promise<TaiKhoan> => {
  return prisma.taiKhoan.update({
    where: { MaTaiKhoan: maTaiKhoan },
    data,
  });
};
