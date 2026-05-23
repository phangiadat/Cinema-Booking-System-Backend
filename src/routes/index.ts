import { Router, Request, Response } from 'express';
import authRoutes from './auth.routes';
import phimRoutes from './phim.routes';
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

export default router;
