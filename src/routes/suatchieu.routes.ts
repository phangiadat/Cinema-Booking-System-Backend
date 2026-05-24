import { Router } from 'express';
import * as suatChieuController from '../controllers/suatchieu.controller';
import { validate } from '../middlewares/validate.middleware';
import { showtimeIdParamSchema } from '../validators/datve.validator';

const router = Router();

/**
 * @route   GET /api/v1/suat-chieu/:maSuatChieu/ghe
 * @desc    Lấy sơ đồ ghế và trạng thái giữ ghế của suất chiếu
 * @access  Public
 */
router.get(
  '/:maSuatChieu/ghe',
  validate(showtimeIdParamSchema, 'params'),
  suatChieuController.getSeatMap,
);

export default router;
