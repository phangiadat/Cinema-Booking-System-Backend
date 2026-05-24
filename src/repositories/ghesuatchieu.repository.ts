import prisma from '../config/prisma';
import { BadRequestError } from '../utils/errors';

/**
 * Release expired holds (can optionally target a specific showtime)
 */
export const releaseExpiredHolds = async (now: Date, maSuatChieu?: string): Promise<{ count: number }> => {
  return prisma.gheSuatChieu.updateMany({
    where: {
      TrangThai: 'DANG_GIU',
      ThoiGianGiuGhe: { lt: now },
      ...(maSuatChieu && { MaSuatChieu: maSuatChieu }),
    },
    data: {
      TrangThai: 'TRONG',
      ThoiGianGiuGhe: null,
      MaTaiKhoanGiu: null,
    },
  });
};

/**
 * Hold seats transactionally with strict race condition prevention
 */
export const holdSeats = async (
  tx: any,
  maSuatChieu: string,
  maTaiKhoan: string,
  seatIds: string[],
  expireAt: Date,
  now: Date,
): Promise<void> => {
  const result = await tx.gheSuatChieu.updateMany({
    where: {
      MaGheSuatChieu: { in: seatIds },
      MaSuatChieu: maSuatChieu,
      KhaDung: true,
      OR: [
        { TrangThai: 'TRONG' },
        { TrangThai: 'DANG_GIU', ThoiGianGiuGhe: { lt: now } },
        { TrangThai: 'DANG_GIU', MaTaiKhoanGiu: maTaiKhoan },
      ],
    },
    data: {
      TrangThai: 'DANG_GIU',
      ThoiGianGiuGhe: expireAt,
      MaTaiKhoanGiu: maTaiKhoan,
    },
  });

  if (result.count !== seatIds.length) {
    throw new BadRequestError('Một hoặc nhiều ghế đã được đặt hoặc đang được giữ bởi người khác.');
  }
};

/**
 * Cancel held seats transactionally (must be owned by the caller)
 */
export const cancelHeldSeats = async (
  tx: any,
  maSuatChieu: string,
  maTaiKhoan: string,
  seatIds: string[],
): Promise<void> => {
  const result = await tx.gheSuatChieu.updateMany({
    where: {
      MaGheSuatChieu: { in: seatIds },
      MaSuatChieu: maSuatChieu,
      TrangThai: 'DANG_GIU',
      MaTaiKhoanGiu: maTaiKhoan,
    },
    data: {
      TrangThai: 'TRONG',
      ThoiGianGiuGhe: null,
      MaTaiKhoanGiu: null,
    },
  });

  if (result.count !== seatIds.length) {
    throw new BadRequestError('Một hoặc nhiều ghế không thuộc trạng thái đang giữ của bạn để hủy.');
  }
};
