import { Router } from 'express';
import { Role } from '@prisma/client';
import * as taiKhoanController from '../controllers/taiKhoan.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRoles } from '../middlewares/role.middleware';

const router = Router();

/**
 * @route   GET /api/v1/tai-khoan/thong-tin
 * @desc    Lấy thông tin hồ sơ của khách hàng hiện tại
 * @access  Private (CUSTOMER)
 */
router.get(
  '/thong-tin',
  authMiddleware,
  requireRoles(Role.CUSTOMER),
  taiKhoanController.getThongTinTaiKhoan,
);

export default router;
