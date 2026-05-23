import { z } from 'zod';

// ========================
// Allowed values
// ========================
const GIOI_HAN_TUOI = ['P', 'C13', 'C16', 'C18'] as const;

// ========================
// Create Movie Validator
// ========================
export const createPhimSchema = z.object({
  TenPhim: z
    .string({ required_error: 'Tên phim là bắt buộc' })
    .min(1, 'Tên phim không được để trống')
    .max(255, 'Tên phim tối đa 255 ký tự'),

  ThoiLuong: z
    .number({ required_error: 'Thời lượng là bắt buộc' })
    .int('Thời lượng phải là số nguyên')
    .positive('Thời lượng phải lớn hơn 0'),

  TheLoai: z
    .string({ required_error: 'Thể loại là bắt buộc' })
    .min(1, 'Thể loại không được để trống')
    .max(255, 'Thể loại tối đa 255 ký tự'),

  NgayKhoiChieu: z
    .string({ required_error: 'Ngày khởi chiếu là bắt buộc' })
    .min(1, 'Ngày khởi chiếu không được để trống')
    .transform((val) => new Date(val))
    .refine((val) => !isNaN(val.getTime()), 'Ngày khởi chiếu không hợp lệ'),

  NgayKetThuc: z
    .string()
    .optional()
    .nullable()
    .transform((val) => (val ? new Date(val) : null))
    .refine(
      (val) => val === null || !isNaN(val.getTime()),
      'Ngày kết thúc không hợp lệ',
    ),

  DaoDien: z
    .string()
    .max(255, 'Tên đạo diễn tối đa 255 ký tự')
    .optional()
    .nullable(),

  DienVien: z.string().optional().nullable(),

  GioiHanTuoi: z.enum(GIOI_HAN_TUOI, {
    required_error: 'Giới hạn tuổi là bắt buộc',
    invalid_type_error: `Giới hạn tuổi phải là một trong: ${GIOI_HAN_TUOI.join(', ')}`,
  }),

  NoiDung: z.string().optional().nullable(),

  Trailer: z
    .string({ required_error: 'Trailer là bắt buộc' })
    .min(1, 'Trailer không được để trống')
    .url('Trailer phải là URL hợp lệ'),

  HinhAnh: z
    .string()
    .max(500, 'Đường dẫn hình ảnh tối đa 500 ký tự')
    .optional()
    .nullable(),
});

export type CreatePhimInput = z.infer<typeof createPhimSchema>;

// ========================
// Update Movie Validator (all fields optional)
// ========================
export const updatePhimSchema = createPhimSchema.partial();

export type UpdatePhimInput = z.infer<typeof updatePhimSchema>;

// ========================
// Query Params Validator
// ========================
export const phimQuerySchema = z.object({
  keyword: z.string().optional(),
  theLoai: z.string().optional(),
  gioiHanTuoi: z.enum(GIOI_HAN_TUOI).optional(),
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .refine((val) => val >= 1, 'Trang phải lớn hơn hoặc bằng 1'),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 10))
    .refine(
      (val) => val >= 1 && val <= 100,
      'Số lượng mỗi trang phải từ 1 đến 100',
    ),
});

export type PhimQueryInput = z.infer<typeof phimQuerySchema>;
