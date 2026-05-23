import { z } from 'zod';

export const seatHoldSchema = z.object({
  MaSuatChieu: z.string({
    required_error: 'Mã suất chiếu là bắt buộc',
  }).uuid('Mã suất chiếu phải là định dạng UUID hợp lệ'),
  
  DanhSachMaGheSuatChieu: z
    .array(
      z.string().uuid('Mã ghế suất chiếu phải là định dạng UUID hợp lệ')
    , {
      required_error: 'Danh sách mã ghế là bắt buộc',
      invalid_type_error: 'Danh sách mã ghế phải là một mảng',
    })
    .min(1, 'Danh sách mã ghế phải có ít nhất 1 ghế'),
});

export type SeatHoldInput = z.infer<typeof seatHoldSchema>;

export const showtimeIdParamSchema = z.object({
  maSuatChieu: z.string().uuid('Mã suất chiếu phải là định dạng UUID hợp lệ'),
});

export type ShowtimeIdParam = z.infer<typeof showtimeIdParamSchema>;
