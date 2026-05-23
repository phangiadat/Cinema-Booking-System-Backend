import { Router } from 'express';
import * as datVeController from '../controllers/datve.controller';
import { validate } from '../middlewares/validate.middleware';
import { seatHoldSchema } from '../validators/datve.validator';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRoles } from '../middlewares/role.middleware';
import { Role } from '@prisma/client';

const router = Router();

/**
 * @route   POST /api/v1/dat-ve/giu-ghe
 * @desc    Giữ ghế cho khách hàng (5 phút)
 * @access  Private - CUSTOMER only
 */
router.post(
  '/giu-ghe',
  authMiddleware,
  requireRoles(Role.CUSTOMER),
  validate(seatHoldSchema),
  datVeController.giuGhe,
);

/**
 * @route   POST /api/v1/dat-ve/huy-giu-ghe
 * @desc    Hủy giữ ghế thủ công
 * @access  Private - CUSTOMER only
 */
router.post(
  '/huy-giu-ghe',
  authMiddleware,
  requireRoles(Role.CUSTOMER),
  validate(seatHoldSchema),
  datVeController.huyGiuGhe,
);

export default router;
