import { Role } from '@prisma/client';
import { findCustomerProfileByAccountId } from '../repositories/taikhoan.repository';
import { UnauthorizedError, NotFoundError } from '../utils/errors';

export interface CustomerProfileResponse {
  MaTaiKhoan: string;
  MaKhachHang?: string;
  TenDangNhap: string;
  HoTen: string;
  Email: string;
  SoDienThoai: string;
  GioiTinh: boolean | null;
  NgaySinh: Date | null;
  VaiTro: Role;
  KhaDung: boolean;
  NgayTao: Date;
  NgayCapNhat: Date | null;
}

/**
 * Get profile of current logged-in customer
 */
export const getCurrentCustomerProfile = async (
  maTaiKhoan: string,
): Promise<CustomerProfileResponse> => {
  const taiKhoan = await findCustomerProfileByAccountId(maTaiKhoan);

  if (!taiKhoan) {
    throw new NotFoundError('Không tìm thấy tài khoản');
  }

  // Active account check
  if (!taiKhoan.KhaDung || (taiKhoan.KhachHang && !taiKhoan.KhachHang.KhaDung)) {
    throw new UnauthorizedError('Tài khoản đã bị vô hiệu hóa');
  }

  return {
    MaTaiKhoan: taiKhoan.MaTaiKhoan,
    MaKhachHang: taiKhoan.KhachHang?.MaKhachHang,
    TenDangNhap: taiKhoan.TenDangNhap,
    HoTen: taiKhoan.HoTen,
    Email: taiKhoan.Email,
    SoDienThoai: taiKhoan.SoDienThoai,
    GioiTinh: taiKhoan.GioiTinh,
    NgaySinh: taiKhoan.NgaySinh,
    VaiTro: taiKhoan.VaiTro,
    KhaDung: taiKhoan.KhaDung,
    NgayTao: taiKhoan.NgayTao,
    NgayCapNhat: taiKhoan.NgayCapNhat,
  };
};
