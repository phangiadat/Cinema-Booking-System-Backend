import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
} from '../validators/auth.validator';

const router = Router();

/**
 * @route   POST /api/v1/auth/register
 * @desc    Đăng ký tài khoản mới (vai trò CUSTOMER)
 * @access  Public
 */
router.post('/register', validate(registerSchema), authController.register);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Đăng nhập và nhận access token + refresh token
 * @access  Public
 */
router.post('/login', validate(loginSchema), authController.login);

/**
 * @route   POST /api/v1/auth/refresh-token
 * @desc    Làm mới access token bằng refresh token
 * @access  Public
 */
router.post(
  '/refresh-token',
  validate(refreshTokenSchema),
  authController.refreshToken,
);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Đăng xuất và thu hồi refresh token
 * @access  Private (requires valid access token)
 */
router.post('/logout', authMiddleware, authController.logout);

/**
 * @route   GET /api/v1/auth/me
 * @desc    Lấy thông tin tài khoản hiện tại
 * @access  Private (requires valid access token)
 */
router.get('/me', authMiddleware, authController.getMe);

export default router;
