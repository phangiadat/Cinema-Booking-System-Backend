import { Router, Request, Response } from 'express';
import authRoutes from './auth.routes';
import phimRoutes from './phim.routes';
import suatChieuRoutes from './suatchieu.routes';
import adminRouter from './admin';
import datVeRoutes from './datve.routes';
import lichsuRoutes from './lichsu.routes';
import danhgiaRoutes from './danhgia.routes';
import hoantienRoutes from './hoantien.routes';
import taiKhoanRoutes from './taiKhoan.routes';
import staffBanVeRoutes from './staffBanVe.routes';
import staffSoatVeRoutes from './staffSoatVe.routes';
import staffLichLamViecRoutes from './staffLichLamViec.routes';
import staffHoSoRoutes from './staffHoSo.routes';
import paymentRoutes from './payment.routes';
import { sendSuccess } from '../utils/response';

const router = Router();

// ========================
// Health Check
// ========================
router.get('/health', (req: Request, res: Response) => {
  sendSuccess(res, 'Máy chủ đang hoạt động bình thường', {
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV ?? 'development',
  });
});

// ========================
// Mount Feature Routes
// ========================
router.use('/auth', authRoutes);
router.use('/phim', phimRoutes);
router.use('/suat-chieu', suatChieuRoutes);
router.use('/admin', adminRouter);
router.use('/dat-ve', datVeRoutes);
router.use('/payment', paymentRoutes);
router.use('/lich-su-giao-dich', lichsuRoutes);
router.use('/danh-gia', danhgiaRoutes);
router.use('/hoan-tien', hoantienRoutes);
router.use('/tai-khoan', taiKhoanRoutes);
router.use('/', staffBanVeRoutes);
router.use('/', staffSoatVeRoutes);
router.use('/', staffLichLamViecRoutes);
router.use('/', staffHoSoRoutes);

export default router;

