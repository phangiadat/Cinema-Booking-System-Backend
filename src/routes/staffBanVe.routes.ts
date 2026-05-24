import { Router } from 'express';
import { Role } from '@prisma/client';
import * as staffBanVeController from '../controllers/staffBanVe.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRoles } from '../middlewares/role.middleware';
import { validate } from '../middlewares/validate.middleware';
import { staffShowtimeQuerySchema } from '../validators/staffBanVe.validator';

const router = Router();

/**
 * @route   GET /api/v1/staff/ban-ve/suat-chieu
 * @desc    Lấy danh sách suất chiếu khả dụng tại quầy cho nhân viên
 * @access  Private (STAFF only)
 */
router.get(
  '/staff/ban-ve/suat-chieu',
  authMiddleware,
  requireRoles(Role.STAFF),
  validate(staffShowtimeQuerySchema, 'query'),
  staffBanVeController.getDanhSachSuatChieu,
);

export default router;
