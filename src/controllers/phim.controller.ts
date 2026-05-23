import { Request, Response, NextFunction } from 'express';
import * as phimService from '../services/phim.service';
import { sendSuccess, sendCreated } from '../utils/response';
import { CreatePhimInput, UpdatePhimInput, PhimQueryInput } from '../validators/phim.validator';

// ========================
// GET /phim
// ========================
export const getDanhSachPhim = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const query = req.query as unknown as PhimQueryInput;
    const result = await phimService.getDanhSachPhim(query);

    sendSuccess(res, 'Lấy danh sách phim thành công', result);
  } catch (error) {
    next(error);
  }
};

// ========================
// GET /phim/:maPhim
// ========================
export const getChiTietPhim = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { maPhim } = req.params;
    const phim = await phimService.getChiTietPhim(maPhim);

    sendSuccess(res, 'Lấy chi tiết phim thành công', phim);
  } catch (error) {
    next(error);
  }
};

// ========================
// POST /phim
// ========================
export const taoPhim = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const input = req.body as CreatePhimInput;
    const phim = await phimService.taoPhim(input);

    sendCreated(res, 'Tạo phim thành công', phim);
  } catch (error) {
    next(error);
  }
};

// ========================
// PUT /phim/:maPhim
// ========================
export const capNhatPhim = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { maPhim } = req.params;
    const input = req.body as UpdatePhimInput;
    const phim = await phimService.capNhatPhim(maPhim, input);

    sendSuccess(res, 'Cập nhật phim thành công', phim);
  } catch (error) {
    next(error);
  }
};

// ========================
// PATCH /phim/:maPhim/soft-delete
// ========================
export const anPhim = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { maPhim } = req.params;
    const phim = await phimService.anPhim(maPhim);

    sendSuccess(res, 'Ẩn phim thành công', phim);
  } catch (error) {
    next(error);
  }
};

// ========================
// DELETE /phim/:maPhim
// ========================
export const xoaPhim = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { maPhim } = req.params;
    await phimService.xoaPhim(maPhim);

    sendSuccess(res, 'Xóa phim thành công');
  } catch (error) {
    next(error);
  }
};
