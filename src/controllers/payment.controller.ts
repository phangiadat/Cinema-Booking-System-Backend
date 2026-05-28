import { Request, Response } from 'express';
import * as paymentService from '../services/payment.service';
import { sendSuccess } from '../utils/response';
import { asyncHandler } from '../utils/asyncHandler';
import { BadRequestError } from '../utils/errors';

/**
 * POST /api/v1/payment/payos/create
 * Auth: Customer only
 */
export const createPayosPayment = asyncHandler(async (req: Request, res: Response) => {
  const { MaPhieuDat } = req.body as { MaPhieuDat?: string };
  
  if (!MaPhieuDat) {
    throw new BadRequestError('Mã phiếu đặt (MaPhieuDat) là bắt buộc trong request body.');
  }

  const maTaiKhoan = req.user!.maTaiKhoan;
  const result = await paymentService.createPayosLink(MaPhieuDat, maTaiKhoan);

  return sendSuccess(res, 'Tạo link thanh toán PayOS thành công', result);
});

/**
 * GET /api/v1/payment/payos/:maGiaoDich/status
 * Auth: Customer only
 */
export const getPayosStatus = asyncHandler(async (req: Request, res: Response) => {
  const { maGiaoDich } = req.params as { maGiaoDich?: string };

  if (!maGiaoDich) {
    throw new BadRequestError('Mã giao dịch (maGiaoDich) là bắt buộc trong URL path.');
  }

  const maTaiKhoan = req.user!.maTaiKhoan;
  const result = await paymentService.checkPaymentStatus(maGiaoDich, maTaiKhoan);

  return sendSuccess(res, 'Lấy trạng thái thanh toán thành công', result);
});

/**
 * POST /api/v1/payment/payos/webhook
 * Auth: None (public, PayOS verifies checksum signature)
 */
export const payosWebhook = asyncHandler(async (req: Request, res: Response) => {
  const result = await paymentService.handleWebhook(req.body);

  return res.status(200).json({
    code: '00',
    desc: 'success',
    data: result,
  });
});
