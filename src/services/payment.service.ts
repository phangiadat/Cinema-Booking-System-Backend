import prisma from '../config/prisma';
import { payOS } from '../utils/payos.util';
import { env } from '../config/env';
import { BadRequestError, NotFoundError } from '../utils/errors';
import { findCustomerByAccountId } from '../repositories/datve.repository';

/**
 * Creates a PayOS payment link for a pending booking.
 */
export const createPayosLink = async (maPhieuDat: string, maTaiKhoan: string) => {
  const customer = await findCustomerByAccountId(maTaiKhoan);
  if (!customer) {
    throw new BadRequestError('Tài khoản không phải là khách hàng hợp lệ.');
  }

  // 1. Find the pending booking
  const booking = await prisma.phieuDatVe.findFirst({
    where: {
      MaPhieuDat: maPhieuDat,
      MaKhachHang: customer.MaKhachHang,
      KhaDung: true,
    },
    include: {
      ChiTietDatVes: {
        include: {
          GheSuatChieu: true,
        },
      },
    },
  });

  if (!booking) {
    throw new NotFoundError(`Không tìm thấy phiếu đặt vé với mã: ${maPhieuDat}`);
  }

  if (booking.TrangThai !== 'CHO_THANH_TOAN') {
    throw new BadRequestError(`Phiếu đặt vé không ở trạng thái chờ thanh toán (Trạng thái hiện tại: ${booking.TrangThai})`);
  }

  // 2. Verify seats are still held by the user and not expired
  const now = new Date();
  const isHeld = booking.ChiTietDatVes.every((ct) => {
    const seat = ct.GheSuatChieu;
    return (
      seat.TrangThai === 'DANG_GIU' &&
      seat.MaTaiKhoanGiu === maTaiKhoan &&
      seat.ThoiGianGiuGhe &&
      seat.ThoiGianGiuGhe >= now
    );
  });

  if (!isHeld) {
    throw new BadRequestError('Một số ghế trong phiếu đặt vé của bạn đã hết hạn giữ hoặc không thuộc sở hữu của bạn.');
  }

  // 3. Find the pending transaction
  const transaction = await prisma.giaoDich.findFirst({
    where: {
      MaPhieuDat: maPhieuDat,
      PhuongThuc: 'PAYOS',
      TrangThai: 'CHO_XU_LY',
      KhaDung: true,
    },
  });

  if (!transaction) {
    throw new NotFoundError('Không tìm thấy giao dịch chờ xử lý với phương thức PayOS cho phiếu đặt vé này.');
  }

  const amount = Number(booking.TongTien);

  // 4. Generate unique integer orderCode and verify uniqueness in DB
  let orderCode = 0;
  let isUnique = false;
  let attempts = 0;
  while (!isUnique && attempts < 10) {
    orderCode = Number(Date.now().toString().substring(3) + Math.floor(Math.random() * 1000));
    const existingTx = await prisma.giaoDich.findFirst({
      where: { MaGiaoDichNgoai: orderCode.toString() },
    });
    if (!existingTx) {
      isUnique = true;
    }
    attempts++;
  }

  if (!isUnique) {
    throw new BadRequestError('Không thể tạo mã đơn hàng duy nhất lúc này. Vui lòng thử lại.');
  }

  // 5. Build items for PayOS
  const items = booking.ChiTietDatVes.map((ct) => ({
    name: `Ghe ${ct.MaGheSuatChieu.substring(0, 8)}`.toUpperCase(),
    quantity: 1,
    price: Number(ct.GiaVe),
  }));

  // 6. Call PayOS API to generate link
  const payosResponse = await payOS.paymentRequests.create({
    orderCode,
    amount,
    description: `DAT VE PHIM ${maPhieuDat.substring(0, 8)}`.toUpperCase(),
    cancelUrl: env.PAYOS_CANCEL_URL,
    returnUrl: env.PAYOS_RETURN_URL,
    items,
  });

  // 7. Update transaction record with the orderCode
  await prisma.giaoDich.update({
    where: { MaGiaoDich: transaction.MaGiaoDich },
    data: {
      MaGiaoDichNgoai: orderCode.toString(),
    },
  });

  return {
    checkoutUrl: payosResponse.checkoutUrl,
    qrCode: payosResponse.qrCode || null,
    orderCode: payosResponse.orderCode,
    maGiaoDich: transaction.MaGiaoDich,
    maPhieuDat: maPhieuDat,
    amount: payosResponse.amount,
    expiresAt: payosResponse.expiredAt || null,
  };
};

/**
 * Handles Webhook callbacks from PayOS.
 */
export const handleWebhook = async (webhookBody: any) => {
  if (!webhookBody || !webhookBody.signature || !webhookBody.data) {
    throw new BadRequestError('Webhook payload không hợp lệ.');
  }

  // 1. Verify webhook signature
  let verifiedData;
  try {
    verifiedData = await payOS.webhooks.verify(webhookBody);
  } catch (error) {
    throw new BadRequestError('Chữ ký webhook không hợp lệ.');
  }

  const orderCode = verifiedData.orderCode;

  // Handle test confirmation webhook
  if (verifiedData.description === 'confirm-webhook' || orderCode === 123) {
    return { success: true, message: 'Webhook confirm event success' };
  }

  // 2. Find transaction in our DB
  const transaction = await prisma.giaoDich.findFirst({
    where: {
      MaGiaoDichNgoai: orderCode.toString(),
      KhaDung: true,
    },
    include: {
      PhieuDatVe: {
        include: {
          ChiTietDatVes: true,
        },
      },
    },
  });

  if (!transaction) {
    console.warn(`[PayOS Webhook] Không tìm thấy giao dịch cho orderCode: ${orderCode}`);
    return { success: true, message: 'Transaction not found, acknowledged' };
  }

  // 3. Webhook idempotency check
  if (transaction.TrangThai !== 'CHO_XU_LY') {
    return { success: true, message: 'Transaction already processed' };
  }

  const isPaid = verifiedData.code === '00';

  if (isPaid) {
    await prisma.$transaction(async (tx) => {
      // Re-verify inside tx
      const currentTx = await tx.giaoDich.findUnique({
        where: { MaGiaoDich: transaction.MaGiaoDich },
      });
      if (!currentTx || currentTx.TrangThai !== 'CHO_XU_LY') return;

      // Update transaction status
      await tx.giaoDich.update({
        where: { MaGiaoDich: transaction.MaGiaoDich },
        data: {
          TrangThai: 'THANH_CONG',
          NgayGiaoDich: new Date(),
        },
      });

      // Update booking status
      await tx.phieuDatVe.update({
        where: { MaPhieuDat: transaction.MaPhieuDat },
        data: { TrangThai: 'DA_THANH_TOAN' },
      });

      // Convert seats to DA_DAT
      const seatIds = transaction.PhieuDatVe.ChiTietDatVes.map((ct) => ct.MaGheSuatChieu);
      await tx.gheSuatChieu.updateMany({
        where: { MaGheSuatChieu: { in: seatIds } },
        data: {
          TrangThai: 'DA_DAT',
          ThoiGianGiuGhe: null,
          MaTaiKhoanGiu: null,
        },
      });
    });
  } else {
    await prisma.$transaction(async (tx) => {
      // Re-verify inside tx
      const currentTx = await tx.giaoDich.findUnique({
        where: { MaGiaoDich: transaction.MaGiaoDich },
      });
      if (!currentTx || currentTx.TrangThai !== 'CHO_XU_LY') return;

      // Update transaction status
      await tx.giaoDich.update({
        where: { MaGiaoDich: transaction.MaGiaoDich },
        data: { TrangThai: 'THAT_BAI' },
      });

      // Update booking status
      await tx.phieuDatVe.update({
        where: { MaPhieuDat: transaction.MaPhieuDat },
        data: { TrangThai: 'DA_HUY' },
      });

      // Release seats back to TRONG only if they are still held (not DA_DAT)
      const seatIds = transaction.PhieuDatVe.ChiTietDatVes.map((ct) => ct.MaGheSuatChieu);
      await tx.gheSuatChieu.updateMany({
        where: {
          MaGheSuatChieu: { in: seatIds },
          TrangThai: 'DANG_GIU',
        },
        data: {
          TrangThai: 'TRONG',
          ThoiGianGiuGhe: null,
          MaTaiKhoanGiu: null,
        },
      });
    });
  }

  return { success: true, message: 'Processed successfully' };
};

/**
 * Checks transaction status and polls PayOS API for synchronization if pending.
 */
export const checkPaymentStatus = async (maGiaoDich: string, maTaiKhoan: string) => {
  const customer = await findCustomerByAccountId(maTaiKhoan);
  if (!customer) {
    throw new BadRequestError('Tài khoản không phải là khách hàng hợp lệ.');
  }

  // Find transaction
  const transaction = await prisma.giaoDich.findFirst({
    where: {
      OR: [
        { MaGiaoDich: maGiaoDich },
        { MaGiaoDichNgoai: maGiaoDich },
        { MaPhieuDat: maGiaoDich },
      ],
      KhaDung: true,
    },
    include: {
      PhieuDatVe: {
        include: {
          KhachHang: true,
          ChiTietDatVes: true,
        },
      },
    },
  });

  if (!transaction) {
    throw new NotFoundError('Không tìm thấy giao dịch.');
  }

  // Verify only customer owner can query
  if (transaction.PhieuDatVe.KhachHang?.MaTaiKhoan !== maTaiKhoan) {
    throw new BadRequestError('Bạn không có quyền xem thông tin giao dịch này.');
  }

  // Poll PayOS API for updates if status is CHO_XU_LY
  if (transaction.TrangThai === 'CHO_XU_LY' && transaction.MaGiaoDichNgoai) {
    try {
      const orderCode = Number(transaction.MaGiaoDichNgoai);
      const payosLink = await payOS.paymentRequests.get(orderCode);

      if (payosLink.status === 'PAID') {
        await prisma.$transaction(async (tx) => {
          const currentTx = await tx.giaoDich.findUnique({
            where: { MaGiaoDich: transaction.MaGiaoDich },
          });
          if (!currentTx || currentTx.TrangThai !== 'CHO_XU_LY') return;

          await tx.giaoDich.update({
            where: { MaGiaoDich: transaction.MaGiaoDich },
            data: {
              TrangThai: 'THANH_CONG',
              NgayGiaoDich: new Date(),
            },
          });

          await tx.phieuDatVe.update({
            where: { MaPhieuDat: transaction.MaPhieuDat },
            data: { TrangThai: 'DA_THANH_TOAN' },
          });

          const seatIds = transaction.PhieuDatVe.ChiTietDatVes.map((ct) => ct.MaGheSuatChieu);
          await tx.gheSuatChieu.updateMany({
            where: { MaGheSuatChieu: { in: seatIds } },
            data: {
              TrangThai: 'DA_DAT',
              ThoiGianGiuGhe: null,
              MaTaiKhoanGiu: null,
            },
          });
        });

        transaction.TrangThai = 'THANH_CONG';
        transaction.PhieuDatVe.TrangThai = 'DA_THANH_TOAN';
      } else if (['CANCELLED', 'EXPIRED', 'FAILED'].includes(payosLink.status)) {
        await prisma.$transaction(async (tx) => {
          const currentTx = await tx.giaoDich.findUnique({
            where: { MaGiaoDich: transaction.MaGiaoDich },
          });
          if (!currentTx || currentTx.TrangThai !== 'CHO_XU_LY') return;

          await tx.giaoDich.update({
            where: { MaGiaoDich: transaction.MaGiaoDich },
            data: { TrangThai: 'THAT_BAI' },
          });

          await tx.phieuDatVe.update({
            where: { MaPhieuDat: transaction.MaPhieuDat },
            data: { TrangThai: 'DA_HUY' },
          });

          const seatIds = transaction.PhieuDatVe.ChiTietDatVes.map((ct) => ct.MaGheSuatChieu);
          await tx.gheSuatChieu.updateMany({
            where: {
              MaGheSuatChieu: { in: seatIds },
              TrangThai: 'DANG_GIU',
            },
            data: {
              TrangThai: 'TRONG',
              ThoiGianGiuGhe: null,
              MaTaiKhoanGiu: null,
            },
          });
        });

        transaction.TrangThai = 'THAT_BAI';
        transaction.PhieuDatVe.TrangThai = 'DA_HUY';
      }
    } catch (err) {
      console.error('[Sync Status checkPaymentStatus] Lỗi khi đồng bộ từ PayOS API:', err);
    }
  }

  return {
    maGiaoDich: transaction.MaGiaoDich,
    maPhieuDat: transaction.MaPhieuDat,
    trangThaiGiaoDich: transaction.TrangThai,
    trangThaiPhieuDatVe: transaction.PhieuDatVe.TrangThai,
    phuongThuc: transaction.PhuongThuc,
    soTien: Number(transaction.SoTien),
    ngayGiaoDich: transaction.NgayGiaoDich,
    orderCode: transaction.MaGiaoDichNgoai ? Number(transaction.MaGiaoDichNgoai) : null,
  };
};
