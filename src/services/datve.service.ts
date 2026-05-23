import prisma from '../config/prisma';
import { holdSeats, cancelHeldSeats, releaseExpiredHolds } from '../repositories/ghesuatchieu.repository';
import { BadRequestError, NotFoundError } from '../utils/errors';

/**
 * Service to hold seats for 5 minutes
 */
export const giuGhe = async (
  maSuatChieu: string,
  seatIds: string[],
  maTaiKhoan: string,
) => {
  const now = new Date();
  
  // 1. Fetch showtime to validate existence and start time
  const sc = await prisma.suatChieu.findFirst({
    where: { MaSuatChieu: maSuatChieu, KhaDung: true },
  });

  if (!sc) {
    throw new NotFoundError(`Không tìm thấy suất chiếu với mã: ${maSuatChieu}`);
  }

  // Combine NgayChieu and GioChieu to get combined showtime start DateTime
  const showtimeStart = new Date(sc.NgayChieu);
  const gioChieu = new Date(sc.GioChieu);
  showtimeStart.setHours(gioChieu.getHours(), gioChieu.getMinutes(), gioChieu.getSeconds());

  if (showtimeStart <= now) {
    throw new BadRequestError('Suất chiếu đã bắt đầu, không thể giữ ghế.');
  }

  // Deduplicate seat IDs
  const uniqueSeatIds = Array.from(new Set(seatIds));
  const expireAt = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes from now

  // 2. Execute transaction
  return prisma.$transaction(async (tx) => {
    // Release expired holds for this showtime first
    await releaseExpiredHolds(now, maSuatChieu);

    // Call repository to execute conditional updates
    await holdSeats(tx, maSuatChieu, maTaiKhoan, uniqueSeatIds, expireAt, now);

    // Fetch the updated seats
    const updatedSeats = await tx.gheSuatChieu.findMany({
      where: {
        MaGheSuatChieu: { in: uniqueSeatIds },
        MaSuatChieu: maSuatChieu,
      },
      select: {
        MaGheSuatChieu: true,
        TrangThai: true,
        ThoiGianGiuGhe: true,
      },
    });

    return {
      MaSuatChieu: maSuatChieu,
      ThoiGianHetHan: expireAt,
      DanhSachGhe: updatedSeats.map((s) => ({
        MaGheSuatChieu: s.MaGheSuatChieu,
        TrangThai: s.TrangThai,
        ThoiGianGiuGhe: s.ThoiGianGiuGhe,
      })),
    };
  });
};

/**
 * Service to cancel held seats manually
 */
export const huyGiuGhe = async (
  maSuatChieu: string,
  seatIds: string[],
  maTaiKhoan: string,
) => {
  const now = new Date();

  // Deduplicate seat IDs
  const uniqueSeatIds = Array.from(new Set(seatIds));

  // Execute transaction
  return prisma.$transaction(async (tx) => {
    // Release expired holds for this showtime first
    await releaseExpiredHolds(now, maSuatChieu);

    // Call repository to release user's held seats
    await cancelHeldSeats(tx, maSuatChieu, maTaiKhoan, uniqueSeatIds);

    // Fetch the updated seats
    const updatedSeats = await tx.gheSuatChieu.findMany({
      where: {
        MaGheSuatChieu: { in: uniqueSeatIds },
        MaSuatChieu: maSuatChieu,
      },
      select: {
        MaGheSuatChieu: true,
        TrangThai: true,
      },
    });

    return {
      MaSuatChieu: maSuatChieu,
      DanhSachGhe: updatedSeats.map((s) => ({
        MaGheSuatChieu: s.MaGheSuatChieu,
        TrangThai: s.TrangThai,
      })),
    };
  });
};
