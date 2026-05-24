import { Request, Response, NextFunction } from 'express';
import * as staffBanVeService from '../services/staffBanVe.service';
import { sendSuccess, sendPaginatedSuccess } from '../utils/response';
import { StaffShowtimeQueryInput } from '../validators/staffBanVe.validator';

/**
 * GET /api/v1/staff/ban-ve/suat-chieu
 * Lấy danh sách suất chiếu khả dụng tại quầy cho nhân viên
 */
export const getDanhSachSuatChieu = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const maTaiKhoan = req.user!.maTaiKhoan;
    const query = req.query as any as StaffShowtimeQueryInput;

    const result = await staffBanVeService.getShowtimesForStaff(maTaiKhoan, {
      keyword: query.keyword,
      ngayChieu: query.ngayChieu,
      maPhim: query.maPhim,
      maPhong: query.maPhong,
      page: query.page ?? 1,
      limit: query.limit ?? 10,
    });

    sendPaginatedSuccess(
      res,
      'Lấy danh sách suất chiếu thành công',
      result.showtimes,
      {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      }
    );
  } catch (error) {
    next(error);
  }
};
