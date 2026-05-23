import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/auth.service';
import { sendSuccess, sendCreated } from '../utils/response';
import { RegisterInput, LoginInput, RefreshTokenInput } from '../validators/auth.validator';

// ========================
// POST /auth/register
// ========================
export const register = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const input = req.body as RegisterInput;
    const result = await authService.register(input);

    sendCreated(res, 'Đăng ký tài khoản thành công', result);
  } catch (error) {
    next(error);
  }
};

// ========================
// POST /auth/login
// ========================
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const input = req.body as LoginInput;
    const result = await authService.login(input);

    sendSuccess(res, 'Đăng nhập thành công', result);
  } catch (error) {
    next(error);
  }
};

// ========================
// POST /auth/refresh-token
// ========================
export const refreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const input = req.body as RefreshTokenInput;
    const result = await authService.refreshAccessToken(input);

    sendSuccess(res, 'Làm mới token thành công', result);
  } catch (error) {
    next(error);
  }
};

// ========================
// POST /auth/logout
// ========================
export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const maTaiKhoan = req.user!.maTaiKhoan;
    const { refreshToken: token } = req.body as { refreshToken?: string };

    await authService.logout(maTaiKhoan, token);

    sendSuccess(res, 'Đăng xuất thành công');
  } catch (error) {
    next(error);
  }
};

// ========================
// GET /auth/me
// ========================
export const getMe = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const maTaiKhoan = req.user!.maTaiKhoan;
    const taiKhoan = await authService.getMe(maTaiKhoan);

    sendSuccess(res, 'Lấy thông tin tài khoản thành công', taiKhoan);
  } catch (error) {
    next(error);
  }
};
