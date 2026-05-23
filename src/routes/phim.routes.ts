import { Router } from 'express';
import * as phimController from '../controllers/phim.controller';
import { optionalAuthMiddleware } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { phimQuerySchema } from '../validators/phim.validator';

const router = Router();

/**
 * @route   GET /api/v1/phim
 * @desc    Lấy danh sách phim (có thể lọc, tìm kiếm, phân trang)
 * @access  Public (Optional auth to allow Admin to see inactive movies)
 */
router.get(
  '/',
  optionalAuthMiddleware,
  validate(phimQuerySchema, 'query'),
  phimController.getDanhSachPhim,
);

/**
 * @route   GET /api/v1/phim/:maPhim
 * @desc    Lấy chi tiết một phim theo mã
 * @access  Public (Optional auth to allow Admin to see inactive movie details)
 */
router.get(
  '/:maPhim',
  optionalAuthMiddleware,
  phimController.getChiTietPhim,
);

export default router;
