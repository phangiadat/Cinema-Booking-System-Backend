import { Prisma, Role, TaiKhoan, NhanVien, SuatChieu } from '@prisma/client';
import prisma from '../config/prisma';
import { BadRequestError } from '../utils/errors';

export interface ShowtimeFilters {
  keyword?: string;
  ngayChieu?: Date;
  maPhim?: string;
  maPhong?: string;
}

/**
 * Find active NhanVien profile by TaiKhoan ID
 */
export const findStaffByAccountId = async (maTaiKhoan: string) => {
  return prisma.nhanVien.findFirst({
    where: {
      MaTaiKhoan: maTaiKhoan,
      KhaDung: true,
      TaiKhoan: {
        KhaDung: true,
        VaiTro: Role.STAFF,
      },
    },
    include: {
      TaiKhoan: true,
    },
  });
};

/**
 * Find all showtimes starting from today with filters (database part)
 */
export const findAvailableShowtimesForStaff = async (
  filters: ShowtimeFilters,
) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const where: any = {
    KhaDung: true,
    Phim: {
      KhaDung: true,
    },
    PhongChieu: {
      KhaDung: true,
    },
    NgayChieu: {
      gte: today,
    },
  };

  if (filters.maPhim) {
    where.MaPhim = filters.maPhim;
  }
  if (filters.maPhong) {
    where.MaPhong = filters.maPhong;
  }
  if (filters.ngayChieu) {
    where.NgayChieu = filters.ngayChieu;
  }
  if (filters.keyword) {
    where.Phim.TenPhim = {
      contains: filters.keyword,
    };
  }

  return prisma.suatChieu.findMany({
    where,
    orderBy: [
      { NgayChieu: 'asc' },
      { GioChieu: 'asc' },
    ],
    include: {
      Phim: true,
      PhongChieu: {
        include: {
          LoaiPhong: true,
        },
      },
      LoaiNgay: true,
      GheSuatChieus: {
        where: {
          KhaDung: true,
        },
        select: {
          TrangThai: true,
          ThoiGianGiuGhe: true,
        },
      },
    },
  });
};

/**
 * Find seat map for staff view
 */
export const findStaffSeatMap = async (maSuatChieu: string) => {
  return prisma.suatChieu.findFirst({
    where: {
      MaSuatChieu: maSuatChieu,
      KhaDung: true,
      PhongChieu: {
        KhaDung: true,
        LoaiPhong: {
          KhaDung: true,
        },
        SoDoGhe: {
          KhaDung: true,
        },
      },
    },
    include: {
      Phim: true,
      LoaiNgay: true,
      PhongChieu: {
        include: {
          LoaiPhong: true,
          SoDoGhe: true,
        },
      },
      GheSuatChieus: {
        where: {
          KhaDung: true,
          Ghe: {
            KhaDung: true,
            LoaiGhe: {
              KhaDung: true,
            },
          },
        },
        include: {
          Ghe: {
            include: {
              LoaiGhe: true,
            },
          },
        },
      },
    },
  });
};

/**
 * Release expired holds targetting a specific showtime (similar to ghesuatchieu repository)
 */
export const releaseExpiredHolds = async (now: Date, maSuatChieu: string) => {
  return prisma.gheSuatChieu.updateMany({
    where: {
      MaSuatChieu: maSuatChieu,
      TrangThai: 'DANG_GIU',
      ThoiGianGiuGhe: { lt: now },
    },
    data: {
      TrangThai: 'TRONG',
      ThoiGianGiuGhe: null,
      MaTaiKhoanGiu: null,
    },
  });
};
