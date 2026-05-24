import prisma from '../config/prisma';

/**
 * Get showtime and all active related seat map models
 */
export const findShowtimeForSeatMap = async (maSuatChieu: string) => {
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
