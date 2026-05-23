import { Router } from 'express';
import * as phimController from '../controllers/phim.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRoles } from '../middlewares/role.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  createPhimSchema,
  updatePhimSchema,
  phimQuerySchema,
} from '../validators/phim.validator';
import { Role } from '@prisma/client';

const router = Router();

/**
 * @route   GET /api/v1/phim
 * @desc    Lấy danh sách phim (có thể lọc, tìm kiếm, phân trang)
 * @access  Public
 */
router.get(
  '/',
  validate(phimQuerySchema, 'query'),
  phimController.getDanhSachPhim,
);

/**
 * @route   GET /api/v1/phim/:maPhim
 * @desc    Lấy chi tiết một phim theo mã
 * @access  Public
 */
router.get('/:maPhim', phimController.getChiTietPhim);

/**
 * @route   POST /api/v1/phim
 * @desc    Tạo phim mới
 * @access  Private - ADMIN only
 */
router.post(
  '/',
  authMiddleware,
  requireRoles(Role.ADMIN),
  validate(createPhimSchema),
  phimController.taoPhim,
);

/**
 * @route   PUT /api/v1/phim/:maPhim
 * @desc    Cập nhật toàn bộ thông tin phim
 * @access  Private - ADMIN only
 */
router.put(
  '/:maPhim',
  authMiddleware,
  requireRoles(Role.ADMIN),
  validate(updatePhimSchema),
  phimController.capNhatPhim,
);

/**
 * @route   PATCH /api/v1/phim/:maPhim/soft-delete
 * @desc    Ẩn phim (soft delete - set KhaDung = false)
 * @access  Private - ADMIN only
 */
router.patch(
  '/:maPhim/soft-delete',
  authMiddleware,
  requireRoles(Role.ADMIN),
  phimController.anPhim,
);

/**
 * @route   DELETE /api/v1/phim/:maPhim
 * @desc    Xóa vĩnh viễn phim khỏi cơ sở dữ liệu
 * @access  Private - ADMIN only
 */
router.delete(
  '/:maPhim',
  authMiddleware,
  requireRoles(Role.ADMIN),
  phimController.xoaPhim,
);

export default router;
