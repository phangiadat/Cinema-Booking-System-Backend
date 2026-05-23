import { Request, Response } from 'express';
import * as datVeService from '../services/datve.service';
import { sendSuccess } from '../utils/response';
import { asyncHandler } from '../utils/asyncHandler';
import { SeatHoldInput } from '../validators/datve.validator';

/**
 * POST /api/v1/dat-ve/giu-ghe
 */
export const giuGhe = asyncHandler(async (req: Request, res: Response) => {
  const { MaSuatChieu, DanhSachMaGheSuatChieu } = req.body as SeatHoldInput;
  const maTaiKhoan = req.user!.maTaiKhoan;

  const result = await datVeService.giuGhe(MaSuatChieu, DanhSachMaGheSuatChieu, maTaiKhoan);

  return sendSuccess(res, 'Giữ ghế thành công', result);
});

/**
 * POST /api/v1/dat-ve/huy-giu-ghe
 */
export const huyGiuGhe = asyncHandler(async (req: Request, res: Response) => {
  const { MaSuatChieu, DanhSachMaGheSuatChieu } = req.body as SeatHoldInput;
  const maTaiKhoan = req.user!.maTaiKhoan;

  const result = await datVeService.huyGiuGhe(MaSuatChieu, DanhSachMaGheSuatChieu, maTaiKhoan);

  return sendSuccess(res, 'Huỷ giữ ghế thành công', result);
});
