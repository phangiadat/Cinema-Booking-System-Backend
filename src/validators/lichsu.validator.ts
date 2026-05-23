import { z } from 'zod';

export const bookingHistoryQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  trangThai: z.enum(['CHO_THANH_TOAN', 'DA_THANH_TOAN', 'DA_HUY']).optional(),
  tuNgay: z.coerce.date().optional(),
  denNgay: z.coerce.date().optional(),
}).refine(
  (data) => {
    if (data.tuNgay && data.denNgay) {
      return data.denNgay >= data.tuNgay;
    }
    return true;
  },
  {
    message: 'Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu',
    path: ['denNgay'],
  }
);

export type BookingHistoryQueryInput = z.infer<typeof bookingHistoryQuerySchema>;

export const maPhieuDatParamSchema = z.object({
  maPhieuDat: z.string().uuid('Mã phiếu đặt vé phải là UUID hợp lệ'),
});

export type MaPhieuDatParam = z.infer<typeof maPhieuDatParamSchema>;
