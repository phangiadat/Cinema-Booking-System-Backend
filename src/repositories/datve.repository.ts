import prisma from '../config/prisma';
import { PhuongThucThanhToan } from '@prisma/client';
import { BadRequestError } from '../utils/errors';

/**
 * Find customer profile by user's account ID
 */
export const findCustomerByAccountId = async (maTaiKhoan: string) => {
  return prisma.khachHang.findUnique({
    where: { MaTaiKhoan: maTaiKhoan },
  });
};

/**
 * Retrieve GHE_SUATCHIEU details, including related seat/room types to compute the price
 */
export const findHeldSeatsForPayment = async (
  maSuatChieu: string,
  seatIds: string[],
  maTaiKhoan: string,
  now: Date,
) => {
  return prisma.gheSuatChieu.findMany({
    where: {
      MaSuatChieu: maSuatChieu,
      MaGheSuatChieu: { in: seatIds },
      TrangThai: 'DANG_GIU',
      MaTaiKhoanGiu: maTaiKhoan,
      ThoiGianGiuGhe: { gte: now },
      KhaDung: true,
    },
    include: {
      Ghe: {
        include: {
          LoaiGhe: true,
        },
      },
      SuatChieu: {
        include: {
          PhongChieu: {
            include: {
              LoaiPhong: true,
            },
          },
          LoaiNgay: true,
        },
      },
    },
  });
};

/**
 * Transaction to update seats to DA_DAT, create PhieuDatVe, ChiTietDatVe, and GiaoDich
 */
export const createPaidBookingTransaction = async (
  maKhachHang: string,
  maSuatChieu: string,
  seatIds: string[],
  phuongThuc: PhuongThucThanhToan,
  maThamChieuDoiTac: string,
  tongTien: number,
  seatPrices: { maGheSuatChieu: string; price: number }[],
) => {
  return prisma.$transaction(async (tx) => {
    // 1. Update GheSuatChieu to DA_DAT and clear hold info
    const updateResult = await tx.gheSuatChieu.updateMany({
      where: {
        MaSuatChieu: maSuatChieu,
        MaGheSuatChieu: { in: seatIds },
        TrangThai: 'DANG_GIU',
      },
      data: {
        TrangThai: 'DA_DAT',
        ThoiGianGiuGhe: null,
        MaTaiKhoanGiu: null,
      },
    });

    if (updateResult.count !== seatIds.length) {
      throw new BadRequestError('Một số ghế đã hết hạn giữ hoặc trạng thái không hợp lệ.');
    }

    // 2. Create PhieuDatVe
    const phieuDatVe = await tx.phieuDatVe.create({
      data: {
        MaKhachHang: maKhachHang,
        MaNhanVien: null,
        TongTien: tongTien,
        TrangThai: 'DA_THANH_TOAN',
        KhaDung: true,
      },
    });

    // 3. Create ChiTietDatVe for each seat
    for (const sp of seatPrices) {
      await tx.chiTietDatVe.create({
        data: {
          MaPhieuDat: phieuDatVe.MaPhieuDat,
          MaGheSuatChieu: sp.maGheSuatChieu,
          GiaVe: sp.price,
          KhaDung: true,
        },
      });
    }

    // 4. Create GiaoDich
    const giaoDich = await tx.giaoDich.create({
      data: {
        MaPhieuDat: phieuDatVe.MaPhieuDat,
        PhuongThuc: phuongThuc,
        SoTien: tongTien,
        TrangThai: 'THANH_CONG',
        MaGiaoDichNgoai: maThamChieuDoiTac,
        NgayGiaoDich: new Date(),
        KhaDung: true,
      },
    });

    return {
      phieuDatVe,
      giaoDich,
    };
  });
};

/**
 * Release held seats inside a transaction context
 */
export const releaseHeldSeats = async (
  tx: any,
  maSuatChieu: string,
  seatIds: string[],
  maTaiKhoan: string,
) => {
  return tx.gheSuatChieu.updateMany({
    where: {
      MaSuatChieu: maSuatChieu,
      MaGheSuatChieu: { in: seatIds },
      TrangThai: 'DANG_GIU',
      MaTaiKhoanGiu: maTaiKhoan,
    },
    data: {
      TrangThai: 'TRONG',
      ThoiGianGiuGhe: null,
      MaTaiKhoanGiu: null,
    },
  });
};

/**
 * Find booking by ID for a specific customer
 */
export const findBookingForCustomer = async (maPhieuDat: string, maKhachHang: string) => {
  return prisma.phieuDatVe.findFirst({
    where: {
      MaPhieuDat: maPhieuDat,
      MaKhachHang: maKhachHang,
      KhaDung: true,
    },
    include: {
      ChiTietDatVes: {
        include: {
          GheSuatChieu: {
            include: {
              SuatChieu: true,
            },
          },
        },
      },
    },
  });
};

/**
 * Cancel unpaid booking and release seats
 */
export const cancelBooking = async (maPhieuDat: string, seatIds: string[]) => {
  return prisma.$transaction(async (tx) => {
    // 1. Update booking status
    await tx.phieuDatVe.update({
      where: { MaPhieuDat: maPhieuDat },
      data: { TrangThai: 'DA_HUY' },
    });

    // 2. Release seats
    await tx.gheSuatChieu.updateMany({
      where: {
        MaGheSuatChieu: { in: seatIds },
      },
      data: {
        TrangThai: 'TRONG',
        ThoiGianGiuGhe: null,
        MaTaiKhoanGiu: null,
      },
    });
  });
};

/**
 * Create a refund request
 */
export const createRefundRequest = async (
  tx: any,
  maGiaoDich: string,
  soTienHoan: number,
  lyDo: string,
) => {
  return tx.lichSuHoanTien.create({
    data: {
      MaGiaoDich: maGiaoDich,
      SoTienHoan: soTienHoan,
      LyDo: lyDo,
      TrangThai: 'CHO_XU_LY',
      NgayHoanTien: null,
      KhaDung: true,
    },
  });
};

/**
 * Find pending refund request by booking ID
 */
export const findPendingRefundRequest = async (maPhieuDat: string) => {
  return prisma.lichSuHoanTien.findFirst({
    where: {
      GiaoDich: {
        MaPhieuDat: maPhieuDat,
      },
      TrangThai: 'CHO_XU_LY',
      KhaDung: true,
    },
  });
};

/**
 * Find successful transaction by booking ID
 */
export const findSuccessfulTransactionByBooking = async (maPhieuDat: string) => {
  return prisma.giaoDich.findFirst({
    where: {
      MaPhieuDat: maPhieuDat,
      TrangThai: 'THANH_CONG',
      KhaDung: true,
    },
  });
};
