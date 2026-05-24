import { z } from 'zod';

export const createReviewSchema = z.object({
  MaPhim: z.string({
    required_error: 'Mã phim là bắt buộc',
  }).uuid('Mã phim phải là UUID hợp lệ'),
  SoSao: z.coerce.number({
    required_error: 'Số sao đánh giá là bắt buộc',
  }).int('Số sao phải là số nguyên').min(1, 'Số sao tối thiểu là 1').max(5, 'Số sao tối đa là 5'),
  BinhLuan: z.string().max(255, 'Bình luận không quá 255 ký tự').optional(),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;

export const movieReviewQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export type MovieReviewQueryInput = z.infer<typeof movieReviewQuerySchema>;
export const movieReviewParamsSchema = z.object({
  maPhim: z.string({
    required_error: 'Mã phim là bắt buộc',
  }).uuid('Mã phim phải là UUID hợp lệ'),
});
export type MovieReviewParamsInput = z.infer<typeof movieReviewParamsSchema>;
