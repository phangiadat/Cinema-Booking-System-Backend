import { Role, TaiKhoan } from '@prisma/client';
import prisma from '../config/prisma';
import {
  findTaiKhoanByTenDangNhap,
  findTaiKhoanById,
  createTaiKhoan,
} from '../repositories/taikhoan.repository';
import {
  hashPassword,
  comparePassword,
  hashToken,
  compareToken,
} from '../utils/password';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  calculateExpiry,
  AccessTokenPayload,
} from '../utils/jwt';
import { env } from '../config/env';
import {
  RegisterInput,
  LoginInput,
  RefreshTokenInput,
} from '../validators/auth.validator';
import {
  UnauthorizedError,
  ConflictError,
  NotFoundError,
  BadRequestError,
} from '../utils/errors';

// ========================
// Types
// ========================
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResult {
  taiKhoan: Omit<TaiKhoan, 'MatKhau'>;
  tokens: AuthTokens;
}

// ========================
// Helper: Build user safe object (no MatKhau)
// ========================
const sanitizeTaiKhoan = (taiKhoan: TaiKhoan): Omit<TaiKhoan, 'MatKhau'> => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { MatKhau, ...safe } = taiKhoan;
  return safe;
};

// ========================
// Helper: Create and store refresh token
// ========================
const createAndStoreRefreshToken = async (
  maTaiKhoan: string,
  taiKhoan: TaiKhoan,
): Promise<string> => {
  // Generate a temp refresh token ID first, then sign proper token
  const tempId = crypto.randomUUID();

  const refreshToken = signRefreshToken({
    maTaiKhoan,
    maRefreshToken: tempId,
  });

  const tokenHash = await hashToken(refreshToken);
  const expiresAt = calculateExpiry(env.REFRESH_TOKEN_EXPIRES_IN);

  // Store in DB using the same UUID as token identifier
  await prisma.refreshToken.create({
    data: {
      MaRefreshToken: tempId,
      MaTaiKhoan: maTaiKhoan,
      TokenHash: tokenHash,
      HetHanLuc: expiresAt,
      BiThuHoi: false,
    },
  });

  return refreshToken;
};

// ========================
// Service: Register
// ========================
export const register = async (input: RegisterInput): Promise<AuthResult> => {
  // Check duplicate username
  const existingByUsername = await findTaiKhoanByTenDangNhap(input.TenDangNhap);
  if (existingByUsername) {
    throw new ConflictError('Tên đăng nhập đã được sử dụng');
  }

  // Check duplicate email
  const existingByEmail = await prisma.taiKhoan.findUnique({
    where: { Email: input.Email },
  });
  if (existingByEmail) {
    throw new ConflictError('Email đã được sử dụng');
  }

  // Check duplicate phone
  const existingByPhone = await prisma.taiKhoan.findUnique({
    where: { SoDienThoai: input.SoDienThoai },
  });
  if (existingByPhone) {
    throw new ConflictError('Số điện thoại đã được sử dụng');
  }

  // Hash password
  const hashedPassword = await hashPassword(input.MatKhau);

  // Create account (default role: CUSTOMER)
  const taiKhoan = await createTaiKhoan({
    TenDangNhap: input.TenDangNhap,
    MatKhau: hashedPassword,
    HoTen: input.HoTen,
    Email: input.Email,
    SoDienThoai: input.SoDienThoai,
    GioiTinh: input.GioiTinh,
    NgaySinh: input.NgaySinh,
    VaiTro: Role.CUSTOMER,
  });

  // Generate tokens
  const accessToken = signAccessToken({
    maTaiKhoan: taiKhoan.MaTaiKhoan,
    tenDangNhap: taiKhoan.TenDangNhap,
    vaiTro: taiKhoan.VaiTro,
  });

  const refreshToken = await createAndStoreRefreshToken(
    taiKhoan.MaTaiKhoan,
    taiKhoan,
  );

  return {
    taiKhoan: sanitizeTaiKhoan(taiKhoan),
    tokens: { accessToken, refreshToken },
  };
};

// ========================
// Service: Login
// ========================
export const login = async (input: LoginInput): Promise<AuthResult> => {
  const taiKhoan = await findTaiKhoanByTenDangNhap(input.TenDangNhap);

  if (!taiKhoan) {
    throw new UnauthorizedError('Tên đăng nhập hoặc mật khẩu không đúng');
  }

  if (!taiKhoan.KhaDung) {
    throw new UnauthorizedError('Tài khoản đã bị vô hiệu hóa');
  }

  const isPasswordValid = await comparePassword(input.MatKhau, taiKhoan.MatKhau);
  if (!isPasswordValid) {
    throw new UnauthorizedError('Tên đăng nhập hoặc mật khẩu không đúng');
  }

  // Generate tokens
  const accessToken = signAccessToken({
    maTaiKhoan: taiKhoan.MaTaiKhoan,
    tenDangNhap: taiKhoan.TenDangNhap,
    vaiTro: taiKhoan.VaiTro,
  });

  const refreshToken = await createAndStoreRefreshToken(
    taiKhoan.MaTaiKhoan,
    taiKhoan,
  );

  return {
    taiKhoan: sanitizeTaiKhoan(taiKhoan),
    tokens: { accessToken, refreshToken },
  };
};

// ========================
// Service: Refresh Token
// ========================
export const refreshAccessToken = async (
  input: RefreshTokenInput,
): Promise<{ accessToken: string }> => {
  let payload;
  try {
    payload = verifyRefreshToken(input.refreshToken);
  } catch {
    throw new UnauthorizedError('Refresh token không hợp lệ hoặc đã hết hạn');
  }

  // Find the stored refresh token record
  const storedToken = await prisma.refreshToken.findUnique({
    where: { MaRefreshToken: payload.maRefreshToken },
    include: { TaiKhoan: true },
  });

  if (!storedToken) {
    throw new UnauthorizedError('Refresh token không tồn tại');
  }

  if (storedToken.BiThuHoi) {
    throw new UnauthorizedError('Refresh token đã bị thu hồi');
  }

  if (storedToken.HetHanLuc < new Date()) {
    throw new UnauthorizedError('Refresh token đã hết hạn');
  }

  // Verify the token hash
  const isValid = await compareToken(input.refreshToken, storedToken.TokenHash);
  if (!isValid) {
    throw new UnauthorizedError('Refresh token không hợp lệ');
  }

  if (!storedToken.TaiKhoan.KhaDung) {
    throw new UnauthorizedError('Tài khoản đã bị vô hiệu hóa');
  }

  // Issue new access token
  const accessToken = signAccessToken({
    maTaiKhoan: storedToken.TaiKhoan.MaTaiKhoan,
    tenDangNhap: storedToken.TaiKhoan.TenDangNhap,
    vaiTro: storedToken.TaiKhoan.VaiTro,
  });

  return { accessToken };
};

// ========================
// Service: Logout
// ========================
export const logout = async (
  maTaiKhoan: string,
  refreshToken?: string,
): Promise<void> => {
  if (refreshToken) {
    // Try to revoke the specific refresh token
    try {
      const payload = verifyRefreshToken(refreshToken);
      await prisma.refreshToken.updateMany({
        where: {
          MaRefreshToken: payload.maRefreshToken,
          MaTaiKhoan: maTaiKhoan,
        },
        data: { BiThuHoi: true },
      });
    } catch {
      // If token is invalid/expired, still proceed (revoke all)
    }
  } else {
    // Revoke all refresh tokens for this user
    await prisma.refreshToken.updateMany({
      where: { MaTaiKhoan: maTaiKhoan, BiThuHoi: false },
      data: { BiThuHoi: true },
    });
  }
};

// ========================
// Service: Get current user profile
// ========================
export const getMe = async (
  maTaiKhoan: string,
): Promise<Omit<TaiKhoan, 'MatKhau'>> => {
  const taiKhoan = await findTaiKhoanById(maTaiKhoan);

  if (!taiKhoan) {
    throw new NotFoundError('Không tìm thấy tài khoản');
  }

  return sanitizeTaiKhoan(taiKhoan);
};
