import { z } from 'zod';
import { TrangThaiPhieuDatVe } from '@prisma/client';

export const hoanTienSchema = z.object({
  SoTienHoan: z
    .number({
      required_error: 'Số tiền hoàn là bắt buộc',
      invalid_type_error: 'Số tiền hoàn phải là số hợp lệ',
    })
    .positive('Số tiền hoàn phải lớn hơn 0'),
  LyDo: z
    .string({ required_error: 'Lý do hoàn tiền là bắt buộc' })
    .min(1, 'Lý do hoàn tiền không được để trống')
    .max(500, 'Lý do hoàn tiền tối đa 500 ký tự'),
});

export const phieuDatQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).default(10),
  trangThai: z.nativeEnum(TrangThaiPhieuDatVe).optional(),
  search: z.string().optional(),
});

export type HoanTienInput = z.infer<typeof hoanTienSchema>;
export type PhieuDatQueryInput = z.infer<typeof phieuDatQuerySchema>;
