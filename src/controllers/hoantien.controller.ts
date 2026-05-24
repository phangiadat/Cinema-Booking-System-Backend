import { Request, Response } from 'express';
import * as hoanTienService from '../services/hoantien.service';
import { sendSuccess } from '../utils/response';
import { asyncHandler } from '../utils/asyncHandler';
import { RefundRequestInput, RefundListQueryInput } from '../validators/hoantien.validator';

/**
 * POST /api/v1/hoan-tien/yeu-cau
 */
export const yeuCauHoanTien = asyncHandler(async (req: Request, res: Response) => {
  const input = req.body as RefundRequestInput;
  const maTaiKhoan = req.user!.maTaiKhoan;

  const result = await hoanTienService.yeuCauHoanTien(maTaiKhoan, input);

  return sendSuccess(res, 'Gửi yêu cầu hoàn tiền thành công', result);
});

/**
 * GET /api/v1/hoan-tien/cua-toi
 */
export const getHoanTienCuaToi = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as RefundListQueryInput;
  const maTaiKhoan = req.user!.maTaiKhoan;

  const result = await hoanTienService.getHoanTienCuaToi(maTaiKhoan, query);

  return res.status(200).json({
    success: true,
    message: 'Lấy danh sách yêu cầu hoàn tiền thành công',
    data: result.items,
    pagination: result.pagination,
  });
});
