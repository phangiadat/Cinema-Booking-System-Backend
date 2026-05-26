import prisma from '../config/prisma';

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

/**
 * Check if a pending refund request already exists for a booking
 */
export const findPendingRefundByBooking = async (maPhieuDat: string) => {
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
 * Create a refund request and update booking status to DA_HUY in a Prisma transaction
 */
export const createRefundRequest = async (
  maPhieuDat: string,
  maGiaoDich: string,
  soTienHoan: number,
  lyDo: string,
) => {
  return prisma.$transaction(async (tx) => {
    // 1. Update PhieuDatVe status to DA_HUY
    await tx.phieuDatVe.update({
      where: { MaPhieuDat: maPhieuDat },
      data: { TrangThai: 'DA_HUY' },
    });

    // 2. Create LichSuHoanTien
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
  });
};

/**
 * Retrieve paginated refund requests for a specific customer
 */
export const findRefundRequestsByCustomer = async (
  maKhachHang: string,
  skip: number,
  limit: number,
) => {
  return prisma.lichSuHoanTien.findMany({
    where: {
      GiaoDich: {
        PhieuDatVe: {
          MaKhachHang: maKhachHang,
          KhaDung: true,
        },
      },
      KhaDung: true,
    },
    skip,
    take: limit,
    orderBy: {
      NgayTao: 'desc',
    },
    include: {
      GiaoDich: {
        include: {
          PhieuDatVe: {
            include: {
              ChiTietDatVes: {
                include: {
                  GheSuatChieu: {
                    include: {
                      SuatChieu: {
                        include: {
                          Phim: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });
};

/**
 * Count total refund requests for a customer
 */
export const countRefundRequestsByCustomer = async (maKhachHang: string) => {
  return prisma.lichSuHoanTien.count({
    where: {
      GiaoDich: {
        PhieuDatVe: {
          MaKhachHang: maKhachHang,
          KhaDung: true,
        },
      },
      KhaDung: true,
    },
  });
};
