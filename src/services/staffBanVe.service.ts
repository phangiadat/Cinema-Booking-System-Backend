import { Role, GioiHanTuoi } from '@prisma/client';
import {
  findStaffByAccountId,
  findAvailableShowtimesForStaff,
  ShowtimeFilters,
} from '../repositories/staffBanVe.repository';
import { UnauthorizedError, NotFoundError } from '../utils/errors';

export interface StaffShowtimeResponse {
  MaSuatChieu: string;
  NgayChieu: Date;
  GioChieu: Date;
  GiaVeGoc: number;
  Phim: {
    MaPhim: string;
    TenPhim: string;
    ThoiLuong: number;
    GioiHanTuoi: GioiHanTuoi;
  };
  PhongChieu: {
    MaPhong: string;
    TenPhong: string;
  };
  LoaiPhong: {
    MaLoaiPhong: string;
    TenLoaiPhong: string;
    PhuThu: number;
  };
  LoaiNgay: {
    MaLoaiNgay: string;
    TenLoaiNgay: string;
    PhuThu: number;
  };
  soGheTrong: number;
  soGheDaDat: number;
  soGheDangGiu: number;
}

export interface PaginatedShowtimes {
  showtimes: StaffShowtimeResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Get showtimes for counter ticket selling (Staff view)
 */
export const getShowtimesForStaff = async (
  maTaiKhoan: string,
  queryFilters: ShowtimeFilters & { page: number; limit: number },
): Promise<PaginatedShowtimes> => {
  // 1. Verify active staff account
  const staff = await findStaffByAccountId(maTaiKhoan);
  if (!staff) {
    throw new UnauthorizedError('Tài khoản đã bị vô hiệu hóa hoặc không có quyền nhân viên');
  }

  // 2. Fetch showtimes from today onwards
  const showtimes = await findAvailableShowtimesForStaff({
    keyword: queryFilters.keyword,
    ngayChieu: queryFilters.ngayChieu,
    maPhim: queryFilters.maPhim,
    maPhong: queryFilters.maPhong,
  });

  const now = new Date();

  // 3. Filter out started showtimes and map counts in-memory
  const mappedShowtimes = showtimes
    .map((sc) => {
      // Combine date and time
      const showtimeStart = new Date(sc.NgayChieu);
      const gioChieu = new Date(sc.GioChieu);
      showtimeStart.setHours(gioChieu.getHours(), gioChieu.getMinutes(), gioChieu.getSeconds());

      // Return null if showtime has already started
      if (showtimeStart <= now) {
        return null;
      }

      // Calculate seat counts
      let soGheTrong = 0;
      let soGheDaDat = 0;
      let soGheDangGiu = 0;

      for (const gsc of sc.GheSuatChieus) {
        if (gsc.TrangThai === 'DA_DAT') {
          soGheDaDat++;
        } else if (gsc.TrangThai === 'DANG_GIU') {
          const isExpired = gsc.ThoiGianGiuGhe && new Date(gsc.ThoiGianGiuGhe) < now;
          if (isExpired) {
            soGheTrong++;
          } else {
            soGheDangGiu++;
          }
        } else {
          soGheTrong++;
        }
      }

      return {
        MaSuatChieu: sc.MaSuatChieu,
        NgayChieu: sc.NgayChieu,
        GioChieu: sc.GioChieu,
        GiaVeGoc: Number(sc.GiaVeGoc),
        Phim: {
          MaPhim: sc.Phim.MaPhim,
          TenPhim: sc.Phim.TenPhim,
          ThoiLuong: sc.Phim.ThoiLuong,
          GioiHanTuoi: sc.Phim.GioiHanTuoi,
        },
        PhongChieu: {
          MaPhong: sc.PhongChieu.MaPhong,
          TenPhong: sc.PhongChieu.TenPhong,
        },
        LoaiPhong: {
          MaLoaiPhong: sc.PhongChieu.LoaiPhong.MaLoaiPhong,
          TenLoaiPhong: sc.PhongChieu.LoaiPhong.TenLoaiPhong,
          PhuThu: Number(sc.PhongChieu.LoaiPhong.PhuThu),
        },
        LoaiNgay: {
          MaLoaiNgay: sc.LoaiNgay.MaLoaiNgay,
          TenLoaiNgay: sc.LoaiNgay.TenLoaiNgay,
          PhuThu: Number(sc.LoaiNgay.PhuThu),
        },
        soGheTrong,
        soGheDaDat,
        soGheDangGiu,
      };
    })
    .filter((sc): sc is StaffShowtimeResponse => sc !== null);

  // 4. Apply pagination in memory
  const total = mappedShowtimes.length;
  const page = queryFilters.page;
  const limit = queryFilters.limit;
  const totalPages = Math.ceil(total / limit) || 1;
  const skip = (page - 1) * limit;

  const paginatedShowtimes = mappedShowtimes.slice(skip, skip + limit);

  return {
    showtimes: paginatedShowtimes,
    total,
    page,
    limit,
    totalPages,
  };
};
