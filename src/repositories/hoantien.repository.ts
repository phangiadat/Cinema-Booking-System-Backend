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

/**
 * Retrieve paginated and filtered refund requests for ADMIN
 */
export const findRefundRequestsAdmin = async (
  skip: number,
  limit: number,
  trangThai?: any,
  keyword?: string,
) => {
  const where: any = { KhaDung: true };

  if (trangThai) {
    where.TrangThai = trangThai;
  }

  if (keyword) {
    const keywordTrimmed = keyword.trim();
    where.OR = [
      { MaHoanTien: { contains: keywordTrimmed } },
      { LyDo: { contains: keywordTrimmed } },
      {
        GiaoDich: {
          OR: [
            { MaGiaoDich: { contains: keywordTrimmed } },
            { MaGiaoDichNgoai: { contains: keywordTrimmed } },
            {
              PhieuDatVe: {
                OR: [
                  { MaPhieuDat: { contains: keywordTrimmed } },
                  {
                    KhachHang: {
                      TaiKhoan: {
                        OR: [
                          { HoTen: { contains: keywordTrimmed } },
                          { Email: { contains: keywordTrimmed } },
                          { SoDienThoai: { contains: keywordTrimmed } },
                        ],
                      },
                    },
                  },
                ],
              },
            },
          ],
        },
      },
    ];
  }

  return prisma.lichSuHoanTien.findMany({
    where,
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
              KhachHang: {
                include: {
                  TaiKhoan: {
                    select: {
                      MaTaiKhoan: true,
                      HoTen: true,
                      Email: true,
                      SoDienThoai: true,
                    },
                  },
                },
              },
              ChiTietDatVes: {
                include: {
                  GheSuatChieu: {
                    include: {
                      Ghe: true,
                      SuatChieu: {
                        include: {
                          Phim: true,
                          PhongChieu: true,
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
 * Count total refund requests matching filters for ADMIN
 */
export const countRefundRequestsAdmin = async (
  trangThai?: any,
  keyword?: string,
) => {
  const where: any = { KhaDung: true };

  if (trangThai) {
    where.TrangThai = trangThai;
  }

  if (keyword) {
    const keywordTrimmed = keyword.trim();
    where.OR = [
      { MaHoanTien: { contains: keywordTrimmed } },
      { LyDo: { contains: keywordTrimmed } },
      {
        GiaoDich: {
          OR: [
            { MaGiaoDich: { contains: keywordTrimmed } },
            { MaGiaoDichNgoai: { contains: keywordTrimmed } },
            {
              PhieuDatVe: {
                OR: [
                  { MaPhieuDat: { contains: keywordTrimmed } },
                  {
                    KhachHang: {
                      TaiKhoan: {
                        OR: [
                          { HoTen: { contains: keywordTrimmed } },
                          { Email: { contains: keywordTrimmed } },
                          { SoDienThoai: { contains: keywordTrimmed } },
                        ],
                      },
                    },
                  },
                ],
              },
            },
          ],
        },
      },
    ];
  }

  return prisma.lichSuHoanTien.count({
    where,
  });
};

/**
 * Find a specific refund request by ID with full nested include for ADMIN
 */
export const findRefundRequestByIdAdmin = async (maHoanTien: string) => {
  return prisma.lichSuHoanTien.findFirst({
    where: {
      MaHoanTien: maHoanTien,
      KhaDung: true,
    },
    include: {
      GiaoDich: {
        include: {
          PhieuDatVe: {
            include: {
              KhachHang: {
                include: {
                  TaiKhoan: {
                    select: {
                      MaTaiKhoan: true,
                      HoTen: true,
                      Email: true,
                      SoDienThoai: true,
                    },
                  },
                },
              },
              ChiTietDatVes: {
                include: {
                  GheSuatChieu: {
                    include: {
                      Ghe: true,
                      SuatChieu: {
                        include: {
                          Phim: true,
                          PhongChieu: true,
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
 * Approve a pending refund request in a transaction
 */
export const approveRefundRequest = async (
  maHoanTien: string,
  maGiaoDich: string,
) => {
  return prisma.$transaction(async (tx) => {
    // 1. Update LichSuHoanTien
    const refund = await tx.lichSuHoanTien.update({
      where: { MaHoanTien: maHoanTien },
      data: {
        TrangThai: 'DA_HOAN',
        NgayHoanTien: new Date(),
      },
    });

    // 2. Update GiaoDich status to DA_HOAN_TIEN
    await tx.giaoDich.update({
      where: { MaGiaoDich: maGiaoDich },
      data: {
        TrangThai: 'DA_HOAN_TIEN',
      },
    });

    // 3. Get PhieuDatVe and release its seats
    const transaction = await tx.giaoDich.findUnique({
      where: { MaGiaoDich: maGiaoDich },
      select: { MaPhieuDat: true },
    });

    if (transaction?.MaPhieuDat) {
      const bookingDetails = await tx.chiTietDatVe.findMany({
        where: { MaPhieuDat: transaction.MaPhieuDat },
        select: { MaGheSuatChieu: true },
      });
      const seatIds = bookingDetails.map((d: any) => d.MaGheSuatChieu);

      await tx.gheSuatChieu.updateMany({
        where: { MaGheSuatChieu: { in: seatIds } },
        data: {
          TrangThai: 'TRONG',
          ThoiGianGiuGhe: null,
          MaTaiKhoanGiu: null,
        },
      });
    }

    return refund;
  });
};

/**
 * Reject a pending refund request
 */
export const rejectRefundRequest = async (maHoanTien: string) => {
  return prisma.lichSuHoanTien.update({
    where: { MaHoanTien: maHoanTien },
    data: {
      TrangThai: 'TU_CHOI',
    },
  });
};

