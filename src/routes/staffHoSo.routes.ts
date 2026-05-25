import { Router } from 'express';
import { Role } from '@prisma/client';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRoles } from '../middlewares/role.middleware';
import { validate } from '../middlewares/validate.middleware';
import * as staffHoSoController from '../controllers/staffHoSo.controller';
import * as staffDashboardController from '../controllers/staffDashboard.controller';
import {
  updateStaffProfileSchema,
  changeStaffPasswordSchema,
} from '../validators/staffHoSo.validator';

const router = Router();

/**
 * @route   GET /api/v1/staff/dashboard
 * @desc    Get real-time dashboard data for staff
 * @access  Private (STAFF only)
 */
router.get(
  '/staff/dashboard',
  authMiddleware,
  requireRoles(Role.STAFF),
  staffDashboardController.getDashboardData,
);

/**
 * @route   GET /api/v1/staff/ho-so
 * @desc    View authenticated staff member's own profile
 * @access  Private (STAFF only)
 */
router.get(
  '/staff/ho-so',
  authMiddleware,
  requireRoles(Role.STAFF),
  staffHoSoController.getHoSo,
);

/**
 * @route   PUT /api/v1/staff/ho-so
 * @desc    Update authenticated staff member's own profile
 * @access  Private (STAFF only)
 */
router.put(
  '/staff/ho-so',
  authMiddleware,
  requireRoles(Role.STAFF),
  validate(updateStaffProfileSchema, 'body'),
  staffHoSoController.capNhatHoSo,
);

/**
 * @route   PUT /api/v1/staff/doi-mat-khau
 * @desc    Change authenticated staff member's password (revokes all refresh tokens)
 * @access  Private (STAFF only)
 */
router.put(
  '/staff/doi-mat-khau',
  authMiddleware,
  requireRoles(Role.STAFF),
  validate(changeStaffPasswordSchema, 'body'),
  staffHoSoController.doiMatKhau,
);

export default router;
