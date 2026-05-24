import { Request, Response, NextFunction } from 'express';
import * as taiKhoanService from '../services/taiKhoan.service';
import { sendSuccess } from '../utils/response';

/**
 * GET /api/v1/tai-khoan/thong-tin
 * Lấy thông tin tài khoản hiện tại (khách hàng)
 */
export const getThongTinTaiKhoan = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const maTaiKhoan = req.user!.maTaiKhoan;
    const profile = await taiKhoanService.getCurrentCustomerProfile(maTaiKhoan);

    sendSuccess(res, 'Lấy thông tin tài khoản thành công', profile);
  } catch (error) {
    next(error);
  }
};
