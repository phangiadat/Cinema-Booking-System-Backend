import { Router } from 'express';
import * as controller from '../controllers/suatchieu.controller';

const router = Router();

/**
 * @route   GET /api/v1/suat-chieu
 * @desc    Lấy danh sách suất chiếu (có thể lọc theo maPhim, maPhong, ngayChieu)
 * @access  Public
 */
router.get('/', controller.getDanhSachSuatChieu);

/**
 * @route   GET /api/v1/suat-chieu/:maSuatChieu
 * @desc    Lấy thông tin chi tiết một suất chiếu
 * @access  Public
 */
router.get('/:maSuatChieu', controller.getChiTietSuatChieu);

/**
 * @route   GET /api/v1/suat-chieu/:maSuatChieu/ghe
 * @desc    Lấy danh sách ghế của suất chiếu (sơ đồ ghế thực tế của suất chiếu để chọn)
 * @access  Public
 */
router.get('/:maSuatChieu/ghe', controller.getDanhSachGheSuatChieu);

export default router;
