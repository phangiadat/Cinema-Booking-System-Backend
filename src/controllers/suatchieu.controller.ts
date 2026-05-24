import { Request, Response } from 'express';
import * as suatChieuService from '../services/suatchieu.service';
import { sendSuccess } from '../utils/response';
import { asyncHandler } from '../utils/asyncHandler';

/**
 * GET /api/v1/suat-chieu/:maSuatChieu/ghe
 */
export const getSeatMap = asyncHandler(async (req: Request, res: Response) => {
  const { maSuatChieu } = req.params as { maSuatChieu: string };
  const seatMap = await suatChieuService.getSeatMap(maSuatChieu);

  return sendSuccess(res, 'Lấy sơ đồ ghế thành công', seatMap);
});
