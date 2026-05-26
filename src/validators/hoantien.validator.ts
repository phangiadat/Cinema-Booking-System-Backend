import { z } from 'zod';

export const refundRequestSchema = z.object({
  MaPhieuDat: z.string({
    required_error: 'Mã phiếu đặt vé là bắt buộc',
  }).uuid('Mã phiếu đặt vé phải là UUID hợp lệ'),
  LyDo: z.string({
    required_error: 'Lý do hoàn tiền là bắt buộc',
  }).min(1, 'Lý do hoàn tiền không được để trống'),
});

export type RefundRequestInput = z.infer<typeof refundRequestSchema>;

export const refundListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export type RefundListQueryInput = z.infer<typeof refundListQuerySchema>;
