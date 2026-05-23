import { Router } from 'express';
import { Role } from '@prisma/client';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { requireRoles } from '../../middlewares/role.middleware';
import metadataRoutes from './metadata.routes';
import phongChieuRoutes from './phongchieu.routes';

const router = Router();

// Apply auth and require admin role for all admin sub-routes
router.use(authMiddleware);
router.use(requireRoles(Role.ADMIN));

// Mount sub-routers
router.use('/', metadataRoutes);
router.use('/phong-chieu', phongChieuRoutes);

export default router;
